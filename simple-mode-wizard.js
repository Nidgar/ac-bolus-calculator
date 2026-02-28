/**
 * SIMPLE MODE WIZARD v2.1 - Logique de composition guidée de repas
 *
 * IMPORTANT : N'instancie PLUS SimpleModeWizard automatiquement.
 * L'initialisation est déléguée à app.js (bootstrap unique).
 */

class SimpleModeWizard {
  constructor() {
    this.repasType = null;
    this.etapeCourante = 0;
    this.sousEtapeCourante = null;
    this.selections = {};
    this.totalGlucides = 0;
    this.totalIG = 0;

    // Garde-fou listeners : attachés une seule fois
    this._listenersAttached = false;
    this._initialized = false;
  }

  ouvrirWizard() {
    const overlay = document.getElementById('wizardOverlay');
    if (overlay) {
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  fermerWizard() {
    const overlay = document.getElementById('wizardOverlay');
    if (overlay) {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  ouvrirRepas(typeRepas) {
    console.log(`🚀 Ouverture directe du repas : ${typeRepas}`);
    this.repasType = typeRepas;
    this.etapeCourante = 0;
    this.sousEtapeCourante = null;
    this.selections = {};
    this.totalGlucides = 0;
    this.totalIG = 0;
    this.ouvrirWizard();
    this.afficherEtape();
  }

  /**
   * Initialisation idempotente : ne configure les listeners qu'une seule fois.
   * Peut être appelée plusieurs fois sans risque.
   */
  init() {
    if (this._initialized) {
      console.warn('⚠️ SimpleModeWizard.init() déjà appelé — skip');
      return false;
    }

    if (typeof SimpleModeData === 'undefined') {
      console.error('❌ SimpleModeData non chargé !');
      return false;
    }

    this.setupModalListeners();
    this._initialized = true;
    console.log('✅ SimpleModeWizard initialisé');
    return true;
  }

  /**
   * Configure les listeners de la modale.
   * Idempotent grâce au flag _listenersAttached.
   */
  setupModalListeners() {
    if (this._listenersAttached) {
      console.warn('⚠️ SimpleModeWizard.setupModalListeners() déjà appelé — skip');
      return;
    }

    const overlay = document.getElementById('wizardOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.fermerWizard();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('show')) {
        this.fermerWizard();
      }
    });

    this._listenersAttached = true;
    console.log('✅ SimpleModeWizard : listeners modale attachés');

    // ── Délégation sur #simpleModeContainer ──────────────────────────────
    // Capture tous les clics sur les boutons générés dynamiquement.
    // Les boutons portent data-action + data-* pour transmettre les paramètres.
    const container = document.getElementById('simpleModeContainer');
    if (container) {
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        switch (action) {
          case 'demarrer-wizard':      this.demarrerWizard(btn.dataset.repas);                                       break;
          case 'selectionner-aliment': this.selectionnerAliment(btn.dataset.etape, btn.dataset.aliment, btn.dataset.multi === 'true'); break;
          case 'selectionner-sous':    this.selectionnerAlimentSousEtape(btn.dataset.etape, btn.dataset.sous, btn.dataset.aliment, btn.dataset.multi === 'true'); break;
          case 'recherche-libre':      this.ouvrirRechercheLibre(btn.dataset.etape, btn.dataset.sous || null);       break;
          case 'passer-etape':         this.passerEtape();                                                           break;
          case 'passer-sous-etape':    this.passerSousEtape();                                                       break;
          case 'etape-precedente':     this.etapePrecedente();                                                       break;
          case 'etape-suivante':       this.etapeSuivante();                                                         break;
          case 'sous-etape-precedente':this.sousEtapePrecedente();                                                   break;
          case 'sous-etape-suivante':  this.sousEtapeSuivante();                                                     break;
          case 'toggle-recap':         this.toggleRecapAliments();                                                   break;
          case 'valider-repas':        this.validerRepas();                                                          break;
          default: console.warn(`⚠️ SimpleModeWizard : action inconnue "${action}"`);
        }
      });
    }
  }

  afficherChoixRepas() {
    const container = document.getElementById('simpleModeContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="wizardHeader">
        <h2>🌟 Composer mon repas</h2>
        <p>Quel repas vas-tu prendre ?</p>
      </div>
      <div class="repasTypeGrid">
        <button class="repasTypeCard" data-action="demarrer-wizard" data-repas="petit_dejeuner">
          <div class="repasTypeEmoji">🌅</div>
          <div class="repasTypeName">PETIT-DÉJ</div>
        </button>
        <button class="repasTypeCard" data-action="demarrer-wizard" data-repas="dejeuner">
          <div class="repasTypeEmoji">🍽️</div>
          <div class="repasTypeName">DÉJEUNER</div>
        </button>
        <button class="repasTypeCard" data-action="demarrer-wizard" data-repas="gouter">
          <div class="repasTypeEmoji">🧁</div>
          <div class="repasTypeName">GOÛTER</div>
        </button>
        <button class="repasTypeCard" data-action="demarrer-wizard" data-repas="diner">
          <div class="repasTypeEmoji">🌙</div>
          <div class="repasTypeName">DÎNER</div>
        </button>
      </div>
    `;
  }

  demarrerWizard(typeRepas) {
    console.log(`🚀 Démarrage wizard : ${typeRepas}`);
    this.repasType = typeRepas;
    this.etapeCourante = 0;
    this.sousEtapeCourante = null;
    this.selections = {};
    this.totalGlucides = 0;
    this.totalIG = 0;
    this.afficherEtape();
  }

  afficherEtape() {
    const structure = SimpleModeData.structures[this.repasType];
    if (!structure || this.etapeCourante >= structure.length) {
      this.afficherRecapitulatif();
      return;
    }
    const etape = structure[this.etapeCourante];
    if (etape.sousEtapes && etape.sousEtapes.length > 0) {
      this.afficherSousEtape(etape);
    } else {
      this.afficherEtapeSimple(etape);
    }
  }

  afficherEtapeSimple(etape) {
    const container = document.getElementById('simpleModeContainer');
    const structure = SimpleModeData.structures[this.repasType];
    const totalEtapes = structure.length;
    const aliments = SimpleModeData[etape.categorie] || [];

    let html = `
      <div class="wizardHeader">
        <div class="wizardProgress">Étape ${this.etapeCourante + 1}/${totalEtapes}</div>
        <h2>${etape.emoji} ${etape.question}</h2>
      </div>
      <div class="selectionsActuelles">${this.afficherSelectionsActuelles()}</div>
      <div class="alimentsGrid">
    `;

    aliments.forEach(aliment => {
      const isSelected = this.isAlimentSelected(etape.id, aliment.id);
      html += `
        <button class="alimentCard ${isSelected ? 'selected' : ''}"
                data-action="selectionner-aliment"
                data-etape="${etape.id}"
                data-aliment="${aliment.id}"
                data-multi="${etape.multiSelect}">
          <div class="alimentEmoji">${aliment.emoji}</div>
          <div class="alimentNom">${aliment.nom}</div>
          <div class="alimentGlucides">${aliment.glucides > 0 ? '+' + aliment.glucides + 'g' : '0g'}</div>
          ${isSelected ? '<div class="alimentCheck">✓</div>' : ''}
        </button>
      `;
    });

    html += `
      <button class="alimentCard alimentCardPlus" data-action="recherche-libre" data-etape="${etape.id}">
        <div class="alimentEmoji">➕</div>
        <div class="alimentNom">Autre</div>
        <div class="alimentGlucides">Rechercher</div>
      </button>
    `;

    if (etape.canSkip) {
      html += `
        <button class="alimentCard alimentCardNone" data-action="passer-etape">
          <div class="alimentEmoji">🚫</div>
          <div class="alimentNom">Aucun</div>
          <div class="alimentGlucides">Passer</div>
        </button>
      `;
    }

    html += `</div>
      <div class="wizardNavigation">
        <button class="btnSecondary" data-action="etape-precedente">← Retour</button>
        ${etape.canSkip ? `<button class="btnSecondary" data-action="passer-etape">Passer</button>` : ''}
        <button class="btnPrimary" data-action="etape-suivante">Suivant →</button>
      </div>
    `;

    container.innerHTML = html;
  }

  afficherSousEtape(etape) {
    if (this.sousEtapeCourante === null) this.sousEtapeCourante = 0;
    const sousEtape = etape.sousEtapes[this.sousEtapeCourante];

    if (!sousEtape) {
      this.sousEtapeCourante = null;
      this.etapeCourante++;
      this.afficherEtape();
      return;
    }

    const container = document.getElementById('simpleModeContainer');
    const structure = SimpleModeData.structures[this.repasType];
    const totalEtapes = structure.length;

    let aliments = [];
    if (sousEtape.categorie) {
      aliments = SimpleModeData[sousEtape.categorie] || [];
    } else if (sousEtape.categories) {
      sousEtape.categories.forEach(cat => { aliments = aliments.concat(SimpleModeData[cat] || []); });
    }

    let html = `
      <div class="wizardHeader">
        <div class="wizardProgress">Étape ${this.etapeCourante + 1}/${totalEtapes} - ${etape.titre}</div>
        <h2>${sousEtape.titre}</h2>
      </div>
      <div class="selectionsActuelles">${this.afficherSelectionsActuelles()}</div>
      <div class="alimentsGrid">
    `;

    aliments.forEach(aliment => {
      const isSelected = this.isAlimentSelectedInSousEtape(etape.id, sousEtape.id, aliment.id);
      html += `
        <button class="alimentCard ${isSelected ? 'selected' : ''}"
                data-action="selectionner-sous"
                data-etape="${etape.id}"
                data-sous="${sousEtape.id}"
                data-aliment="${aliment.id}"
                data-multi="${sousEtape.multiSelect}">
          <div class="alimentEmoji">${aliment.emoji}</div>
          <div class="alimentNom">${aliment.nom}</div>
          <div class="alimentGlucides">${aliment.glucides > 0 ? '+' + aliment.glucides + 'g' : '0g'}</div>
          ${isSelected ? '<div class="alimentCheck">✓</div>' : ''}
        </button>
      `;
    });

    html += `
      <button class="alimentCard alimentCardPlus" data-action="recherche-libre" data-etape="${etape.id}" data-sous="${sousEtape.id}">
        <div class="alimentEmoji">➕</div><div class="alimentNom">Autre</div><div class="alimentGlucides">Rechercher</div>
      </button>
    `;
    if (!sousEtape.obligatoire) {
      html += `
        <button class="alimentCard alimentCardNone" data-action="passer-sous-etape">
          <div class="alimentEmoji">🚫</div><div class="alimentNom">Aucun</div><div class="alimentGlucides">Passer</div>
        </button>
      `;
    }

    html += `</div>
      <div class="wizardNavigation">
        <button class="btnSecondary" data-action="sous-etape-precedente">← Retour</button>
        ${!sousEtape.obligatoire ? `<button class="btnSecondary" data-action="passer-sous-etape">Passer</button>` : ''}
        <button class="btnPrimary" data-action="sous-etape-suivante">Suivant →</button>
      </div>
    `;

    container.innerHTML = html;
  }

  selectionnerAliment(etapeId, alimentId, multiSelect) {
    if (!this.selections[etapeId]) this.selections[etapeId] = [];
    const index = this.selections[etapeId].findIndex(s => s.id === alimentId);
    if (multiSelect) {
      if (index >= 0) this.selections[etapeId].splice(index, 1);
      else {
        const aliment = this.trouverAliment(alimentId);
        if (aliment) this.selections[etapeId].push({ id: alimentId, ...aliment });
      }
    } else {
      const aliment = this.trouverAliment(alimentId);
      if (aliment) this.selections[etapeId] = [{ id: alimentId, ...aliment }];
    }
    this.calculerTotaux();
    this.afficherEtape();
  }

  selectionnerAlimentSousEtape(etapeId, sousEtapeId, alimentId, multiSelect) {
    if (!this.selections[etapeId]) this.selections[etapeId] = {};
    if (!this.selections[etapeId][sousEtapeId]) this.selections[etapeId][sousEtapeId] = [];
    const liste = this.selections[etapeId][sousEtapeId];
    const index = liste.findIndex(s => s.id === alimentId);
    if (multiSelect) {
      if (index >= 0) liste.splice(index, 1);
      else {
        const aliment = this.trouverAliment(alimentId);
        if (aliment) liste.push({ id: alimentId, ...aliment });
      }
    } else {
      const aliment = this.trouverAliment(alimentId);
      if (aliment) this.selections[etapeId][sousEtapeId] = [{ id: alimentId, ...aliment }];
    }
    this.calculerTotaux();
    this.afficherEtape();
  }

  trouverAliment(alimentId) {
    for (const [, aliments] of Object.entries(SimpleModeData)) {
      if (Array.isArray(aliments)) {
        const aliment = aliments.find(a => a.id === alimentId);
        if (aliment) return aliment;
      }
    }
    return null;
  }

  isAlimentSelected(etapeId, alimentId) {
    const selections = this.selections[etapeId];
    if (!selections || !Array.isArray(selections)) return false;
    return selections.some(s => s.id === alimentId);
  }

  isAlimentSelectedInSousEtape(etapeId, sousEtapeId, alimentId) {
    const etapeSelections = this.selections[etapeId];
    if (!etapeSelections || !etapeSelections[sousEtapeId]) return false;
    return etapeSelections[sousEtapeId].some(s => s.id === alimentId);
  }

  calculerTotaux() {
    let totalGlucides = 0;
    let totalIGPondere = 0;
    for (const [, selections] of Object.entries(this.selections)) {
      if (Array.isArray(selections)) {
        selections.forEach(a => {
          totalGlucides += a.glucides || 0;
          totalIGPondere += (a.glucides || 0) * (a.ig || 0);
        });
      } else if (typeof selections === 'object') {
        for (const [, liste] of Object.entries(selections)) {
          if (Array.isArray(liste)) {
            liste.forEach(a => {
              totalGlucides += a.glucides || 0;
              totalIGPondere += (a.glucides || 0) * (a.ig || 0);
            });
          }
        }
      }
    }
    this.totalGlucides = Math.round(totalGlucides);
    this.totalIG = totalGlucides > 0 ? Math.round(totalIGPondere / totalGlucides) : 0;
  }

  afficherSelectionsActuelles() {
    let items = [];
    for (const [, selections] of Object.entries(this.selections)) {
      if (Array.isArray(selections) && selections.length > 0) {
        items.push(...selections.map(s => `${s.emoji} ${s.nom}`));
      } else if (typeof selections === 'object') {
        for (const [, liste] of Object.entries(selections)) {
          if (Array.isArray(liste) && liste.length > 0) {
            items.push(...liste.map(s => `${s.emoji} ${s.nom}`));
          }
        }
      }
    }
    return `
      <div class="selectionsContainer">
        ${items.length === 0
          ? '<div class="selectionsEmpty">Aucun aliment sélectionné</div>'
          : `<div class="selectionsItems">${items.join(', ')}</div>`
        }
        <div class="selectionsTotalGlucides">🍬 Glucides : <strong>${this.totalGlucides}g</strong></div>
      </div>
    `;
  }

  etapePrecedente() {
    if (this.etapeCourante > 0) {
      this.etapeCourante--;
      this.sousEtapeCourante = null;
      this.afficherEtape();
    } else {
      this.afficherChoixRepas();
    }
  }

  etapeSuivante() {
    this.sousEtapeCourante = null;
    this.etapeCourante++;
    this.afficherEtape();
  }

  passerEtape() { this.etapeSuivante(); }

  sousEtapePrecedente() {
    if (this.sousEtapeCourante > 0) {
      this.sousEtapeCourante--;
      this.afficherEtape();
    } else {
      this.etapePrecedente();
    }
  }

  sousEtapeSuivante() {
    this.sousEtapeCourante++;
    this.afficherEtape();
  }

  passerSousEtape() { this.sousEtapeSuivante(); }

  ouvrirRechercheLibre(etapeId, sousEtapeId = null) {
    alert('🔍 Recherche libre : Fonctionnalité à venir\n\nPermettra de rechercher dans la base complète des 99 aliments.');
  }

  afficherRecapitulatif() {
    const container = document.getElementById('simpleModeContainer');
    const conseil = this.getConseilBolus();
    let html = `
      <div class="wizardHeader">
        <h2>✅ TON REPAS EST PRÊT !</h2>
      </div>
      <h3 style="text-align:center;margin:16px 0;">${this.getRepasEmoji()} ${this.getRepasNom()}</h3>
      <div class="recapTotaux">
        <div class="recapTotalItems">
          <div class="recapTotalItem glucides">
            <div class="recapTotalLabel"><span class="emoji">📊</span> Glucides</div>
            <div class="recapTotalValue">${this.totalGlucides}g</div>
          </div>
          <div class="recapTotalItem ig">
            <div class="recapTotalLabel"><span class="emoji">📈</span> IG Moyen</div>
            <div class="recapTotalValue">${this.totalIG} ${this.getIGColor()}</div>
          </div>
        </div>
        <div class="recapConseil"><span class="icon">${conseil.icon}</span>${conseil.message}</div>
      </div>
      <div class="recapAccordeon">
        <button class="recapAccordeonBtn" data-action="toggle-recap" id="recapAccordeonBtn">
          <span id="recapAccordeonIcon">▼</span> Voir la liste des aliments
        </button>
        <div class="recapAliments" id="recapAliments" style="display:none;">
    `;

    const structure = SimpleModeData.structures[this.repasType];
    structure.forEach(etape => {
      const selections = this.selections[etape.id];
      if (!selections) return;
      html += `<div class="recapSection"><div class="recapSectionTitle">${etape.emoji} ${etape.titre}</div>`;
      if (Array.isArray(selections)) {
        selections.forEach(a => { html += `<div class="recapItem">${a.emoji} ${a.nom} <span class="recapGlucides">${a.glucides}g</span></div>`; });
      } else if (typeof selections === 'object') {
        for (const [, liste] of Object.entries(selections)) {
          if (Array.isArray(liste)) {
            liste.forEach(a => { html += `<div class="recapItem">${a.emoji} ${a.nom} <span class="recapGlucides">${a.glucides}g</span></div>`; });
          }
        }
      }
      html += `</div>`;
    });

    html += `
        </div>
      </div>
      <div class="wizardNavigation">
        <button class="btnSecondary" data-action="etape-precedente">✏️ Modifier le repas</button>
        <button class="btnPrimary btnLarge" data-action="valider-repas">✅ CALCULER MON BOLUS</button>
      </div>
    `;

    container.innerHTML = html;
  }

  validerRepas() {
    if (this.totalGlucides === 0) {
      alert('⚠️ Ton repas ne contient aucun glucide !\n\nAjoute au moins un aliment avec des glucides.');
      return;
    }

    const carbsInput = document.getElementById('carbFast') || document.getElementById('carbs');
    if (carbsInput) {
      carbsInput.value = this.totalGlucides;
      carbsInput.dispatchEvent(new Event('input', { bubbles: true }));
      carbsInput.dispatchEvent(new Event('change', { bubbles: true }));
      carbsInput.dispatchEvent(new Event('blur', { bubbles: true }));
      console.log(`✅ ${this.totalGlucides}g glucides injectés dans le calculateur`);

      const statusNode = document.getElementById('statusFast') || document.getElementById('status');
      if (statusNode) {
        const conseil = this.getConseilBolus();
        statusNode.innerHTML = `
          <div class="wizard-message" data-wizard-preserved="true" style="display:flex;width:100%;gap:16px;align-items:flex-start;">
            <div style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:4px;">
              <span style="font-size:32px;" aria-hidden="true">✅</span>
              <span style="font-weight:900;font-size:14px;white-space:nowrap;">Repas validé</span>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
              <div style="font-weight:900;font-size:16px;">🍬 ${this.totalGlucides}g de glucides • 📊 IG moyen: ${this.totalIG}</div>
              <div style="padding:10px 12px;background:rgba(255,255,255,0.1);border-radius:8px;font-weight:800;font-size:14px;">
                ${conseil.icon} ${conseil.message}
              </div>
            </div>
          </div>
        `;
        statusNode.className = 'status ok';
        statusNode.style.display = 'block';
      }
      this.fermerWizard();
    } else {
      console.error('❌ Champ glucides introuvable');
      alert('Erreur : Impossible d\'injecter les glucides dans le calculateur.');
    }
  }

  toggleRecapAliments() {
    const alimentsDiv = document.getElementById('recapAliments');
    const btn = document.getElementById('recapAccordeonBtn');
    if (!alimentsDiv || !btn) return;
    const isHidden = alimentsDiv.style.display === 'none';
    alimentsDiv.style.display = isHidden ? 'block' : 'none';
    btn.innerHTML = `<span id="recapAccordeonIcon">${isHidden ? '▲' : '▼'}</span> ${isHidden ? 'Masquer' : 'Voir'} la liste des aliments`;
  }

  getRepasEmoji() {
    return { petit_dejeuner: '🌅', dejeuner: '🍽️', gouter: '🧁', diner: '🌙' }[this.repasType] || '🍽️';
  }

  getRepasNom() {
    return { petit_dejeuner: 'PETIT-DÉJEUNER', dejeuner: 'DÉJEUNER', gouter: 'GOÛTER', diner: 'DÎNER' }[this.repasType] || 'REPAS';
  }

  getIGColor() {
    if (this.totalIG < 55) return '🟢';
    if (this.totalIG <= 70) return '🟡';
    return '🔴';
  }

  getConseilBolus() {
    if (this.totalIG < 55) return { icon: '🟢', message: 'Bolus normal : 10-15 min avant le repas' };
    if (this.totalIG <= 70) return { icon: '🟡', message: 'Bolus rapide : 5-10 min avant le repas' };
    return { icon: '🔴', message: 'Bolus fractionné : 60% avant, 40% après 30-45 min' };
  }
}

// ─── PAS D'AUTO-INITIALISATION ───────────────────────────────────────────────
// L'instanciation est déléguée à app.js pour éviter toute double initialisation.
// Ne pas ajouter de DOMContentLoaded ou window.load ici.
