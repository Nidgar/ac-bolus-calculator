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
    this.totalCG = 0;

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
    this.totalCG = 0;
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
          case 'recherche-wizard-nav': this.ouvrirRechercheLibre(btn.dataset.etape, btn.dataset.sous || null);       break;
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
    this.totalCG = 0;
    // P2 Issue 7 — Déverrouiller le champ glucides si le wizard est relancé
    if (typeof unlockCarbField === 'function') unlockCarbField();
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
      const hasGluc    = aliment.glucides > 0;
      const glucLabel  = hasGluc
        ? `+${aliment.glucides}g glucides`
        : '0g glucides';
      html += `
        <button class="alimentCard ${isSelected ? 'selected' : ''}"
                data-action="selectionner-aliment"
                data-etape="${etape.id}"
                data-aliment="${aliment.id}"
                data-multi="${etape.multiSelect}">
          <div class="alimentEmoji">${aliment.emoji}</div>
          <div class="alimentNom">${aliment.nom}</div>
          ${aliment.portion ? `<div class="alimentPortion">📏 ${aliment.portion}</div>` : ''}
          <div class="alimentGlucides${hasGluc ? '' : ' zero'}">${glucLabel}</div>
          ${isSelected ? '<div class="alimentCheck">✓</div>' : ''}
        </button>
      `;
    });

    html += `</div>
      <div class="wizardNavigation">
        <button class="btnSecondary" data-action="etape-precedente">← Retour</button>
        <button class="btnSecondary btnRechercher" data-action="recherche-wizard-nav" data-etape="${etape.id}">🔍 Rechercher</button>
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
      const hasGluc    = aliment.glucides > 0;
      const glucLabel  = hasGluc
        ? `+${aliment.glucides}g glucides`
        : '0g glucides';
      html += `
        <button class="alimentCard ${isSelected ? 'selected' : ''}"
                data-action="selectionner-sous"
                data-etape="${etape.id}"
                data-sous="${sousEtape.id}"
                data-aliment="${aliment.id}"
                data-multi="${sousEtape.multiSelect}">
          <div class="alimentEmoji">${aliment.emoji}</div>
          <div class="alimentNom">${aliment.nom}</div>
          ${aliment.portion ? `<div class="alimentPortion">📏 ${aliment.portion}</div>` : ''}
          <div class="alimentGlucides${hasGluc ? '' : ' zero'}">${glucLabel}</div>
          ${isSelected ? '<div class="alimentCheck">✓</div>' : ''}
        </button>
      `;
    });

    html += `</div>
      <div class="wizardNavigation">
        <button class="btnSecondary" data-action="sous-etape-precedente">← Retour</button>
        <button class="btnSecondary btnRechercher" data-action="recherche-wizard-nav" data-etape="${etape.id}" data-sous="${sousEtape.id}">🔍 Rechercher</button>
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
    let totalCG = 0;
    for (const [, selections] of Object.entries(this.selections)) {
      if (Array.isArray(selections)) {
        selections.forEach(a => {
          const gluc = a.glucides || 0;
          const ig   = a.ig       || 0;
          totalGlucides  += gluc;
          totalIGPondere += gluc * ig;
          totalCG        += (gluc * ig) / 100; // CG = (glucides × IG) / 100
        });
      } else if (typeof selections === 'object') {
        for (const [, liste] of Object.entries(selections)) {
          if (Array.isArray(liste)) {
            liste.forEach(a => {
              const gluc = a.glucides || 0;
              const ig   = a.ig       || 0;
              totalGlucides  += gluc;
              totalIGPondere += gluc * ig;
              totalCG        += (gluc * ig) / 100;
            });
          }
        }
      }
    }
    this.totalGlucides = Math.round(totalGlucides);
    this.totalIG = totalGlucides > 0 ? Math.round(totalIGPondere / totalGlucides) : 0;
    this.totalCG = Math.round(totalCG * 10) / 10; // 1 décimale
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

  /**
   * Compte dynamiquement le nombre d'aliments distincts dans la base.
   * Priorité : window.foodSearchUI.db.getTotalAliments() → SimpleModeData → fallback "?"
   */
  getTotalAlimentsDB() {
    // Source 1 : FoodDatabase via FoodSearchUI (la plus fiable — BDD complète chargée)
    try {
      const total = window.foodSearchUI?.db?.getTotalAliments?.();
      if (typeof total === 'number' && total > 0) return total;
    } catch (_) {}

    // Source 2 : Compter depuis SimpleModeData (données du wizard — sous-ensemble)
    try {
      let count = 0;
      const seen = new Set();
      for (const [, val] of Object.entries(SimpleModeData)) {
        if (Array.isArray(val)) {
          val.forEach(a => { if (a.id && !seen.has(a.id)) { seen.add(a.id); count++; } });
        }
      }
      if (count > 0) return count;
    } catch (_) {}

    return '?';
  }

  ouvrirRechercheLibre(etapeId, sousEtapeId = null) {
    // Évite les doublons
    const existingPopup = document.getElementById('rechercheComingSoonPopup');
    if (existingPopup) existingPopup.remove();

    const nbAliments = this.getTotalAlimentsDB();

    const popup = document.createElement('div');
    popup.id = 'rechercheComingSoonPopup';
    popup.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(0, 20, 60, 0.65);
      backdrop-filter: blur(6px);
      animation: fadeInPopup 0.2s ease;
    `;

    popup.innerHTML = `
      <style>
        @keyframes fadeInPopup {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUpPopup {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        #rechercheComingSoonCard {
          animation: slideUpPopup 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      </style>
      <div id="rechercheComingSoonCard" style="
        background: linear-gradient(145deg, #0e4fd6 0%, #1a6fff 50%, #0a3bbf 100%);
        border: 1.5px solid rgba(110, 180, 255, 0.45);
        border-radius: 20px;
        box-shadow: 0 24px 60px rgba(0, 60, 200, 0.5), 0 0 0 1px rgba(255,255,255,0.08) inset;
        max-width: 360px;
        width: 100%;
        padding: 36px 28px 28px;
        text-align: center;
        color: #fff;
        position: relative;
      ">
        <div style="font-size: 56px; line-height: 1; margin-bottom: 16px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));">🔍</div>
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: rgba(180, 215, 255, 0.85); margin-bottom: 10px;">Fonctionnalité à venir</div>
        <h2 style="font-size: 20px; font-weight: 900; margin: 0 0 14px; line-height: 1.3;">Recherche dans la base complète</h2>
        <p style="font-size: 14px; font-weight: 500; line-height: 1.6; color: rgba(200, 230, 255, 0.9); margin: 0 0 28px;">
          Bientôt, tu pourras rechercher parmi les <strong style="color:#fff;">${nbAliments} aliments</strong> de la base pour affiner la composition de ton repas.
        </p>
        <button id="rechercheComingSoonClose" style="
          background: rgba(255,255,255,0.18);
          border: 1.5px solid rgba(255,255,255,0.35);
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          padding: 12px 32px;
          cursor: pointer;
          transition: background 0.15s;
          width: 100%;
        ">OK, compris !</button>
      </div>
    `;

    // Fermeture via bouton
    popup.querySelector('#rechercheComingSoonClose').addEventListener('click', () => popup.remove());
    // Fermeture via clic sur le fond
    popup.addEventListener('click', (e) => { if (e.target === popup) popup.remove(); });
    // Fermeture via Escape
    const onKey = (e) => { if (e.key === 'Escape') { popup.remove(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);

    document.body.appendChild(popup);
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
        ${this.totalGlucides === 0
          ? `<div class="recapConseil"><div style="padding:10px 12px;background:rgba(110,231,255,0.08);border:1px solid rgba(110,231,255,0.25);border-radius:8px;font-weight:700;font-size:13px;color:var(--muted,#94a3b8);line-height:1.5;">⏳ <strong>Conseil bolus en attente</strong><br>Aucun glucide dans ce repas — le conseil de timing bolus ne s'applique pas.</div></div>`
          : `<div class="recapConseil"><span class="icon">${conseil.icon}</span>${conseil.message}</div>`
        }
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

  afficherAlerteAucunGlucide() {
    const existingPopup = document.getElementById('aucunGlucidePopup');
    if (existingPopup) existingPopup.remove();

    const isDark = (document.documentElement.dataset.theme !== 'clair');

    // Palette selon le thème
    const palette = isDark ? {
      overlay:    'rgba(0, 15, 50, 0.70)',
      cardBg:     'linear-gradient(150deg, #0a2e8a 0%, #1044cc 55%, #0831a8 100%)',
      border:     'rgba(80, 150, 255, 0.40)',
      shadow:     '0 24px 60px rgba(0, 40, 180, 0.55), 0 0 0 1px rgba(255,255,255,0.07) inset',
      badge:      'rgba(150, 200, 255, 0.80)',
      text:       '#ffffff',
      subtext:    'rgba(190, 220, 255, 0.88)',
      btnBg:      'rgba(255,255,255,0.16)',
      btnBorder:  'rgba(255,255,255,0.32)',
    } : {
      overlay:    'rgba(10, 30, 100, 0.45)',
      cardBg:     'linear-gradient(150deg, #2563eb 0%, #3b82f6 55%, #1d4ed8 100%)',
      border:     'rgba(147, 197, 253, 0.60)',
      shadow:     '0 24px 60px rgba(37, 99, 235, 0.40), 0 0 0 1px rgba(255,255,255,0.20) inset',
      badge:      'rgba(219, 234, 254, 0.95)',
      text:       '#ffffff',
      subtext:    'rgba(239, 246, 255, 0.92)',
      btnBg:      'rgba(255,255,255,0.22)',
      btnBorder:  'rgba(255,255,255,0.50)',
    };

    const popup = document.createElement('div');
    popup.id = 'aucunGlucidePopup';
    popup.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: ${palette.overlay};
      backdrop-filter: blur(6px);
      animation: fadeInPopup 0.2s ease;
    `;

    popup.innerHTML = `
      <style>
        #aucunGlucidePopup .agCard {
          animation: slideUpPopup 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      </style>
      <div class="agCard" style="
        background: ${palette.cardBg};
        border: 1.5px solid ${palette.border};
        border-radius: 20px;
        box-shadow: ${palette.shadow};
        max-width: 360px;
        width: 100%;
        padding: 36px 28px 28px;
        text-align: center;
        color: ${palette.text};
        position: relative;
      ">
        <div style="font-size: 62px; line-height: 1; margin-bottom: 14px; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.35));">🍬</div>
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: ${palette.badge}; margin-bottom: 10px;">Repas sans glucides</div>
        <h2 style="font-size: 20px; font-weight: 900; margin: 0 0 14px; line-height: 1.3; color: ${palette.text};">Aucun glucide détecté !</h2>
        <p style="font-size: 14px; font-weight: 500; line-height: 1.65; color: ${palette.subtext}; margin: 0 0 28px;">
          Ton repas ne contient <strong style="color:${palette.text};">aucun glucide</strong>.<br>
          Sélectionne au moins un aliment sucré ou féculent pour calculer ton bolus.
        </p>
        <button id="aucunGlucideClose" style="
          background: ${palette.btnBg};
          border: 1.5px solid ${palette.btnBorder};
          border-radius: 12px;
          color: ${palette.text};
          font-size: 15px;
          font-weight: 800;
          padding: 12px 32px;
          cursor: pointer;
          width: 100%;
        ">OK, je vais ajouter un aliment</button>
      </div>
    `;

    popup.querySelector('#aucunGlucideClose').addEventListener('click', () => popup.remove());
    popup.addEventListener('click', (e) => { if (e.target === popup) popup.remove(); });
    const onKey = (e) => { if (e.key === 'Escape') { popup.remove(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);

    document.body.appendChild(popup);
  }

  validerRepas() {
    if (this.totalGlucides === 0) {
      this.afficherAlerteAucunGlucide();
      return;
    }

    const carbsInput = document.getElementById('carbFast') || document.getElementById('carbs');
    if (carbsInput) {
      carbsInput.value = this.totalGlucides;
      carbsInput.dispatchEvent(new Event('input', { bubbles: true }));
      carbsInput.dispatchEvent(new Event('change', { bubbles: true }));
      carbsInput.dispatchEvent(new Event('blur', { bubbles: true }));
      console.log(`✅ ${this.totalGlucides}g glucides injectés dans le calculateur`);
      // P2 Issue 7 — Verrouiller le champ après injection pour éviter la double saisie
      if (typeof lockCarbField === 'function') lockCarbField('wizard-simple');

      const statusNode = document.getElementById('statusFast') || document.getElementById('status');
      if (statusNode) {
        const conseil  = this.getConseilBolus();
        const isSplit  = conseil.split === true;
        statusNode.innerHTML = `
          <div class="wizard-message" data-wizard-preserved="true" style="display:flex;width:100%;gap:16px;align-items:flex-start;">
            <div style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:4px;">
              <span style="font-size:32px;" aria-hidden="true">✅</span>
              <span style="font-weight:900;font-size:14px;white-space:nowrap;">Repas estimé</span>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
              <div style="font-weight:900;font-size:16px;">🍬 ${this.totalGlucides}g de glucides • 📊 IG moyen: ${this.totalIG}</div>
              <div style="font-size:11px;font-weight:700;color:var(--muted,#94a3b8);line-height:1.4;">
                ℹ️ Glucides approximatifs. Vérifie si besoin avec un adulte (portion réelle / étiquette).
              </div>
              ${this.totalGlucides === 0 ? `<div style="padding:10px 12px;background:rgba(110,231,255,0.08);border:1px solid rgba(110,231,255,0.25);border-radius:8px;font-weight:700;font-size:13px;color:var(--muted,#94a3b8);line-height:1.5;">⏳ <strong>Conseil bolus en attente</strong><br>Aucun glucide dans ce repas — le conseil de timing bolus ne s'applique pas.</div>`
              : isSplit ? `
              <button
                id="applyIGOptimBtn"
                style="width:100%;padding:10px 14px;background:rgba(251,191,36,0.18);color:inherit;border:1.5px solid rgba(251,191,36,0.5);border-radius:10px;cursor:pointer;font-weight:800;font-size:14px;text-align:center;"
                aria-expanded="false"
                aria-controls="igOptimContentWizard"
              >${conseil.icon} Voir le repère bolus (IG élevé)</button>
              <div id="igOptimContentWizard" hidden style="display:flex;flex-direction:column;gap:8px;">
                <div style="background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.4);border-radius:8px;padding:8px 10px;font-size:12px;line-height:1.5;">
                  📋 <strong>Information éducative — non médicale.</strong><br>
                  Applique uniquement ce qui est prévu dans ton plan. Valide avec un adulte ou ton équipe soignante avant tout changement.
                </div>
                <div style="padding:10px 12px;background:rgba(255,255,255,0.1);border-radius:8px;font-weight:800;font-size:14px;">
                  ${conseil.icon} ${conseil.message}
                </div>
              </div>
              ` : `
              <div style="padding:10px 12px;background:rgba(255,255,255,0.1);border-radius:8px;font-weight:800;font-size:14px;">
                ${conseil.icon} ${conseil.message}
              </div>
              `}
            </div>
          </div>
        `;
        statusNode.className = 'status ok';
        statusNode.style.display = 'block';

        const applyBtn = document.getElementById('applyIGOptimBtn');
        if (applyBtn) {
          applyBtn.addEventListener('click', () => {
            const content = document.getElementById('igOptimContentWizard');
            const isOpen  = applyBtn.getAttribute('aria-expanded') === 'true';
            applyBtn.setAttribute('aria-expanded', String(!isOpen));
            if (content) content.hidden = isOpen;
            if (!isOpen) {
              applyBtn.textContent = `${conseil.icon} Repère bolus affiché ✓`;
              applyBtn.style.textAlign = 'center';
              applyBtn.style.background = 'rgba(52,211,153,0.15)';
              applyBtn.style.borderColor = 'rgba(52,211,153,0.5)';
            }
          });
        }
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
    if (this.totalIG <  70) return '🟡';
    return '🔴';
  }

  getConseilBolus() {
    if (this.totalIG < 55) return { icon: '🟢', message: 'Bolus normal : 10-15 min avant le repas', split: false };
    if (this.totalIG <  70) return { icon: '🟡', message: 'Bolus rapide : 5-10 min avant le repas', split: false };
    // IG > 70 → bolus en 2 temps, durée modulée par la CG
    let duree;
    if      (this.totalCG < 20) duree = '~1h après';
    else if (this.totalCG < 40) duree = '1h à 1h30 après';
    else                        duree = '1h30 à 2h après';
    return {
      icon: '🔴',
      message: `IG élevé : envisage un bolus en 2 temps — une partie avant, le reste ${duree} selon la durée du repas.`,
      split: true
    };
  }
}

// ─── PAS D'AUTO-INITIALISATION ───────────────────────────────────────────────
// L'instanciation est déléguée à app.js pour éviter toute double initialisation.
// Ne pas ajouter de DOMContentLoaded ou window.load ici.
