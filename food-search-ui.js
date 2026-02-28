/**
 * FoodSearchUI v2.4 - Loader DB robuste (Issue 6)
 * - Recherche opérationnelle dès 2 caractères
 * - Bouton "Ajouter" fonctionnel avec gestion des doublons
 * - Modification des quantités en temps réel
 * - Suppression d'aliments
 * - Sauvegarde automatique (8h) — via AppStorage (TTL + schemaVersion)
 * - Validation et injection dans le calculateur
 * - Chemin JSON résolu via FoodDatabase (document.baseURI, GH Pages safe)
 * - Bannière UI en cas d'échec de chargement DB
 *
 * IMPORTANT : N'instancie PLUS FoodSearchUI automatiquement.
 * L'initialisation est déléguée à app.js (bootstrap unique).
 * Dépendances : AppStorage (storage.js), FoodDatabase (food-database.js)
 */

class FoodSearchUI {
  constructor(carbsInputElement) {
    this.carbsInput = carbsInputElement;
    this.db = null;
    this.myPlate = [];
    this.isOpen = false;
    // Limites de quantité
    this.MIN_QUANTITY = 1;
    this.MAX_QUANTITY = 500;
    
    // Garde-fou listeners : attachés une seule fois
    this._listenersAttached = false;
    
    this.init();
  }

  /**
   * Initialisation
   */
  async init() {
    try {
      this.db = new FoodDatabase();

      // Pas de chemin explicite → FoodDatabase résout via document.baseURI
      // (compatible GitHub Pages /repo/, WAMP, file://)
      const success = await this.db.load();

      if (!success) {
        // La bannière UI a déjà été injectée par FoodDatabase._onLoadFail()
        // On désactive le toggle pour éviter d'ouvrir un panneau vide
        this._disableToggleOnDBFail();
        return;
      }

      console.log('✅ FoodSearchUI : Base d\'aliments chargée');
      this.loadSavedMeal();
      this.attachEvents();

    } catch (error) {
      Notify.toast('Erreur initialisation — rechargez la page', 'error');
      console.error('❌ Erreur initialisation FoodSearchUI:', error);
      this._disableToggleOnDBFail();
    }
  }

  /**
   * Désactive le bouton toggle et affiche un état dégradé.
   * Appelé uniquement si la DB n'a pas pu charger.
   * @private
   */
  _disableToggleOnDBFail() {
    const toggleBtn = document.getElementById('foodSearchToggle');
    if (toggleBtn) {
      toggleBtn.disabled = true;
      toggleBtn.title    = 'Base de données indisponible — rechargez la page';
      toggleBtn.style.opacity = '0.4';
    }
  }

  /**
   * Attache les événements aux éléments DOM.
   * Idempotent : ne s'exécute qu'une seule fois grâce au flag _listenersAttached.
   */
  attachEvents() {
    if (this._listenersAttached) {
      console.warn('⚠️ FoodSearchUI.attachEvents() déjà appelé — skip');
      return;
    }

    // Toggle du panneau
    const toggleBtn = document.getElementById('foodSearchToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.togglePanel());
    }

    // Recherche en temps réel
    const searchInput = document.getElementById('foodSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.performSearch(e.target.value));
    }

    // Validation du repas
    const validateBtn = document.getElementById('validateMealBtn');
    if (validateBtn) {
      validateBtn.addEventListener('click', () => this.validateMeal());
    }

    // ── Délégation sur #searchResults (boutons "Ajouter") ─────────────────
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
      searchResults.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="add"][data-food-id]');
        if (btn) this.addToPlate(btn.dataset.foodId);
      });
    }

    // ── Délégation sur #plateItems (quantité + supprimer) ─────────────────
    const plateItems = document.getElementById('plateItems');
    if (plateItems) {
      // Changement de quantité
      plateItems.addEventListener('change', (e) => {
        const input = e.target.closest('input[data-action="qty"][data-aliment-id]');
        if (input) this.updateQuantity(input.dataset.alimentId, input.value);
      });
      // Suppression d'un aliment
      plateItems.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="remove"][data-aliment-id]');
        if (btn) this.removeFromPlate(btn.dataset.alimentId);
      });
    }

    // ── Délégation sur #plateSummary (reset assiette) ─────────────────────
    const plateSummary = document.getElementById('plateSummary');
    if (plateSummary) {
      plateSummary.addEventListener('click', (e) => {
        const resetBtn = e.target.closest('[data-action="reset"]');
        if (resetBtn) { this.resetPlate(); return; }

        // Bouton "Voir conseil timing bolus" — révèle la suggestion IG/CG
        const revealBtn = e.target.closest('[data-action="reveal-ig-timing"]');
        if (revealBtn) {
          const content = document.getElementById('igTimingContent');
          const isOpen  = revealBtn.getAttribute('aria-expanded') === 'true';
          revealBtn.setAttribute('aria-expanded', String(!isOpen));
          if (content) content.hidden = isOpen;
          revealBtn.textContent = isOpen
            ? `💡 Voir conseil timing bolus`
            : `✓ Conseil timing affiché`;
        }
      });
    }

    this._listenersAttached = true;
    console.log('✅ FoodSearchUI : listeners attachés');
  }

  /**
   * Toggle l'affichage du panneau de recherche
   */
  togglePanel() {
    this.isOpen = !this.isOpen;
    
    const panel = document.getElementById('foodSearchPanel');
    const toggle = document.getElementById('foodSearchToggle');
    
    if (panel && toggle) {
      panel.classList.toggle('hidden', !this.isOpen);
      toggle.classList.toggle('active', this.isOpen);
      toggle.setAttribute('aria-expanded', String(this.isOpen));
      
      if (this.isOpen) {
        // Restaurer l'assiette si elle existe
        if (this.myPlate.length > 0) {
          this.updatePlate();
        }
        
        // Focus sur le champ de recherche
        const searchInput = document.getElementById('foodSearchInput');
        if (searchInput) {
          setTimeout(() => searchInput.focus(), 100);
        }
      }
    }
  }

  /**
   * Effectue une recherche d'aliments
   */
  performSearch(query) {
    if (!query || query.length < 2) {
      this.displaySearchResults([]);
      return;
    }

    const results = this.db.search(query, 8);
    this.displaySearchResults(results);
  }

  /**
   * Affiche les résultats de recherche
   */
  displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = results.map(food => {
      // Glucides réels pour la portion usuelle (= ce que l'utilisateur va consommer)
      const glucPortion = Math.round(food.glucides * food.portion_usuelle.quantite / 100);
      return `
      <div class="foodItem" data-food-id="${food.id}">
        <div class="info">
          <div class="name">${food.category_icon} ${food.nom}</div>
          <div class="meta" style="display:flex; flex-direction:column; gap:3px; margin-top:3px;">
            <span style="font-size:11px; opacity:0.6; font-weight:500;">
              📊 Valeurs pour 100g — ${food.glucides}g glucides • IG : ${food.ig}
            </span>
            <span style="font-size:13px; font-weight:800; color: var(--good, #4ade80);">
              🍽️ Portion usuelle : ${food.portion_usuelle.description} (${food.portion_usuelle.quantite}g) → ~${glucPortion}g glucides
            </span>
          </div>
        </div>
        <button 
          class="add" 
          data-action="add"
          data-food-id="${food.id}"
          aria-label="Ajouter ${food.nom}"
        >
          + Ajouter
        </button>
      </div>
    `}).join('');
  }

  /**
   * Ajoute un aliment à l'assiette
   */
  addToPlate(alimentId) {
    const food = this.db.getById(alimentId);
    if (!food) {
      Notify.toast(`Aliment introuvable (id: ${alimentId})`, 'warn');
      console.error(`❌ Aliment ${alimentId} introuvable`);
      return;
    }

    // Vérifier si déjà dans l'assiette
    const existing = this.myPlate.find(item => item.aliment_id === alimentId);
    if (existing) {
      this.showNotification(`❌ ${food.nom} est déjà dans ton assiette !`, 'warning');
      return;
    }

    // Ajouter avec la quantité par défaut (portion usuelle)
    this.myPlate.push({
      aliment_id: alimentId,
      quantite_g: food.portion_usuelle.quantite
    });

    console.log(`✅ Ajouté : ${food.nom} (${food.portion_usuelle.quantite}g)`);

    this.updatePlate();
    
    const searchInput = document.getElementById('foodSearchInput');
    if (searchInput) {
      searchInput.value = '';
      this.displaySearchResults([]);
    }
    
    this.showCenteredNotification(`✅ ${food.nom} ajouté !`, 'success');
  }

  /**
   * Supprime un aliment de l'assiette
   */
  removeFromPlate(alimentId) {
    const food = this.db.getById(alimentId);
    const foodName = food ? food.nom : 'Aliment';
    
    this.myPlate = this.myPlate.filter(item => item.aliment_id !== alimentId);
    
    console.log(`🗑️ Supprimé : ${foodName}`);
    
    this.updatePlate();
    this.showCenteredNotification(`🗑️ ${foodName} supprimé`, 'info');
  }

  /**
   * Met à jour la quantité d'un aliment
   */
  updateQuantity(alimentId, newQuantity) {
    let qty = parseInt(newQuantity);
    
    if (isNaN(qty) || qty < this.MIN_QUANTITY) {
      qty = this.MIN_QUANTITY;
    }
    
    if (qty > this.MAX_QUANTITY) {
      Notify.toast(`⚠️ Maximum ${this.MAX_QUANTITY}g — ajoute l'aliment plusieurs fois si besoin`, 'warn', 4000);
      qty = this.MAX_QUANTITY;
    }
    
    const item = this.myPlate.find(i => i.aliment_id === alimentId);
    if (item) {
      item.quantite_g = qty;
      console.log(`📝 Quantité mise à jour : ${alimentId} = ${qty}g`);
      this.updatePlate();
    }
  }

  /**
   * Met à jour l'affichage de l'assiette
   */
  updatePlate() {
    const container = document.getElementById('plateItems');
    const summaryContainer = document.getElementById('plateSummary');
    const validateBtn = document.getElementById('validateMealBtn');

    if (!container || !summaryContainer) return;

    if (this.myPlate.length === 0) {
      container.innerHTML = '<div class="plateEmpty">🍽️ Ton assiette est vide</div>';
      summaryContainer.innerHTML = '';
      if (validateBtn) validateBtn.disabled = true;
      this.clearSavedMeal();
      return;
    }

    container.innerHTML = this.myPlate.map(item => {
      const food = this.db.getById(item.aliment_id);
      if (!food) return '';

      const glucides = (food.glucides * item.quantite_g / 100).toFixed(1);

      return `
        <div class="plateItem">
          <div class="itemInfo">
            <div class="itemName">${food.category_icon} ${food.nom}</div>
            <div class="itemMeta">
              <span style="font-weight:800;">${glucides}g glucides</span>
              <span style="font-size:11px; opacity:0.6;"> (base : ${food.glucides}g/100g • IG: ${food.ig})</span>
            </div>
          </div>
          <input 
            type="number" 
            value="${item.quantite_g}" 
            min="${this.MIN_QUANTITY}"
            max="${this.MAX_QUANTITY}"
            step="10"
            data-action="qty"
            data-aliment-id="${item.aliment_id}"
            aria-label="Quantité de ${food.nom} en grammes"
          >
          <span class="quantity-unit">g</span>
          <button 
            data-action="remove"
            data-aliment-id="${item.aliment_id}"
            aria-label="Supprimer ${food.nom}"
            class="btn-remove"
          >
            🗑️
          </button>
        </div>
      `;
    }).join('');

    const meal   = this.db.calculateMeal(this.myPlate);  // MealMetrics brut
    const fmt    = MealMetrics.format(meal);             // arrondis UI ici uniquement
    const timing = this.db.suggestBolusTiming(meal.ig_mean, meal.cg_total);

    const igColor = this.getIGColor(meal.ig_mean);
    const cgColor = this.getCGColor(meal.cg_total);

    summaryContainer.innerHTML = `
      <div class="plateSummary">
        <div class="summaryGrid">
          <div class="summaryItem">
            <div class="summaryLabel">Glucides</div>
            <div class="summaryValue" style="color: var(--good);">${fmt.carbs_g}g</div>
          </div>
          <div class="summaryItem">
            <div class="summaryLabel">IG moyen</div>
            <div class="summaryValue" style="color: ${igColor};">${fmt.ig_mean}</div>
          </div>
          <div class="summaryItem">
            <div class="summaryLabel">CG totale</div>
            <div class="summaryValue" style="color: ${cgColor};">${fmt.cg_total}</div>
          </div>
        </div>
        <div class="igTimingWrapper">
          <button
            class="igTimingRevealBtn"
            data-action="reveal-ig-timing"
            aria-expanded="false"
            aria-controls="igTimingContent"
          >
            💡 Voir conseil timing bolus (IG ${fmt.ig_mean})
          </button>
          <div id="igTimingContent" class="igTimingContent" hidden>
            <div class="igTimingDisclaimer">
              📚 <strong>Recommandation éducative — non médicale.</strong><br>
              Consultez votre équipe soignante avant tout changement de schéma d'injection.
            </div>
            <div class="timingSuggestion">
              ${timing.icon} ${timing.message}
            </div>
          </div>
        </div>
        <button 
          data-action="reset"
          style="width:100%; padding:10px; margin-top:10px; background:var(--bad); color:white; border:none; border-radius:10px; cursor:pointer; font-weight:800;"
          aria-label="Effacer tout le contenu de l'assiette"
        >
          🗑️ Tout effacer
        </button>
      </div>
    `;

    if (validateBtn) {
      validateBtn.disabled = false;
    }
    
    this.saveMeal();
  }

  /**
   * Valide le repas et injecte les glucides dans le calculateur
   */
  validateMeal() {
    if (this.myPlate.length === 0) return;

    const meal = this.db.calculateMeal(this.myPlate);  // MealMetrics brut

    if (this.carbsInput) {
      this.carbsInput.value = Math.round(meal.carbs_g); // arrondi entier pour le champ
      this.carbsInput.dispatchEvent(new Event('input', { bubbles: true }));
      this.carbsInput.dispatchEvent(new Event('change', { bubbles: true }));
      this.carbsInput.dispatchEvent(new Event('blur', { bubbles: true }));
      // P2 Issue 7 — Verrouiller le champ après injection pour éviter la double saisie
      if (typeof lockCarbField === 'function') lockCarbField('wizard-initie');
    }

    this.togglePanel();

    const statusNode = document.getElementById('statusFast') || document.getElementById('status');
    if (statusNode) {
      const timing  = this.db.suggestBolusTiming(meal.ig_mean, meal.cg_total);
      const fmtVal  = MealMetrics.format(meal);
      const isSplit = timing.timing === 'split';
      statusNode.innerHTML = `
        <div style="display: flex; width: 100%; gap: 16px; align-items: flex-start;">
          <div style="flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <span style="font-size: 32px;" aria-hidden="true">✅</span>
            <span style="font-weight: 900; font-size: 14px; white-space: nowrap;">Repas validé</span>
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
            <div style="font-weight: 900; font-size: 16px;">
              🍞 ${fmtVal.carbs_g}g de glucides • 📊 IG moyen: ${fmtVal.ig_mean}
            </div>
            ${isSplit ? `
            <button
              id="applyIGOptimBtn"
              style="width:100%; padding:10px 14px; background:rgba(251,191,36,0.18); color:inherit; border:1.5px solid rgba(251,191,36,0.5); border-radius:10px; cursor:pointer; font-weight:800; font-size:14px; text-align:center;"
              aria-expanded="false"
              aria-controls="igOptimContent"
            >
              ${timing.icon} Voir recommandation timing (IG élevé)
            </button>
            <div id="igOptimContent" hidden style="padding:10px 12px; background:rgba(255,255,255,0.08); border-radius:8px; font-size:13px;">
              <div style="background:rgba(251,191,36,0.15); border:1px solid rgba(251,191,36,0.4); border-radius:8px; padding:8px 10px; margin-bottom:8px; font-size:12px; line-height:1.5;">
                📚 <strong>Recommandation éducative — non médicale.</strong><br>
                Ce conseil est à titre informatif uniquement.<br>
                Consultez votre équipe soignante avant tout changement.
              </div>
              <div style="font-weight: 800;">${timing.icon} ${timing.message}</div>
            </div>
            ` : `
            <div style="padding: 10px 12px; background: rgba(255,255,255,0.1); border-radius: 8px; font-weight: 800; font-size: 14px;">
              ${timing.icon} ${timing.message}
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
          const content = document.getElementById('igOptimContent');
          const isOpen  = applyBtn.getAttribute('aria-expanded') === 'true';
          applyBtn.setAttribute('aria-expanded', String(!isOpen));
          if (content) content.hidden = isOpen;
          if (!isOpen) {
            applyBtn.textContent = `${timing.icon} Recommandation timing affichée ✓`;
            applyBtn.style.textAlign = 'center';
            applyBtn.style.background = 'rgba(52,211,153,0.15)';
            applyBtn.style.borderColor = 'rgba(52,211,153,0.5)';
          }
        });
      }
    }

    console.log(`✅ Repas validé : ${MealMetrics.format(meal).carbs_g}g glucides, IG ${meal.ig_mean}`);
  }

  /**
   * Efface tout le contenu de l'assiette
   */
  resetPlate() {
    if (this.myPlate.length === 0) return;
    
    this.showConfirmDialog(
      '🗑️ Effacer tout le contenu de l\'assiette ?',
      'Tous les aliments seront supprimés.',
      () => {
        this.myPlate = [];
        this.updatePlate();
        this.clearSavedMeal();
        console.log('🗑️ Assiette réinitialisée');
        this.showCenteredNotification('🗑️ Assiette effacée', 'error');
      },
      'error'
    );
  }

  saveMeal() {
    const ok = AppStorage.set(
      AppStorage.KEYS.meal,
      this.myPlate,
      { ttl: AppStorage.TTL.meal, schemaVersion: AppStorage.SCHEMA.meal }
    );
    if (!ok) {
      Notify.toast('Sauvegarde impossible — stockage plein ?', 'error');
      console.error('❌ FoodSearchUI : échec sauvegarde repas (quota ?)');
    }
  }

  loadSavedMeal() {
    try {
      const plate = AppStorage.get(
        AppStorage.KEYS.meal,
        { schemaVersion: AppStorage.SCHEMA.meal }
      );
      if (!plate) return; // absent, expiré ou version obsolète → assiette vide sans erreur
      if (Array.isArray(plate)) {
        this.myPlate = plate;
        console.log(`✅ Repas restauré (${this.myPlate.length} aliments)`);
        const panel = document.getElementById('foodSearchPanel');
        if (panel && !panel.classList.contains('hidden')) {
          this.updatePlate();
        }
      }
    } catch (error) {
      console.error('❌ FoodSearchUI : erreur chargement repas:', error);
      AppStorage.clear(AppStorage.KEYS.meal);
    }
  }

  clearSavedMeal() {
    AppStorage.clear(AppStorage.KEYS.meal);
  }

  // ─── Notifications (délèguent à window.Notify) ────────────────────────
  // Wrappers conservés pour les appels internes existants.

  showNotification(message, type = 'info') {
    Notify.toast(message, type === 'warning' ? 'warn' : type);
  }

  showConfirmDialog(title, message, onConfirm, type = 'warning') {
    Notify.confirm(title, message, onConfirm, type === 'warning' ? 'warn' : type);
  }

  showCenteredNotification(message, type = 'info') {
    Notify.center(message, type === 'warning' ? 'warn' : type);
  }

  getIGColor(ig) {
    if (ig < 55) return 'var(--good)';
    if (ig < 70) return 'var(--warn)';
    return 'var(--bad)';
  }

  getCGColor(cg) {
    if (cg < 10) return 'var(--good)';
    if (cg < 20) return 'var(--warn)';
    return 'var(--bad)';
  }
}

// ─── PAS D'AUTO-INITIALISATION ───────────────────────────────────────────────
// L'instanciation est déléguée à app.js pour éviter toute double initialisation.
// Ne pas ajouter de DOMContentLoaded ou window.load ici.
