/**
 * FoodSearchUI v2.1 - INTERFACE CORRIGÉE ET FONCTIONNELLE
 * - Recherche opérationnelle dès 2 caractères
 * - Bouton "Ajouter" fonctionnel avec gestion des doublons
 * - Modification des quantités en temps réel
 * - Suppression d'aliments
 * - Sauvegarde automatique (8h)
 * - Validation et injection dans le calculateur
 */

class FoodSearchUI {
  constructor(carbsInputElement) {
    this.carbsInput = carbsInputElement;
    this.db = null;
    this.myPlate = [];
    this.isOpen = false;
    this.storageKey = 'bc_meal_composition_v1';
    this.storageExpiry = 8 * 60 * 60 * 1000; // 8 heures en ms
    
    // Limites de quantité
    this.MIN_QUANTITY = 1;
    this.MAX_QUANTITY = 500;
    
    this.init();
  }

  /**
   * Initialisation
   */
  async init() {
    try {
      // Charger la base de données
      this.db = new FoodDatabase();
      const success = await this.db.load('./aliments-index.json');
      
      if (!success) {
        console.error('❌ Impossible de charger la base d\'aliments');
        return;
      }
      
      console.log('✅ FoodSearchUI : Base d\'aliments chargée');
      
      // Charger le repas sauvegardé s'il existe
      this.loadSavedMeal();
      
      // Attacher les événements
      this.attachEvents();
      
    } catch (error) {
      console.error('❌ Erreur initialisation FoodSearchUI:', error);
    }
  }

  /**
   * Attache les événements aux éléments DOM
   */
  attachEvents() {
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

    container.innerHTML = results.map(food => `
      <div class="foodItem" data-food-id="${food.id}">
        <div class="info">
          <div class="name">${food.category_icon} ${food.nom}</div>
          <div class="meta">
            ${food.glucides}g glucides • IG: ${food.ig} • 
            Portion: ${food.portion_usuelle.quantite}${food.portion_usuelle.unite}
          </div>
        </div>
        <button 
          class="add" 
          onclick="window.foodSearchUI.addToPlate('${food.id}')"
          aria-label="Ajouter ${food.nom}"
        >
          + Ajouter
        </button>
      </div>
    `).join('');
  }

  /**
   * Ajoute un aliment à l'assiette
   */
  addToPlate(alimentId) {
    const food = this.db.getById(alimentId);
    if (!food) {
      console.error(`❌ Aliment ${alimentId} introuvable`);
      return;
    }

    // Vérifier si déjà dans l'assiette
    const existing = this.myPlate.find(item => item.aliment_id === alimentId);
    if (existing) {
      // Message d'erreur user-friendly
      const message = `❌ ${food.nom} est déjà dans ton assiette !`;
      this.showNotification(message, 'warning');
      return;
    }

    // Ajouter avec la quantité par défaut (portion usuelle)
    this.myPlate.push({
      aliment_id: alimentId,
      quantite_g: food.portion_usuelle.quantite
    });

    console.log(`✅ Ajouté : ${food.nom} (${food.portion_usuelle.quantite}g)`);

    // Mettre à jour l'affichage
    this.updatePlate();
    
    // Clear la recherche
    const searchInput = document.getElementById('foodSearchInput');
    if (searchInput) {
      searchInput.value = '';
      this.displaySearchResults([]);
    }
    
    // Feedback CENTRÉ (comme suppression)
    this.showCenteredNotification(`✅ ${food.nom} ajouté !`, 'success');
  }

  /**
   * Supprime un aliment de l'assiette
   */
  removeFromPlate(alimentId) {
    const food = this.db.getById(alimentId);
    const foodName = food ? food.nom : 'Aliment';
    
    // Suppression directe - PAS de confirmation
    this.myPlate = this.myPlate.filter(item => item.aliment_id !== alimentId);
    
    console.log(`🗑️ Supprimé : ${foodName}`);
    
    // Mise à jour
    this.updatePlate();
    
    // Feedback centré (même style qu'ajout)
    this.showCenteredNotification(`🗑️ ${foodName} supprimé`, 'info');
  }

  /**
   * Met à jour la quantité d'un aliment
   */
  updateQuantity(alimentId, newQuantity) {
    // Validation de la quantité
    let qty = parseInt(newQuantity);
    
    if (isNaN(qty) || qty < this.MIN_QUANTITY) {
      qty = this.MIN_QUANTITY;
    }
    
    if (qty > this.MAX_QUANTITY) {
      alert(`⚠️ Maximum ${this.MAX_QUANTITY}g par aliment.\nPour une plus grosse portion, ajoute l'aliment plusieurs fois !`);
      qty = this.MAX_QUANTITY;
    }
    
    // Mise à jour
    const item = this.myPlate.find(i => i.aliment_id === alimentId);
    if (item) {
      item.quantite_g = qty;
      console.log(`📝 Quantité mise à jour : ${alimentId} = ${qty}g`);
      
      // Recalcul immédiat
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

    // ===== ASSIETTE VIDE =====
    if (this.myPlate.length === 0) {
      container.innerHTML = '<div class="plateEmpty">🍽️ Ton assiette est vide</div>';
      summaryContainer.innerHTML = '';
      if (validateBtn) validateBtn.disabled = true;
      this.clearSavedMeal();
      return;
    }

    // ===== AFFICHAGE DES ALIMENTS =====
    container.innerHTML = this.myPlate.map(item => {
      const food = this.db.getById(item.aliment_id);
      if (!food) return '';

      const glucides = (food.glucides * item.quantite_g / 100).toFixed(1);

      return `
        <div class="plateItem">
          <div class="itemInfo">
            <div class="itemName">${food.category_icon} ${food.nom}</div>
            <div class="itemMeta">${glucides}g glucides • IG: ${food.ig}</div>
          </div>
          <input 
            type="number" 
            value="${item.quantite_g}" 
            min="${this.MIN_QUANTITY}"
            max="${this.MAX_QUANTITY}"
            step="10"
            onchange="window.foodSearchUI.updateQuantity('${item.aliment_id}', this.value)"
            aria-label="Quantité de ${food.nom} en grammes"
          >
          <span class="quantity-unit">g</span>
          <button 
            onclick="window.foodSearchUI.removeFromPlate('${item.aliment_id}')"
            aria-label="Supprimer ${food.nom}"
            class="btn-remove"
          >
            🗑️
          </button>
        </div>
      `;
    }).join('');

    // ===== CALCUL DES TOTAUX =====
    const meal = this.db.calculateMeal(this.myPlate);
    const timing = this.db.suggestBolusTiming(meal.ig_moyen);

    // Couleur selon IG
    const igColor = this.getIGColor(meal.ig_moyen);
    const cgColor = this.getCGColor(meal.cg_totale);

    // ===== AFFICHAGE DU RÉSUMÉ =====
    summaryContainer.innerHTML = `
      <div class="plateSummary">
        <div class="summaryGrid">
          <div class="summaryItem">
            <div class="summaryLabel">Glucides</div>
            <div class="summaryValue" style="color: var(--good);">${meal.glucides}g</div>
          </div>
          <div class="summaryItem">
            <div class="summaryLabel">IG moyen</div>
            <div class="summaryValue" style="color: ${igColor};">${meal.ig_moyen}</div>
          </div>
          <div class="summaryItem">
            <div class="summaryLabel">CG totale</div>
            <div class="summaryValue" style="color: ${cgColor};">${meal.cg_totale}</div>
          </div>
        </div>
        <div class="timingSuggestion">
          ${timing.icon} ${timing.message}
        </div>
        <button 
          onclick="window.foodSearchUI.resetPlate()" 
          style="width:100%; padding:10px; margin-top:10px; background:var(--bad); color:white; border:none; border-radius:10px; cursor:pointer; font-weight:800;"
          aria-label="Effacer tout le contenu de l'assiette"
        >
          🗑️ Tout effacer
        </button>
      </div>
    `;

    // ===== ACTIVATION BOUTON VALIDATION =====
    if (validateBtn) {
      validateBtn.disabled = false;
    }
    
    // ===== SAUVEGARDE AUTO =====
    this.saveMeal();
  }

  /**
   * Valide le repas et injecte les glucides dans le calculateur
   */
  validateMeal() {
    if (this.myPlate.length === 0) return;

    const meal = this.db.calculateMeal(this.myPlate);

    // Injecter dans le champ glucides
    if (this.carbsInput) {
      this.carbsInput.value = Math.round(meal.glucides);
      
      // Trigger les événements pour mettre à jour le calcul du bolus
      this.carbsInput.dispatchEvent(new Event('input', { bubbles: true }));
      this.carbsInput.dispatchEvent(new Event('change', { bubbles: true }));
      this.carbsInput.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    // Fermer le panneau
    this.togglePanel();

    // Feedback dans le status du calculateur - Layout gauche/droite
    const statusNode = document.getElementById('statusFast') || document.getElementById('status');
    if (statusNode) {
      const timing = this.db.suggestBolusTiming(meal.ig_moyen);
      statusNode.innerHTML = `
        <div style="display: flex; width: 100%; gap: 16px; align-items: flex-start;">
          <div style="flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <span style="font-size: 32px;" aria-hidden="true">✅</span>
            <span style="font-weight: 900; font-size: 14px; white-space: nowrap;">Repas validé</span>
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
            <div style="font-weight: 900; font-size: 16px;">
              🍞 ${meal.glucides}g de glucides • 📊 IG moyen: ${meal.ig_moyen}
            </div>
            <div style="padding: 10px 12px; background: rgba(255,255,255,0.1); border-radius: 8px; font-weight: 800; font-size: 14px;">
              ${timing.icon} ${timing.message}
            </div>
          </div>
        </div>
      `;
      statusNode.className = 'status ok';
      statusNode.style.display = 'block';
    }

    console.log(`✅ Repas validé : ${meal.glucides}g glucides, IG ${meal.ig_moyen}`);

    // L'assiette reste sauvegardée (ne pas reset)
  }

  /**
   * Efface tout le contenu de l'assiette
   */
  resetPlate() {
    if (this.myPlate.length === 0) return;
    
    // Confirmation avec modal bordeaux
    this.showConfirmDialog(
      '🗑️ Effacer tout le contenu de l\'assiette ?',
      'Tous les aliments seront supprimés.',
      () => {
        // Confirmé - effacer tout
        this.myPlate = [];
        this.updatePlate();
        this.clearSavedMeal();
        console.log('🗑️ Assiette réinitialisée');
        
        // Feedback centré
        this.showCenteredNotification('🗑️ Assiette effacée', 'error');
      },
      'error'  // Type bordeaux/rouge
    );
  }

  /**
   * Sauvegarde le repas dans localStorage
   */
  saveMeal() {
    const now = Date.now();
    const expiresAt = now + this.storageExpiry;
    
    const data = {
      plate: this.myPlate,
      savedAt: now,
      expiresAt: expiresAt
    };
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      console.log(`💾 Repas sauvegardé (${this.myPlate.length} aliments, expire dans 8h)`);
    } catch (error) {
      console.error('❌ Erreur sauvegarde repas:', error);
    }
  }

  /**
   * Charge le repas sauvegardé
   */
  loadSavedMeal() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;
      
      const data = JSON.parse(stored);
      const now = Date.now();
      
      // Vérifier expiration (8h)
      if (data.expiresAt && now > data.expiresAt) {
        console.log('⏰ Repas expiré (> 8h), suppression');
        localStorage.removeItem(this.storageKey);
        return;
      }
      
      // Restaurer l'assiette
      if (data.plate && Array.isArray(data.plate)) {
        this.myPlate = data.plate;
        console.log(`✅ Repas restauré (${this.myPlate.length} aliments)`);
        
        // Mettre à jour l'affichage si le panneau est visible
        const panel = document.getElementById('foodSearchPanel');
        if (panel && !panel.classList.contains('hidden')) {
          this.updatePlate();
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement repas:', error);
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Efface le repas sauvegardé
   */
  clearSavedMeal() {
    localStorage.removeItem(this.storageKey);
    console.log('🗑️ Repas sauvegardé effacé');
  }

  /**
   * Affiche une notification temporaire
   */
  showNotification(message, type = 'info') {
    // Créer l'élément de notification s'il n'existe pas
    let notification = document.getElementById('food-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'food-notification';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 10px;
        font-weight: 800;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(notification);
    }

    // Couleur selon le type
    const colors = {
      success: 'var(--good)',
      warning: 'var(--warn)',
      info: 'var(--cool)',
      error: 'var(--bad)'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.style.color = 'white';
    notification.textContent = message;

    // Afficher
    notification.style.opacity = '1';

    // Masquer après 2 secondes
    setTimeout(() => {
      notification.style.opacity = '0';
    }, 2000);
  }

  /**
   * Affiche une confirmation centrée (pour suppression)
   */
  showConfirmDialog(title, message, onConfirm, type = 'warning') {
    // Couleurs selon le type
    const colors = {
      warning: 'var(--warn)',  // Orangé
      error: 'var(--bad)'       // Bordeaux/Rouge
    };
    const bgColor = colors[type] || colors.warning;
    
    // Créer l'overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      animation: fadeIn 0.2s ease;
    `;

    // Icône selon le type
    const icon = type === 'error' ? '🗑️' : '⚠️';

    // Créer la modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: ${bgColor};
      color: white;
      padding: 24px;
      border-radius: 16px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      animation: slideIn 0.3s ease;
    `;

    modal.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 12px;">${icon}</div>
      <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 900;">${title}</h3>
      <p style="margin: 0 0 20px 0; opacity: 0.9; font-size: 14px;">${message}</p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="confirmBtn" style="
          flex: 1;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.95);
          color: ${type === 'error' ? '#dc2626' : '#c2410c'};
          border: none;
          border-radius: 10px;
          font-weight: 900;
          cursor: pointer;
          font-size: 14px;
        ">Confirmer</button>
        <button id="cancelBtn" style="
          flex: 1;
          padding: 12px 20px;
          background: rgba(0, 0, 0, 0.2);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 900;
          cursor: pointer;
          font-size: 14px;
        ">Annuler</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animations CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Gestion des événements
    const confirmBtn = modal.querySelector('#confirmBtn');
    const cancelBtn = modal.querySelector('#cancelBtn');

    const closeModal = () => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(overlay);
        document.head.removeChild(style);
      }, 200);
    };

    confirmBtn.addEventListener('click', () => {
      closeModal();
      onConfirm();
    });

    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  /**
   * Affiche une notification centrée (après suppression)
   */
  showCenteredNotification(message, type = 'warning') {
    const notification = document.createElement('div');
    
    const colors = {
      success: 'var(--good)',
      warning: 'var(--warn)',
      info: 'var(--cool)',
      error: 'var(--bad)'
    };

    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${colors[type] || colors.warning};
      color: white;
      padding: 20px 32px;
      border-radius: 16px;
      font-weight: 900;
      font-size: 16px;
      z-index: 10002;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: popIn 0.3s ease;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes popIn {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Disparaître après 1.5 secondes
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translate(-50%, -50%) scale(0.9)';
      setTimeout(() => {
        document.body.removeChild(notification);
        document.head.removeChild(style);
      }, 300);
    }, 1500);
  }

  /**
   * Retourne la couleur CSS selon l'IG
   */
  getIGColor(ig) {
    if (ig < 55) return 'var(--good)';    // 🟢 IG bas
    if (ig < 70) return 'var(--warn)';    // 🟡 IG moyen
    return 'var(--bad)';                   // 🔴 IG élevé
  }

  /**
   * Retourne la couleur CSS selon la CG
   */
  getCGColor(cg) {
    if (cg < 10) return 'var(--good)';     // 🟢 CG basse
    if (cg < 20) return 'var(--warn)';     // 🟡 CG moyenne
    return 'var(--bad)';                    // 🔴 CG élevée
  }
}

// ==========================================
// INITIALISATION ROBUSTE
// ==========================================

function initFoodSearchUI() {
  const carbsInput = document.getElementById('carbFast');
  
  if (!carbsInput) {
    console.error('❌ Élément #carbFast introuvable - FoodSearchUI non initialisé');
    return false;
  }
  
  if (!window.FoodDatabase) {
    console.error('❌ FoodDatabase non chargé - FoodSearchUI non initialisé');
    return false;
  }
  
  if (window.foodSearchUI) {
    console.log('⚠️ FoodSearchUI déjà initialisé');
    return true;
  }
  
  try {
    window.foodSearchUI = new FoodSearchUI(carbsInput);
    console.log('✅ FoodSearchUI initialisé avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur initialisation FoodSearchUI:', error);
    return false;
  }
}

// Stratégie 1 : DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('📌 DOMContentLoaded déclenché');
  
  if (initFoodSearchUI()) {
    return;
  }
  
  setTimeout(() => {
    console.log('🔄 Tentative d\'initialisation différée (100ms)...');
    if (initFoodSearchUI()) {
      return;
    }
    
    setTimeout(() => {
      console.log('🔄 Dernière tentative d\'initialisation (500ms)...');
      initFoodSearchUI();
    }, 400);
  }, 100);
});

// Stratégie 2 : Fallback sur window.load
window.addEventListener('load', () => {
  if (!window.foodSearchUI) {
    console.log('🔄 Initialisation fallback sur window.load');
    initFoodSearchUI();
  } else {
    console.log('✅ FoodSearchUI déjà opérationnel');
  }
});
