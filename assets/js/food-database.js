/**
 * MealMetrics — Contrat de données entre FoodDatabase et BolusOptimizer
 * ──────────────────────────────────────────────────────────────────────
 * Structure standard retournée par FoodDatabase.calculateMeal()
 * et consommée par BolusOptimizer.optimizeBolus().
 *
 * Règle des arrondis :
 *   - Le MOTEUR (calculateMeal) retourne des valeurs BRUTES (précision flottante)
 *   - L'UI utilise MealMetrics.format() pour les arrondir à l'affichage
 *   - Un seul endroit décide des arrondis : MealMetrics.format()
 *
 * @typedef {Object} MealMetrics
 * @property {number} carbs_g   - Glucides totaux du repas (g, valeur brute)
 * @property {number} ig_mean   - IG moyen pondéré par les glucides (entier)
 * @property {number} cg_total  - Charge glycémique totale (valeur brute)
 */
const MealMetrics = {
  /**
   * Valeur vide (repas vide ou DB non chargée).
   * @returns {MealMetrics}
   */
  empty() {
    return { carbs_g: 0, ig_mean: 0, cg_total: 0 };
  },

  /**
   * Formate les métriques pour l'affichage UI (arrondis).
   * C'est ici — et seulement ici — que les arrondis d'affichage sont décidés.
   *
   * @param {MealMetrics} m
   * @returns {{ carbs_g: string, ig_mean: string, cg_total: string }}
   */
  format(m) {
    return {
      carbs_g:  (Math.round(m.carbs_g  * 10) / 10).toFixed(1),  // ex: "48.5"
      ig_mean:  String(Math.round(m.ig_mean)),                    // ex: "56"
      cg_total: (Math.round(m.cg_total * 10) / 10).toFixed(1),  // ex: "27.2"
    };
  },

  /**
   * Valide qu'un objet respecte le contrat MealMetrics.
   * @param {*} obj
   * @returns {boolean}
   */
  isValid(obj) {
    return obj !== null
        && typeof obj === 'object'
        && Number.isFinite(obj.carbs_g)
        && Number.isFinite(obj.ig_mean)
        && Number.isFinite(obj.cg_total);
  },
};

// Exposition globale pour food-search-ui et bolus-optimizer
if (typeof window !== 'undefined') window.MealMetrics = MealMetrics;


/**
 * FoodDatabase v2.2 — Loader robuste (Issue 6)
 * ─────────────────────────────────────────────
 * Changements v2.2 :
 *   - Résolution du chemin JSON via document.baseURI
 *     → fonctionne sur GitHub Pages (/repo/), WAMP, file://
 *   - Bannière UI "Base indisponible" + bouton Recharger en cas d'échec
 *   - Retry automatique 1× avant de déclarer l'échec
 *
 * Système de scoring intelligent pour enfants 10 ans+
 * Déclenchement de la recherche dès 2 caractères
 */

class FoodDatabase {
  constructor() {
    this.data   = null;
    this.loaded = false;
  }

  // ─── Résolution du chemin ──────────────────────────────────────────────

  /**
   * Résout le chemin vers aliments-index.json de façon robuste.
   *
   * Priorité :
   *   1. Chemin explicite fourni à load()
   *   2. Résolution depuis document.baseURI (couvre GH Pages, WAMP, file://)
   *
   * Pourquoi ne pas utiliser './' ?
   *   fetch('./aliments-index.json') est relatif à l'URL courante du navigateur,
   *   pas au fichier JS. Si l'app est servie sous /repo/, ça fonctionne.
   *   Mais si l'URL contient un chemin profond (navigation SPA, redirect),
   *   './' peut pointer ailleurs. document.baseURI est toujours ancré à
   *   l'URL du document HTML — c'est la référence stable.
   *
   * @param {string|null} [explicitPath] - Chemin fourni manuellement (optionnel)
   * @returns {string} URL absolue vers aliments-index.json
   */
  _resolveJsonPath(explicitPath) {
    if (explicitPath) return explicitPath;

    try {
      // location.href = URL exacte du document HTML chargé par le navigateur.
      // Ex: http://acbolus/calculateur-bolus-final.html
      //   → new URL('assets/data/aliments-index.json', 'http://acbolus/calculateur-bolus-final.html')
      //   → 'http://acbolus/assets/data/aliments-index.json'  ✅
      //
      // Ex: https://user.github.io/repo/calculateur-bolus-final.html
      //   → 'https://user.github.io/repo/assets/data/aliments-index.json'  ✅
      //
      // Pourquoi PAS document.baseURI ?
      //   Sans tag <base>, baseURI = origine seule (http://acbolus/) → manque le chemin.
      //   location.href inclut toujours le chemin complet du fichier HTML.
      return new URL('assets/data/aliments-index.json', location.href).href;
    } catch (_) {
      // Fallback pour environnements sans window.location (tests node/jsdom)
      return './assets/data/aliments-index.json';
    }
  }

  // ─── Bannière UI d'erreur ─────────────────────────────────────────────

  /**
   * Affiche une bannière d'erreur via Notify.banner (si disponible)
   * ou fallback inline autonome.
   *
   * @param {string} jsonPath - Chemin tenté
   * @param {string} reason   - Message d'erreur court
   */
  _showErrorBanner(jsonPath, reason) {
    if (window.Notify?.banner) {
      window.Notify.banner('Base de données aliments indisponible', 'error', {
        id:             'db-error-banner',
        targetSelector: '#foodSearchPanel',
        detail:         `Chemin tenté : ${jsonPath}`,
        actionLabel:    '🔄 Recharger la page',
        onAction:       () => location.reload(),
      });
      return;
    }

    // Fallback autonome si Notify pas encore chargé
    console.warn('⚠️ FoodDatabase : Notify non disponible — bannière fallback inline');
    const el = document.createElement('div');
    el.id = 'db-error-banner';
    el.style.cssText = 'margin:12px;padding:16px;border-radius:14px;border:1px solid rgba(251,113,133,0.45);background:rgba(251,113,133,0.12);color:rgba(255,255,255,0.90);font-size:14px;font-weight:800;line-height:1.5';
    el.innerHTML = `<div style="font-size:18px;margin-bottom:8px">⚠️ Base de données indisponible</div><div style="font-weight:500;margin-bottom:4px">${reason}</div><div style="font-size:12px;color:rgba(255,255,255,0.45);margin-bottom:10px;font-family:monospace">${jsonPath}</div><button onclick="location.reload()" style="padding:8px 18px;background:rgba(110,231,255,0.15);border:1px solid rgba(110,231,255,0.50);color:#6ee7ff;border-radius:50px;font-weight:900;font-size:13px;cursor:pointer">🔄 Recharger</button>`;
    const existing = document.getElementById('db-error-banner');
    if (existing) existing.remove();
    (document.getElementById('foodSearchPanel') || document.body).prepend(el);
  }

  // ─── Chargement ───────────────────────────────────────────────────────

  /**
   * Charge la base de données aliments.
   *
   * @param {string|null} [jsonPath] - Chemin explicite (optionnel).
   *   Si omis, résolution automatique via document.baseURI.
   * @param {object} [opts]
   * @param {boolean} [opts.retry=true] - Retry 1× sur erreur réseau avant d'échouer
   * @returns {Promise<boolean>} true si succès, false si échec définitif
   */
  async load(jsonPath = null, opts = { retry: true }) {
    const resolvedPath = this._resolveJsonPath(jsonPath);

    const _attempt = async () => {
      const response = await fetch(resolvedPath + (resolvedPath.includes('?') ? '&' : '?') + 'v=3.0');
      if (!response.ok) throw new Error(`HTTP ${response.status} — ${resolvedPath}`);
      return response.json();
    };

    try {
      // Première tentative
      this.data   = await _attempt();
      this.loaded = true;
      console.log(`✅ ${this.getTotalAliments()} aliments chargés (v${this.data.version})`);
      return true;

    } catch (firstError) {
      // Retry 1× (réseau instable, SW en cache, etc.)
      if (opts.retry) {
        console.warn(`⚠️ FoodDatabase : 1ère tentative échouée, retry dans 1s… (${firstError.message})`);
        await new Promise(r => setTimeout(r, 1000));

        try {
          this.data   = await _attempt();
          this.loaded = true;
          console.log(`✅ ${this.getTotalAliments()} aliments chargés après retry (v${this.data.version})`);
          return true;
        } catch (retryError) {
          // Échec définitif après retry
          this._onLoadFail(resolvedPath, retryError);
          return false;
        }
      }

      this._onLoadFail(resolvedPath, firstError);
      return false;
    }
  }

  /**
   * Gestion centralisée de l'échec de chargement.
   * @private
   */
  _onLoadFail(path, error) {
    const reason = error.message || 'Erreur réseau inconnue';
    console.error(`❌ FoodDatabase : échec chargement définitif — ${reason}`);
    this._showErrorBanner(path, reason);
  }

  // ─── Normalisation ────────────────────────────────────────────────────

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

  // ─── Recherche ────────────────────────────────────────────────────────

  /**
   * RECHERCHE PRINCIPALE — VERSION OPTIMISÉE
   *
   * Logique :
   *   1. Recherche dans les aliments (priorité absolue)
   *   2. Si < 3 résultats ET requête ≥ 4 lettres → recherche catégorie
   *
   * Système de scoring :
   *   100 : Match exact du nom
   *    90 : Nom commence par la recherche
   *    85 : Début d'un mot dans le nom
   *    80 : Synonyme exact
   *    75 : Synonyme commence par la recherche
   *    60 : Contient dans le nom
   *    50 : Contient dans un synonyme
   *    40 : Match de catégorie
   *
   * @param {string} query      - Requête de recherche
   * @param {number} maxResults - Nombre max de résultats (défaut: 8)
   * @returns {Array} Liste d'aliments triés par pertinence
   */
  search(query, maxResults = 8) {
    if (!this.loaded || !query || query.length < 2) return [];

    const queryNorm = this.normalize(query);
    const results   = [];
    const seen      = new Set();

    // ── Étape 1 : Recherche dans les aliments ────────────────────────
    for (const category of this.data.categories) {
      for (const aliment of category.aliments) {
        if (seen.has(aliment.id)) continue;
        const match = this.matchAliment(aliment, queryNorm);
        if (match.matched) {
          results.push({
            ...aliment,
            category_id:   category.id,
            category_nom:  category.nom,
            category_icon: category.icon,
            score:         match.score
          });
          seen.add(aliment.id);
        }
      }
    }

    // ── Étape 2 : Recherche par catégorie (si peu de résultats) ──────
    if (results.length < 3 && queryNorm.length >= 4) {
      for (const category of this.data.categories) {
        const catNorm = this.normalize(category.nom);
        if (catNorm.includes(queryNorm)) {
          for (const aliment of category.aliments) {
            if (seen.has(aliment.id)) continue;
            results.push({
              ...aliment,
              category_id:   category.id,
              category_nom:  category.nom,
              category_icon: category.icon,
              score:         40
            });
            seen.add(aliment.id);
          }
        }
      }
    }

    // ── Étape 3 : Tri et limitation ───────────────────────────────────
    return results
      .sort((a, b) => b.score !== a.score ? b.score - a.score : a.nom.localeCompare(b.nom))
      .slice(0, maxResults);
  }

  /**
   * Match un aliment avec une requête normalisée.
   * @returns {{ matched: boolean, score: number }}
   */
  matchAliment(aliment, queryNorm) {
    const nomNorm = this.normalize(aliment.nom);

    if (nomNorm === queryNorm)            return { matched: true, score: 100 };
    if (nomNorm.startsWith(queryNorm))   return { matched: true, score: 90  };

    const words = nomNorm.split(' ');
    for (const word of words) {
      if (word.startsWith(queryNorm))    return { matched: true, score: 85  };
    }

    if (aliment.synonymes?.length > 0) {
      for (const syn of aliment.synonymes) {
        const synNorm = this.normalize(syn);
        if (synNorm === queryNorm)        return { matched: true, score: 80  };
        if (synNorm.startsWith(queryNorm))return { matched: true, score: 75  };
      }
    }

    if (nomNorm.includes(queryNorm))     return { matched: true, score: 60  };

    if (aliment.synonymes?.length > 0) {
      for (const syn of aliment.synonymes) {
        if (this.normalize(syn).includes(queryNorm)) return { matched: true, score: 50 };
      }
    }

    return { matched: false, score: 0 };
  }

  // ─── Accès aux données ────────────────────────────────────────────────

  /**
   * Récupère un aliment par ID.
   * @returns {Object|null}
   */
  getById(id) {
    if (!this.loaded) return null;
    for (const category of this.data.categories) {
      const aliment = category.aliments.find(a => a.id === id);
      if (aliment) {
        return {
          ...aliment,
          category_id:   category.id,
          category_nom:  category.nom,
          category_icon: category.icon
        };
      }
    }
    console.error(`❌ Aliment ${id} introuvable`);
    return null;
  }

  /**
   * Calcule la Charge Glycémique pour la portion usuelle de l'aliment.
   * Utile pour afficher une référence parlante : "CG pour 1 verre (250ml) : 17.9"
   *
   * Formule : glucides/100 × IG/100 × portion_quantite
   * Exemple  : Coca-Cola → 11 × 65/100 × 250/100 = 17.9
   *
   * @param {Object} aliment - Objet aliment (doit avoir glucides, ig, portion_usuelle)
   * @returns {{ cg: number, label: string }} cg brute + label formaté pour l'UI
   */
  getCGPortion(aliment) {
    if (!aliment?.portion_usuelle?.quantite) return { cg: 0, label: '—' };
    const ig = aliment.ig ?? 0; // null = 'IG non applicable' → 0 dans les calculs (Issue 6)
    const cg = (aliment.glucides * ig / 100 * aliment.portion_usuelle.quantite) / 100;
    const cgArrondi = Math.round(cg * 10) / 10;
    const { quantite, unite, description } = aliment.portion_usuelle;
    return {
      cg:    cgArrondi,
      label: `CG pour ${description} (${quantite}${unite}) : ${cgArrondi}`
    };
  }

  /**
   * Calcule les totaux d'un repas.
   * Retourne des valeurs BRUTES (pas d'arrondi) — l'UI appelle MealMetrics.format().
   *
   * @param {Array<{aliment_id: string, quantite_g: number}>} items
   * @returns {MealMetrics} { carbs_g, ig_mean, cg_total }
   */
  calculateMeal(items) {
    if (!items || items.length === 0) return MealMetrics.empty();

    let totalCarbs  = 0;
    let totalCG     = 0;
    let weightedIG  = 0;

    for (const item of items) {
      const aliment = this.getById(item.aliment_id);
      if (!aliment) {
        console.warn(`⚠️ Aliment ${item.aliment_id} non trouvé dans calculateMeal`);
        continue;
      }
      const carbs = (aliment.glucides * item.quantite_g) / 100;
      // CG calculée dynamiquement : (glucides/100g × IG/100) × quantite_g/100
      // "cg" n'est plus stockée dans le JSON (champ supprimé — cf. Issue P0)
      const igVal  = aliment.ig ?? 0; // null = 'IG non applicable' (Issue 6)
      const cg    = (aliment.glucides * igVal / 100 * item.quantite_g) / 100;
      totalCarbs  += carbs;
      totalCG     += cg;
      weightedIG  += igVal * carbs;
    }

    return {
      carbs_g:  totalCarbs,                                            // brut
      ig_mean:  totalCarbs > 0 ? Math.round(weightedIG / totalCarbs) : 0,  // entier (physiologiquement pertinent)
      cg_total: totalCG,                                               // brut
    };
  }

  /**
   * Suggère un timing de bolus selon l'IG moyen.
   * @param {number} igMean - IG moyen du repas (champ ig_mean de MealMetrics)
   * @returns {{ timing: string, icon: string, message: string }}
   */
  /**
   * Suggère un timing de bolus selon l'IG moyen ET la charge glycémique (CG).
   * La CG module la durée du bolus prolongé pour les IG élevés.
   *
   * @param {number} igMean   - Index glycémique moyen du repas
   * @param {number} [cgTotal=0] - Charge glycémique totale du repas
   * @returns {{ timing: string, icon: string, message: string }}
   */
  suggestBolusTiming(igMean, cgTotal = 0) {
    if (igMean < 55) return { timing: 'normal', icon: '🟢', message: 'Bolus normal : 10-15 min avant le repas' };
    if (igMean < 70) return { timing: 'fast',   icon: '🟡', message: 'Bolus rapide : 5-10 min avant le repas' };
    // IG ≥ 70 → bolus en 2 temps, durée modulée par la CG
    let duree;
    if      (cgTotal < 20) duree = '~1h après';
    else if (cgTotal < 40) duree = '1h à 1h30 après';
    else                   duree = '1h30 à 2h après';
    return { timing: 'split', icon: '🔴',
      message: `IG élevé : envisage un bolus en 2 temps — une partie avant, le reste ${duree} selon la durée du repas.`,
      cg_level: cgTotal < 10 ? 'basse' : cgTotal < 20 ? 'moyenne' : 'élevée'
    };
  }

  /** Nombre total d'aliments dans la base. */
  getTotalAliments() {
    if (!this.data) return 0;
    return this.data.categories.reduce((sum, cat) => sum + cat.aliments.length, 0);
  }

  /** Toutes les catégories. */
  getCategories() {
    return this.data ? this.data.categories : [];
  }

  /** Catégorie par ID. */
  getCategoryById(categoryId) {
    if (!this.data) return null;
    return this.data.categories.find(cat => cat.id === categoryId) || null;
  }

  /** Aliments d'une catégorie. */
  getAlimentsByCategory(categoryId) {
    const category = this.getCategoryById(categoryId);
    if (!category) return [];
    return category.aliments.map(aliment => ({
      ...aliment,
      category_id:   category.id,
      category_nom:  category.nom,
      category_icon: category.icon
    }));
  }
}

// Export global
if (typeof window !== 'undefined') {
  window.FoodDatabase = FoodDatabase;
}
console.log('✅ FoodDatabase chargé (v2.2)');
