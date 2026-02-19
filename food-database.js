/**
 * FoodDatabase v2.1 - RECHERCHE OPTIMISÉE
 * Système de scoring intelligent pour enfants 10 ans+
 * Déclenchement dès 2 caractères tapés
 */

class FoodDatabase {
  constructor() {
    this.data = null;
    this.loaded = false;
  }

  /**
   * Charge la base de données
   */
  async load(jsonPath) {
    try {
      const response = await fetch(jsonPath);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      this.data = await response.json();
      this.loaded = true;
      
      console.log(`✅ ${this.getTotalAliments()} aliments chargés (v${this.data.version})`);
      return true;
    } catch (error) {
      console.error('❌ Erreur chargement base de données:', error);
      return false;
    }
  }

  /**
   * Normalise une chaîne (minuscule, sans accents, sans espaces multiples)
   */
  normalize(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')  // Supprime les accents
      .replace(/['\-]/g, ' ')           // Remplace apostrophes et tirets par espaces
      .replace(/\s+/g, ' ')             // Espaces multiples → 1 seul espace
      .trim();
  }

  /**
   * RECHERCHE PRINCIPALE - VERSION OPTIMISÉE
   * 
   * Logique :
   * 1. Recherche dans les aliments (priorité absolue)
   * 2. Si < 3 résultats ET requête ≥ 4 lettres → recherche catégorie
   * 
   * Système de scoring :
   * - 100 : Match exact du nom
   * - 90  : Nom commence par la recherche
   * - 85  : Début d'un mot dans le nom
   * - 80  : Synonyme exact
   * - 75  : Synonyme commence par la recherche
   * - 60  : Contient dans le nom
   * - 50  : Contient dans un synonyme
   * - 40  : Match de catégorie
   * 
   * @param {string} query - Requête de recherche
   * @param {number} maxResults - Nombre max de résultats (défaut: 8)
   * @returns {Array} - Liste d'aliments triés par pertinence
   */
  search(query, maxResults = 8) {
    if (!this.loaded || !query || query.length < 2) return [];
    
    const queryNorm = this.normalize(query);
    const results = [];
    const seen = new Set();

    // ===== ÉTAPE 1 : RECHERCHE DANS LES ALIMENTS =====
    for (const category of this.data.categories) {
      for (const aliment of category.aliments) {
        if (seen.has(aliment.id)) continue;
        
        const match = this.matchAliment(aliment, queryNorm);
        if (match.matched) {
          results.push({
            ...aliment,
            category_id: category.id,
            category_nom: category.nom,
            category_icon: category.icon,
            score: match.score
          });
          seen.add(aliment.id);
        }
      }
    }

    // ===== ÉTAPE 2 : RECHERCHE PAR CATÉGORIE (si peu de résultats) =====
    if (results.length < 3 && queryNorm.length >= 4) {
      for (const category of this.data.categories) {
        const catNorm = this.normalize(category.nom);
        
        // Match catégorie
        if (catNorm.includes(queryNorm)) {
          // Ajouter TOUS les aliments de cette catégorie
          for (const aliment of category.aliments) {
            if (seen.has(aliment.id)) continue;
            
            results.push({
              ...aliment,
              category_id: category.id,
              category_nom: category.nom,
              category_icon: category.icon,
              score: 40  // Score catégorie
            });
            seen.add(aliment.id);
          }
        }
      }
    }

    // ===== ÉTAPE 3 : TRI ET LIMITATION =====
    return results
      .sort((a, b) => {
        // Tri principal par score
        if (b.score !== a.score) return b.score - a.score;
        
        // Tri secondaire par nom (alphabétique)
        return a.nom.localeCompare(b.nom);
      })
      .slice(0, maxResults);
  }

  /**
   * Match un aliment avec une requête
   * Retourne : {matched: boolean, score: number}
   */
  matchAliment(aliment, queryNorm) {
    const nomNorm = this.normalize(aliment.nom);
    
    // ===== SCORE 100 : Match EXACT du nom =====
    if (nomNorm === queryNorm) {
      return { matched: true, score: 100 };
    }
    
    // ===== SCORE 90 : Nom COMMENCE par la recherche =====
    if (nomNorm.startsWith(queryNorm)) {
      return { matched: true, score: 90 };
    }
    
    // ===== SCORE 85 : DÉBUT D'UN MOT dans le nom =====
    const words = nomNorm.split(' ');
    for (const word of words) {
      if (word.startsWith(queryNorm)) {
        return { matched: true, score: 85 };
      }
    }
    
    // ===== SCORE 80-75 : Match dans les SYNONYMES =====
    if (aliment.synonymes && aliment.synonymes.length > 0) {
      for (const syn of aliment.synonymes) {
        const synNorm = this.normalize(syn);
        
        // SCORE 80 : Synonyme exact
        if (synNorm === queryNorm) {
          return { matched: true, score: 80 };
        }
        
        // SCORE 75 : Synonyme commence par
        if (synNorm.startsWith(queryNorm)) {
          return { matched: true, score: 75 };
        }
      }
    }
    
    // ===== SCORE 60 : CONTIENT dans le nom =====
    if (nomNorm.includes(queryNorm)) {
      return { matched: true, score: 60 };
    }
    
    // ===== SCORE 50 : CONTIENT dans un synonyme =====
    if (aliment.synonymes && aliment.synonymes.length > 0) {
      for (const syn of aliment.synonymes) {
        const synNorm = this.normalize(syn);
        if (synNorm.includes(queryNorm)) {
          return { matched: true, score: 50 };
        }
      }
    }
    
    // Pas de match
    return { matched: false, score: 0 };
  }

  /**
   * Récupère un aliment par ID
   */
  getById(id) {
    if (!this.loaded) return null;
    
    for (const category of this.data.categories) {
      const aliment = category.aliments.find(a => a.id === id);
      if (aliment) {
        return {
          ...aliment,
          category_id: category.id,
          category_nom: category.nom,
          category_icon: category.icon
        };
      }
    }
    
    console.error(`❌ Aliment ${id} introuvable`);
    return null;
  }

  /**
   * Calcule les totaux d'un repas
   * 
   * @param {Array} items - Liste d'objets {aliment_id, quantite_g}
   * @returns {Object} - {glucides, ig_moyen, cg_totale}
   */
  calculateMeal(items) {
    if (!items || items.length === 0) {
      return { glucides: 0, ig_moyen: 0, cg_totale: 0 };
    }

    let totalGlucides = 0;
    let totalCG = 0;
    let weightedIG = 0;

    for (const item of items) {
      const aliment = this.getById(item.aliment_id);
      if (!aliment) {
        console.warn(`⚠️ Aliment ${item.aliment_id} non trouvé dans calculateMeal`);
        continue;
      }

      // Calcul proportionnel à la quantité (pour 100g)
      const glucides = (aliment.glucides * item.quantite_g) / 100;
      const cg = (aliment.cg * item.quantite_g) / 100;

      totalGlucides += glucides;
      totalCG += cg;
      
      // IG moyen pondéré par les glucides
      weightedIG += aliment.ig * glucides;
    }

    // IG moyen pondéré (arrondi)
    const igMoyen = totalGlucides > 0 ? 
      Math.round(weightedIG / totalGlucides) : 0;

    return {
      glucides: Math.round(totalGlucides * 10) / 10,  // 1 décimale
      ig_moyen: igMoyen,
      cg_totale: Math.round(totalCG * 10) / 10        // 1 décimale
    };
  }

  /**
   * Suggère un timing de bolus selon l'IG moyen
   * 
   * @param {number} igMoyen - Index glycémique moyen du repas
   * @returns {Object} - {timing, icon, message}
   */
  suggestBolusTiming(igMoyen) {
    if (igMoyen < 55) {
      return {
        timing: 'normal',
        icon: '🟢',
        message: 'Bolus normal : 10-15 min avant le repas'
      };
    } else if (igMoyen < 70) {
      return {
        timing: 'fast',
        icon: '🟡',
        message: 'Bolus rapide : 5-10 min avant le repas'
      };
    } else {
      return {
        timing: 'split',
        icon: '🔴',
        message: 'Bolus fractionné suggéré : 60% avant, 40% après 30-45 min'
      };
    }
  }

  /**
   * Compte le nombre total d'aliments dans la base
   */
  getTotalAliments() {
    if (!this.data) return 0;
    return this.data.categories.reduce((sum, cat) => sum + cat.aliments.length, 0);
  }

  /**
   * Récupère toutes les catégories
   */
  getCategories() {
    return this.data ? this.data.categories : [];
  }

  /**
   * Récupère une catégorie par ID
   */
  getCategoryById(categoryId) {
    if (!this.data) return null;
    return this.data.categories.find(cat => cat.id === categoryId) || null;
  }

  /**
   * Récupère tous les aliments d'une catégorie
   */
  getAlimentsByCategory(categoryId) {
    const category = this.getCategoryById(categoryId);
    if (!category) return [];
    
    return category.aliments.map(aliment => ({
      ...aliment,
      category_id: category.id,
      category_nom: category.nom,
      category_icon: category.icon
    }));
  }
}

// Export global pour utilisation dans le HTML
if (typeof window !== 'undefined') {
  window.FoodDatabase = FoodDatabase;
}
