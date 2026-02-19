/**
 * SIMPLE MODE WIZARD - Logique de composition guidée de repas
 * Pour le mode simple du calculateur de bolus
 */

class SimpleModeWizard {
  constructor() {
    this.repasType = null;           // Type de repas sélectionné
    this.etapeCourante = 0;          // Index de l'étape courante
    this.sousEtapeCourante = null;   // Pour les sous-étapes (plat, dessert)
    this.selections = {};            // Toutes les sélections de l'utilisateur
    this.totalGlucides = 0;          // Total glucides calculé
    this.totalIG = 0;                // IG moyen calculé
    this.initialized = false;
  }

  /**
   * Ouvrir la modale wizard
   */
  ouvrirWizard() {
    const overlay = document.getElementById('wizardOverlay');
    if (overlay) {
      overlay.classList.add('show');
      // Empêcher le scroll du body
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Fermer la modale wizard
   */
  fermerWizard() {
    const overlay = document.getElementById('wizardOverlay');
    if (overlay) {
      overlay.classList.remove('show');
      // Réactiver le scroll du body
      document.body.style.overflow = '';
    }
  }

  /**
   * Ouvrir directement un type de repas (depuis les boutons)
   */
  ouvrirRepas(typeRepas) {
    console.log(`🚀 Ouverture directe du repas : ${typeRepas}`);
    
    // Réinitialiser l'état
    this.repasType = typeRepas;
    this.etapeCourante = 0;
    this.sousEtapeCourante = null;
    this.selections = {};
    this.totalGlucides = 0;
    this.totalIG = 0;
    
    // Ouvrir la modale
    this.ouvrirWizard();
    
    // Afficher directement la première étape (pas le choix de repas)
    this.afficherEtape();
  }

  /**
   * Initialisation du wizard
   */
  init() {
    if (this.initialized) return;
    
    console.log('🧙 SimpleModeWizard : Initialisation');
    
    // Vérifier que SimpleModeData est chargé
    if (typeof SimpleModeData === 'undefined') {
      console.error('❌ SimpleModeData non chargé !');
      return false;
    }
    
    this.initialized = true;
    
    // Ajouter les event listeners pour fermer la modale
    this.setupModalListeners();
    
    // NE PAS ouvrir la modale automatiquement
    // Elle sera ouverte quand l'utilisateur clique sur un bouton de repas
    
    return true;
  }

  /**
   * Configurer les event listeners pour la modale
   */
  setupModalListeners() {
    const overlay = document.getElementById('wizardOverlay');
    const modal = document.getElementById('wizardModal');
    
    // Fermer en cliquant sur l'overlay (pas sur la modale)
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.fermerWizard();
        }
      });
    }
    
    // Fermer avec la touche Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('show')) {
        this.fermerWizard();
      }
    });
  }

  /**
   * ÉTAPE 1 : Afficher le choix du type de repas
   */
  afficherChoixRepas() {
    const container = document.getElementById('simpleModeContainer');
    if (!container) {
      console.error('❌ #simpleModeContainer introuvable');
      return;
    }

    container.innerHTML = `
      <div class="wizardHeader">
        <h2>🌟 Composer mon repas</h2>
        <p>Quel repas vas-tu prendre ?</p>
      </div>
      
      <div class="repasTypeGrid">
        <button class="repasTypeCard" onclick="simpleModeWizard.demarrerWizard('petit_dejeuner')">
          <div class="repasTypeEmoji">🌅</div>
          <div class="repasTypeName">PETIT-DÉJ</div>
        </button>
        
        <button class="repasTypeCard" onclick="simpleModeWizard.demarrerWizard('dejeuner')">
          <div class="repasTypeEmoji">🍽️</div>
          <div class="repasTypeName">DÉJEUNER</div>
        </button>
        
        <button class="repasTypeCard" onclick="simpleModeWizard.demarrerWizard('gouter')">
          <div class="repasTypeEmoji">🧁</div>
          <div class="repasTypeName">GOÛTER</div>
        </button>
        
        <button class="repasTypeCard" onclick="simpleModeWizard.demarrerWizard('diner')">
          <div class="repasTypeEmoji">🌙</div>
          <div class="repasTypeName">DÎNER</div>
        </button>
      </div>
    `;
    
    console.log('✅ Écran de choix de repas affiché');
  }

  /**
   * Démarrer le wizard pour un type de repas
   */
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

  /**
   * Afficher l'étape courante
   */
  afficherEtape() {
    const structure = SimpleModeData.structures[this.repasType];
    if (!structure || this.etapeCourante >= structure.length) {
      this.afficherRecapitulatif();
      return;
    }

    const etape = structure[this.etapeCourante];
    
    // Vérifier si étape a des sous-étapes
    if (etape.sousEtapes && etape.sousEtapes.length > 0) {
      this.afficherSousEtape(etape);
    } else {
      this.afficherEtapeSimple(etape);
    }
  }

  /**
   * Afficher une étape simple (sans sous-étapes)
   */
  afficherEtapeSimple(etape) {
    const container = document.getElementById('simpleModeContainer');
    const structure = SimpleModeData.structures[this.repasType];
    const totalEtapes = structure.length;

    // Récupérer les aliments de la catégorie
    const aliments = SimpleModeData[etape.categorie] || [];
    
    // Construire le header
    let html = `
      <div class="wizardHeader">
        <div class="wizardProgress">Étape ${this.etapeCourante + 1}/${totalEtapes}</div>
        <h2>${etape.emoji} ${etape.question}</h2>
      </div>
      
      <div class="selectionsActuelles">
        ${this.afficherSelectionsActuelles()}
      </div>
      
      <div class="alimentsGrid">
    `;

    // Construire la grille d'aliments (4 colonnes)
    aliments.forEach(aliment => {
      const isSelected = this.isAlimentSelected(etape.id, aliment.id);
      html += `
        <button class="alimentCard ${isSelected ? 'selected' : ''}" 
                onclick="simpleModeWizard.selectionnerAliment('${etape.id}', '${aliment.id}', ${etape.multiSelect})">
          <div class="alimentEmoji">${aliment.emoji}</div>
          <div class="alimentNom">${aliment.nom}</div>
          <div class="alimentGlucides">${aliment.glucides > 0 ? '+' + aliment.glucides + 'g' : '0g'}</div>
          ${isSelected ? '<div class="alimentCheck">✓</div>' : ''}
        </button>
      `;
    });

    // Bouton [+] pour recherche libre
    html += `
      <button class="alimentCard alimentCardPlus" onclick="simpleModeWizard.ouvrirRechercheLibre('${etape.id}')">
        <div class="alimentEmoji">➕</div>
        <div class="alimentNom">Autre</div>
        <div class="alimentGlucides">Rechercher</div>
      </button>
    `;

    // Bouton [Aucun] si optionnel
    if (etape.canSkip) {
      html += `
        <button class="alimentCard alimentCardNone" onclick="simpleModeWizard.passerEtape()">
          <div class="alimentEmoji">🚫</div>
          <div class="alimentNom">Aucun</div>
          <div class="alimentGlucides">Passer</div>
        </button>
      `;
    }

    html += `</div>`; // Fin grille

    // Navigation
    html += `
      <div class="wizardNavigation">
        <button class="btnSecondary" onclick="simpleModeWizard.etapePrecedente()">
          ← Retour
        </button>
        ${etape.canSkip ? `
          <button class="btnSecondary" onclick="simpleModeWizard.passerEtape()">
            Passer
          </button>
        ` : ''}
        <button class="btnPrimary" onclick="simpleModeWizard.etapeSuivante()">
          Suivant →
        </button>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Afficher une étape avec sous-étapes (Plat, Dessert)
   */
  afficherSousEtape(etape) {
    // Si première fois sur cette étape, initialiser la sous-étape
    if (this.sousEtapeCourante === null) {
      this.sousEtapeCourante = 0;
    }

    const sousEtape = etape.sousEtapes[this.sousEtapeCourante];
    
    if (!sousEtape) {
      // Fin des sous-étapes, passer à l'étape suivante
      this.sousEtapeCourante = null;
      this.etapeCourante++;
      this.afficherEtape();
      return;
    }

    const container = document.getElementById('simpleModeContainer');
    const structure = SimpleModeData.structures[this.repasType];
    const totalEtapes = structure.length;

    // Récupérer les aliments
    let aliments = [];
    if (sousEtape.categorie) {
      aliments = SimpleModeData[sousEtape.categorie] || [];
    } else if (sousEtape.categories) {
      // Fusionner plusieurs catégories (ex: desserts fruits + sucrés)
      sousEtape.categories.forEach(cat => {
        aliments = aliments.concat(SimpleModeData[cat] || []);
      });
    }

    // Construire le header
    let html = `
      <div class="wizardHeader">
        <div class="wizardProgress">Étape ${this.etapeCourante + 1}/${totalEtapes} - ${etape.titre}</div>
        <h2>${sousEtape.titre}</h2>
      </div>
      
      <div class="selectionsActuelles">
        ${this.afficherSelectionsActuelles()}
      </div>
      
      <div class="alimentsGrid">
    `;

    // Construire la grille
    aliments.forEach(aliment => {
      const isSelected = this.isAlimentSelectedInSousEtape(etape.id, sousEtape.id, aliment.id);
      html += `
        <button class="alimentCard ${isSelected ? 'selected' : ''}" 
                onclick="simpleModeWizard.selectionnerAlimentSousEtape('${etape.id}', '${sousEtape.id}', '${aliment.id}', ${sousEtape.multiSelect})">
          <div class="alimentEmoji">${aliment.emoji}</div>
          <div class="alimentNom">${aliment.nom}</div>
          <div class="alimentGlucides">${aliment.glucides > 0 ? '+' + aliment.glucides + 'g' : '0g'}</div>
          ${isSelected ? '<div class="alimentCheck">✓</div>' : ''}
        </button>
      `;
    });

    // Boutons spéciaux
    html += `
      <button class="alimentCard alimentCardPlus" onclick="simpleModeWizard.ouvrirRechercheLibre('${etape.id}', '${sousEtape.id}')">
        <div class="alimentEmoji">➕</div>
        <div class="alimentNom">Autre</div>
        <div class="alimentGlucides">Rechercher</div>
      </button>
    `;

    if (!sousEtape.obligatoire) {
      html += `
        <button class="alimentCard alimentCardNone" onclick="simpleModeWizard.passerSousEtape()">
          <div class="alimentEmoji">🚫</div>
          <div class="alimentNom">Aucun</div>
          <div class="alimentGlucides">Passer</div>
        </button>
      `;
    }

    html += `</div>`; // Fin grille

    // Navigation
    html += `
      <div class="wizardNavigation">
        <button class="btnSecondary" onclick="simpleModeWizard.sousEtapePrecedente()">
          ← Retour
        </button>
        ${!sousEtape.obligatoire ? `
          <button class="btnSecondary" onclick="simpleModeWizard.passerSousEtape()">
            Passer
          </button>
        ` : ''}
        <button class="btnPrimary" onclick="simpleModeWizard.sousEtapeSuivante()">
          Suivant →
        </button>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Sélectionner un aliment dans une étape simple
   */
  selectionnerAliment(etapeId, alimentId, multiSelect) {
    if (!this.selections[etapeId]) {
      this.selections[etapeId] = [];
    }

    const index = this.selections[etapeId].findIndex(s => s.id === alimentId);

    if (multiSelect) {
      // Multi-sélection : toggle
      if (index >= 0) {
        this.selections[etapeId].splice(index, 1);
      } else {
        const aliment = this.trouverAliment(alimentId);
        if (aliment) {
          this.selections[etapeId].push({
            id: alimentId,
            ...aliment
          });
        }
      }
    } else {
      // Sélection unique : remplacer
      const aliment = this.trouverAliment(alimentId);
      if (aliment) {
        this.selections[etapeId] = [{
          id: alimentId,
          ...aliment
        }];
      }
    }

    this.calculerTotaux();
    this.afficherEtape(); // Refresh
  }

  /**
   * Sélectionner un aliment dans une sous-étape
   */
  selectionnerAlimentSousEtape(etapeId, sousEtapeId, alimentId, multiSelect) {
    if (!this.selections[etapeId]) {
      this.selections[etapeId] = {};
    }
    if (!this.selections[etapeId][sousEtapeId]) {
      this.selections[etapeId][sousEtapeId] = [];
    }

    const liste = this.selections[etapeId][sousEtapeId];
    const index = liste.findIndex(s => s.id === alimentId);

    if (multiSelect) {
      if (index >= 0) {
        liste.splice(index, 1);
      } else {
        const aliment = this.trouverAliment(alimentId);
        if (aliment) {
          liste.push({
            id: alimentId,
            ...aliment
          });
        }
      }
    } else {
      const aliment = this.trouverAliment(alimentId);
      if (aliment) {
        this.selections[etapeId][sousEtapeId] = [{
          id: alimentId,
          ...aliment
        }];
      }
    }

    this.calculerTotaux();
    this.afficherEtape(); // Refresh
  }

  /**
   * Trouver un aliment dans toutes les catégories
   */
  trouverAliment(alimentId) {
    for (const [categorie, aliments] of Object.entries(SimpleModeData)) {
      if (Array.isArray(aliments)) {
        const aliment = aliments.find(a => a.id === alimentId);
        if (aliment) return aliment;
      }
    }
    return null;
  }

  /**
   * Vérifier si un aliment est sélectionné
   */
  isAlimentSelected(etapeId, alimentId) {
    const selections = this.selections[etapeId];
    if (!selections) return false;
    if (Array.isArray(selections)) {
      return selections.some(s => s.id === alimentId);
    }
    return false;
  }

  /**
   * Vérifier si un aliment est sélectionné dans une sous-étape
   */
  isAlimentSelectedInSousEtape(etapeId, sousEtapeId, alimentId) {
    const etapeSelections = this.selections[etapeId];
    if (!etapeSelections || !etapeSelections[sousEtapeId]) return false;
    return etapeSelections[sousEtapeId].some(s => s.id === alimentId);
  }

  /**
   * Calculer les totaux (glucides + IG moyen)
   */
  calculerTotaux() {
    let totalGlucides = 0;
    let totalIGPondere = 0;

    // Parcourir toutes les sélections
    for (const [etapeId, selections] of Object.entries(this.selections)) {
      if (Array.isArray(selections)) {
        // Étape simple
        selections.forEach(aliment => {
          totalGlucides += aliment.glucides || 0;
          totalIGPondere += (aliment.glucides || 0) * (aliment.ig || 0);
        });
      } else if (typeof selections === 'object') {
        // Étape avec sous-étapes
        for (const [sousEtapeId, liste] of Object.entries(selections)) {
          if (Array.isArray(liste)) {
            liste.forEach(aliment => {
              totalGlucides += aliment.glucides || 0;
              totalIGPondere += (aliment.glucides || 0) * (aliment.ig || 0);
            });
          }
        }
      }
    }

    this.totalGlucides = Math.round(totalGlucides);
    this.totalIG = totalGlucides > 0 ? Math.round(totalIGPondere / totalGlucides) : 0;
  }

  /**
   * Afficher les sélections actuelles (résumé en haut)
   */
  afficherSelectionsActuelles() {
    // Construire la liste des aliments sélectionnés
    let items = [];
    
    for (const [etapeId, selections] of Object.entries(this.selections)) {
      if (Array.isArray(selections) && selections.length > 0) {
        items.push(...selections.map(s => `${s.emoji} ${s.nom}`));
      } else if (typeof selections === 'object') {
        for (const [sousEtapeId, liste] of Object.entries(selections)) {
          if (Array.isArray(liste) && liste.length > 0) {
            items.push(...liste.map(s => `${s.emoji} ${s.nom}`));
          }
        }
      }
    }
    
    // Toujours afficher la zone (même si vide)
    let html = `
      <div class="selectionsContainer">
    `;
    
    if (items.length === 0) {
      html += `<div class="selectionsEmpty">Aucun aliment sélectionné</div>`;
    } else {
      html += `<div class="selectionsItems">${items.join(', ')}</div>`;
    }
    
    html += `
        <div class="selectionsTotalGlucides">
          🍬 Glucides : <strong>${this.totalGlucides}g</strong>
        </div>
      </div>
    `;
    
    return html;
  }

  /**
   * Navigation : Étape précédente
   */
  etapePrecedente() {
    if (this.etapeCourante > 0) {
      this.etapeCourante--;
      this.sousEtapeCourante = null;
      this.afficherEtape();
    } else {
      this.afficherChoixRepas();
    }
  }

  /**
   * Navigation : Étape suivante
   */
  etapeSuivante() {
    this.sousEtapeCourante = null;
    this.etapeCourante++;
    this.afficherEtape();
  }

  /**
   * Navigation : Passer une étape
   */
  passerEtape() {
    this.etapeSuivante();
  }

  /**
   * Navigation : Sous-étape précédente
   */
  sousEtapePrecedente() {
    if (this.sousEtapeCourante > 0) {
      this.sousEtapeCourante--;
      this.afficherEtape();
    } else {
      this.etapePrecedente();
    }
  }

  /**
   * Navigation : Sous-étape suivante
   */
  sousEtapeSuivante() {
    this.sousEtapeCourante++;
    this.afficherEtape();
  }

  /**
   * Navigation : Passer une sous-étape
   */
  passerSousEtape() {
    this.sousEtapeSuivante();
  }

  /**
   * Ouvrir la recherche libre (mode initié)
   */
  ouvrirRechercheLibre(etapeId, sousEtapeId = null) {
    alert('🔍 Recherche libre : Fonctionnalité à venir\n\nPermettra de rechercher dans la base complète des 99 aliments.');
    // TODO: Intégrer avec FoodSearchUI existant
  }

  /**
   * Afficher le récapitulatif final
   */
  afficherRecapitulatif() {
    const container = document.getElementById('simpleModeContainer');
    
    // Calculer le conseil de bolus
    const conseil = this.getConseilBolus();
    
    let html = `
      <div class="wizardHeader">
        <h2>✅ TON REPAS EST PRÊT !</h2>
      </div>
      
      <h3 style="text-align: center; margin: 16px 0;">${this.getRepasEmoji()} ${this.getRepasNom()}</h3>
      
      <!-- TOTAUX : 2 blocs séparés + conseil -->
      <div class="recapTotaux">
        <div class="recapTotalItems">
          <div class="recapTotalItem glucides">
            <div class="recapTotalLabel">
              <span class="emoji">📊</span> Glucides
            </div>
            <div class="recapTotalValue">${this.totalGlucides}g</div>
          </div>
          <div class="recapTotalItem ig">
            <div class="recapTotalLabel">
              <span class="emoji">📈</span> IG Moyen
            </div>
            <div class="recapTotalValue">${this.totalIG} ${this.getIGColor()}</div>
          </div>
        </div>
        <div class="recapConseil">
          <span class="icon">${conseil.icon}</span>${conseil.message}
        </div>
      </div>
      
      <!-- LISTE DES ALIMENTS (ACCORDÉON) -->
      <div class="recapAccordeon">
        <button class="recapAccordeonBtn" onclick="simpleModeWizard.toggleRecapAliments()" id="recapAccordeonBtn">
          <span id="recapAccordeonIcon">▼</span> Voir la liste des aliments
        </button>
        <div class="recapAliments" id="recapAliments" style="display: none;">
    `;

    // Afficher toutes les sélections par étape
    const structure = SimpleModeData.structures[this.repasType];
    structure.forEach(etape => {
      const selections = this.selections[etape.id];
      if (!selections) return;

      html += `<div class="recapSection">`;
      html += `<div class="recapSectionTitle">${etape.emoji} ${etape.titre}</div>`;

      if (Array.isArray(selections)) {
        selections.forEach(aliment => {
          html += `<div class="recapItem">${aliment.emoji} ${aliment.nom} <span class="recapGlucides">${aliment.glucides}g</span></div>`;
        });
      } else if (typeof selections === 'object') {
        for (const [sousEtapeId, liste] of Object.entries(selections)) {
          if (Array.isArray(liste)) {
            liste.forEach(aliment => {
              html += `<div class="recapItem">${aliment.emoji} ${aliment.nom} <span class="recapGlucides">${aliment.glucides}g</span></div>`;
            });
          }
        }
      }

      html += `</div>`;
    });

    html += `
        </div>
      </div>
      
      <div class="wizardNavigation">
        <button class="btnSecondary" onclick="simpleModeWizard.etapePrecedente()">
          ✏️ Modifier le repas
        </button>
        <button class="btnPrimary btnLarge" onclick="simpleModeWizard.validerRepas()">
          ✅ CALCULER MON BOLUS
        </button>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Valider le repas et injecter dans le calculateur
   */
  validerRepas() {
    if (this.totalGlucides === 0) {
      alert('⚠️ Ton repas ne contient aucun glucide !\n\nAjoute au moins un aliment avec des glucides.');
      return;
    }

    // Injecter dans le champ glucides du calculateur
    const carbsInput = document.getElementById('carbFast') || document.getElementById('carbs');
    if (carbsInput) {
      carbsInput.value = this.totalGlucides;
      
      // Trigger les événements
      carbsInput.dispatchEvent(new Event('input', { bubbles: true }));
      carbsInput.dispatchEvent(new Event('change', { bubbles: true }));
      carbsInput.dispatchEvent(new Event('blur', { bubbles: true }));
      
      console.log(`✅ ${this.totalGlucides}g glucides injectés dans le calculateur`);
      
      // Message de confirmation
      const statusNode = document.getElementById('statusFast') || document.getElementById('status');
      if (statusNode) {
        const conseil = this.getConseilBolus();
        statusNode.innerHTML = `
          <div class="wizard-message" data-wizard-preserved="true" style="display: flex; width: 100%; gap: 16px; align-items: flex-start;">
            <div style="flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <span style="font-size: 32px;" aria-hidden="true">✅</span>
              <span style="font-weight: 900; font-size: 14px; white-space: nowrap;">Repas validé</span>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
              <div style="font-weight: 900; font-size: 16px;">
                🍬 ${this.totalGlucides}g de glucides • 📊 IG moyen: ${this.totalIG}
              </div>
              <div style="padding: 10px 12px; background: rgba(255,255,255,0.1); border-radius: 8px; font-weight: 800; font-size: 14px;">
                ${conseil.icon} ${conseil.message}
              </div>
            </div>
          </div>
        `;
        statusNode.className = 'status ok';
        statusNode.style.display = 'block';
      }
      
      // Fermer la modale wizard
      this.fermerWizard();
      
    } else {
      console.error('❌ Champ glucides introuvable');
      alert('Erreur : Impossible d\'injecter les glucides dans le calculateur.');
    }
  }

  /**
   * Toggle l'accordéon de la liste des aliments dans le récapitulatif
   */
  toggleRecapAliments() {
    const alimentsDiv = document.getElementById('recapAliments');
    const btn = document.getElementById('recapAccordeonBtn');
    const icon = document.getElementById('recapAccordeonIcon');
    
    if (!alimentsDiv || !btn || !icon) return;
    
    const isHidden = alimentsDiv.style.display === 'none';
    
    if (isHidden) {
      // Ouvrir
      alimentsDiv.style.display = 'block';
      icon.textContent = '▲';
      btn.innerHTML = `<span id="recapAccordeonIcon">▲</span> Masquer la liste des aliments`;
    } else {
      // Fermer
      alimentsDiv.style.display = 'none';
      icon.textContent = '▼';
      btn.innerHTML = `<span id="recapAccordeonIcon">▼</span> Voir la liste des aliments`;
    }
  }

  /**
   * Obtenir l'emoji du type de repas
   */
  getRepasEmoji() {
    const emojis = {
      petit_dejeuner: '🌅',
      dejeuner: '🍽️',
      gouter: '🧁',
      diner: '🌙'
    };
    return emojis[this.repasType] || '🍽️';
  }

  /**
   * Obtenir le nom du type de repas
   */
  getRepasNom() {
    const noms = {
      petit_dejeuner: 'PETIT-DÉJEUNER',
      dejeuner: 'DÉJEUNER',
      gouter: 'GOÛTER',
      diner: 'DÎNER'
    };
    return noms[this.repasType] || 'REPAS';
  }

  /**
   * Obtenir la couleur selon IG
   */
  getIGColor() {
    if (this.totalIG < 55) return '🟢';
    if (this.totalIG <= 70) return '🟡';
    return '🔴';
  }

  /**
   * Obtenir le conseil de bolus selon IG
   */
  getConseilBolus() {
    if (this.totalIG < 55) {
      return {
        icon: '🟢',
        message: 'Bolus normal : 10-15 min avant le repas'
      };
    } else if (this.totalIG <= 70) {
      return {
        icon: '🟡',
        message: 'Bolus rapide : 5-10 min avant le repas'
      };
    } else {
      return {
        icon: '🔴',
        message: 'Bolus fractionné : 60% avant, 40% après 30-45 min'
      };
    }
  }
}

// Initialisation globale
let simpleModeWizard;

document.addEventListener('DOMContentLoaded', () => {
  console.log('📌 DOMContentLoaded - Initialisation SimpleModeWizard');
  simpleModeWizard = new SimpleModeWizard();
  
  // Vérifier si le mode simple est actif au chargement
  // Si oui, initialiser le wizard immédiatement
  setTimeout(() => {
    if (document.body.classList.contains('simple-mode')) {
      console.log('🚀 Mode simple détecté au chargement - Init wizard');
      simpleModeWizard.init();
    }
  }, 100);  // Petit délai pour s'assurer que tout est chargé
});
