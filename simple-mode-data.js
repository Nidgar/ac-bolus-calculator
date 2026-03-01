/**
 * SIMPLE MODE DATA v3.0 — Source unique : aliments-index.json
 * ════════════════════════════════════════════════════════════
 *
 * MIGRATION v3.0 (2026-03-01) :
 *   - ✅ Source de données unifiée : aliments-index.json v3.0 (144 aliments)
 *   - ✅ Interface IDENTIQUE à v2.0 : SimpleModeData[section] et SimpleModeData.structures
 *   - ✅ SimpleModeWizard.js non modifié (zéro dommage collatéral)
 *   - ✅ Champs attendus par le wizard : id, nom, emoji, glucides, ig, portion
 *   - ✅ ig=null → conservé tel quel (wizard utilise `a.ig || 0` → safe)
 *   - ✅ glucides toujours en g/100g (cohérent avec calculateMeal côté Initié)
 *   - ✅ portion = portion_label de la BDD (string lisible pour l'UI wizard)
 *
 * CONTRAT D'INTERFACE (ne jamais modifier ces noms) :
 *   SimpleModeData[sectionId]      → Array<{id, nom, emoji, glucides, ig, portion}>
 *   SimpleModeData.structures      → Object<repasType, Array<EtapeConfig>>
 *
 * ATTENTION CALCULS :
 *   Le wizard calcule les glucides PAR PORTION via `a.glucides` directement.
 *   Or la BDD stocke les glucides en g/100g.
 *   → Les glucides affichés dans les cards wizard sont donc pour la portion_usuelle.
 *   → On pré-calcule ici : glucides_portion = Math.round(glucides * portion_quantite / 100)
 *   → Ce champ est UNIQUEMENT pour l'affichage wizard (totalGlucides wizard).
 *   → Les calculs Initié (calculateMeal) utilisent toujours glucides/100g × quantite_g.
 *
 * DÉPENDANCE :
 *   Ce fichier est chargé APRÈS food-database.js.
 *   Il utilise window._alimentsDB (pré-chargé par un helper inline dans app.js)
 *   OU se replie sur une extraction synchrone via fetch si nécessaire.
 *   En pratique : les données sont injectées par SimpleModeDataBuilder.build()
 *   appelé depuis app.js après que FoodDatabase a chargé le JSON.
 */

// ─── Objet exposé globalement, initialisé vide puis populé par build() ────────
const SimpleModeData = {

  // ═══════════════════════════════════════════════════════════════════════
  // SECTIONS ALIMENTAIRES
  // Populées dynamiquement par SimpleModeDataBuilder.build()
  // (voir bas de fichier)
  // ═══════════════════════════════════════════════════════════════════════

  boissons_petit_dej:  [],
  boissons_repas:      [],
  boissons_gouter:     [],

  pains_petit_dej:     [],
  pains:               [],
  pains_gouter:        [],

  petit_dej_contenu:   [],
  petit_dej_garniture: [],

  entrees:             [],

  feculents:           [],
  legumes:             [],
  proteines:           [],
  fromages:            [],

  desserts_fruits:     [],
  fruits_frais:        [],
  desserts_quotidiens: [],
  desserts_festifs:    [],

  gouter_contenu:      [],
  gouter_garniture:    [],

  // ═══════════════════════════════════════════════════════════════════════
  // STRUCTURES DE REPAS
  // Identiques à v2.0 — le wizard lit SimpleModeData.structures[repasType]
  // ═══════════════════════════════════════════════════════════════════════
  structures: {

    petit_dejeuner: [
      {
        etape: 1, id: "boissons",
        titre: "Boissons", emoji: "☕",
        question: "Qu'est-ce que tu bois ?",
        categorie: "boissons_petit_dej",
        obligatoire: false, multiSelect: true, canSkip: true
      },
      {
        etape: 2, id: "pain",
        titre: "Pain", emoji: "🍞",
        question: "Quel pain veux-tu ?",
        categorie: "pains_petit_dej",
        obligatoire: false, multiSelect: true, canSkip: true
      },
      {
        etape: 3, id: "contenu",
        titre: "Contenu", emoji: "🥐",
        question: "Qu'est-ce que tu manges d'autre ?",
        categorie: "petit_dej_contenu",
        obligatoire: false, multiSelect: true, canSkip: true
      },
      {
        etape: 4, id: "fruits",
        titre: "Fruits", emoji: "🍎",
        question: "Des fruits frais ?",
        categorie: "fruits_frais",
        obligatoire: false, multiSelect: true, canSkip: true
      },
      {
        etape: 5, id: "garniture",
        titre: "Avec quoi ?", emoji: "🧈",
        question: "Avec quoi ?",
        categorie: "petit_dej_garniture",
        obligatoire: false, multiSelect: true, canSkip: true
      }
    ],

    dejeuner: [
      {
        etape: 1, id: "boissons",
        titre: "Boissons", emoji: "🥤",
        question: "Qu'est-ce que tu bois ?",
        categorie: "boissons_repas",
        obligatoire: false, multiSelect: true, canSkip: true
      },
      {
        etape: 2, id: "pain",
        titre: "Pain", emoji: "🍞",
        question: "Du pain pour accompagner ?",
        categorie: "pains",
        obligatoire: false, multiSelect: true, canSkip: true
      },
      {
        etape: 3, id: "entree",
        titre: "Entrée", emoji: "🥗",
        question: "Une entrée ?",
        categorie: "entrees",
        obligatoire: false, multiSelect: true, canSkip: true
      },
      {
        etape: 4, id: "plat",
        titre: "Plat", emoji: "🍽️",
        question: "Ton plat principal",
        sousEtapes: [
          { id: "feculent", titre: "Choisis ton féculent", categorie: "feculents",  obligatoire: true,  multiSelect: true },
          { id: "legumes",  titre: "Ajoute des légumes",   categorie: "legumes",    obligatoire: false, multiSelect: true },
          { id: "proteine", titre: "Ajoute une protéine",  categorie: "proteines",  obligatoire: false, multiSelect: true }
        ],
        obligatoire: true, canSkip: false
      },
      {
        etape: 5, id: "fromage",
        titre: "Fromage", emoji: "🧀",
        question: "Du fromage ?",
        categorie: "fromages",
        obligatoire: false, multiSelect: true, canSkip: true
      },
      {
        etape: 6, id: "dessert",
        titre: "Dessert", emoji: "🍰",
        question: "Un dessert ?",
        sousEtapes: [
          {
            id: "choix", titre: "Choisis ton dessert",
            categories: ["desserts_fruits", "desserts_quotidiens", "desserts_festifs"],
            obligatoire: false, multiSelect: true
          }
        ],
        obligatoire: false, canSkip: true
      }
    ],

    gouter: [
      {
        etape: 1, id: "boissons",
        titre: "Boissons", emoji: "🥤",
        question: "Qu'est-ce que tu bois ?",
        categorie: "boissons_gouter",
        obligatoire: false, multiSelect: true, canSkip: true
      },
      {
        etape: 2, id: "pain",
        titre: "Pain", emoji: "🍞",
        question: "Quel pain veux-tu ?",
        categorie: "pains_gouter",
        obligatoire: false, multiSelect: true, canSkip: true
      },
      {
        etape: 3, id: "contenu",
        titre: "Contenu", emoji: "🍪",
        question: "Qu'est-ce que tu manges d'autre ?",
        categorie: "gouter_contenu",
        obligatoire: false, multiSelect: true, canSkip: true
      },
      {
        etape: 4, id: "fruits",
        titre: "Fruits", emoji: "🍎",
        question: "Des fruits frais ?",
        categorie: "fruits_frais",
        obligatoire: false, multiSelect: true, canSkip: true
      },
      {
        etape: 5, id: "garniture",
        titre: "Avec quoi ?", emoji: "🧈",
        question: "Avec quoi ?",
        categorie: "gouter_garniture",
        obligatoire: false, multiSelect: true, canSkip: true
      }
    ],

    diner: null  // Initialisé plus bas (référence à dejeuner — même structure)
  }
};

// Dîner = même structure que déjeuner (référence directe, pas de copie)
SimpleModeData.structures.diner = SimpleModeData.structures.dejeuner;


// ═══════════════════════════════════════════════════════════════════════════
// BUILDER — Popule SimpleModeData depuis la BDD unifiée
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SimpleModeDataBuilder
 *
 * Responsabilité unique : transformer les aliments de la BDD v3.0
 * en entrées compatibles avec l'interface wizard SimpleModeData.
 *
 * Format d'entrée (BDD) :
 *   { id, nom, emoji, glucides, ig, portion_usuelle: {quantite, unite, description}, portion_label }
 *
 * Format de sortie (wizard) :
 *   { id, nom, emoji, glucides, ig, portion }
 *
 * RÈGLE CRITIQUE CALCULS :
 *   Le wizard utilise `a.glucides` directement pour sommer les glucides du repas.
 *   La BDD stocke glucides en g/100g.
 *   → On convertit : glucides_wizard = Math.round(glucides_bdd * portion_quantite / 100)
 *   → Ce n'est PAS le même champ que celui utilisé par calculateMeal() (mode Initié).
 *   → Dans calculateMeal() : carbs = (aliment.glucides * item.quantite_g) / 100  ← utilise g/100g
 *   → Dans le wizard       : total += a.glucides  ← utilise la valeur pré-calculée par portion
 *   Les deux sont corrects dans leur contexte respectif.
 */
const SimpleModeDataBuilder = {

  /**
   * Convertit un aliment BDD en format wizard.
   * @param {Object} a - Aliment de la BDD (avec portion_usuelle et portion_label)
   * @returns {Object} Aliment au format wizard
   */
  _toWizard(a) {
    // glucides PAR PORTION pour l'affichage et la somme wizard
    const glucidesParPortion = Math.round(a.glucides * a.portion_usuelle.quantite / 100);
    return {
      id:       a.id,
      nom:      a.nom,
      emoji:    a.emoji || '🍽️',
      glucides: glucidesParPortion,            // g / portion — usage wizard uniquement
      ig:       a.ig,                          // null conservé (wizard: a.ig || 0 → 0)
      portion:  a.portion_label || `${a.portion_usuelle.quantite}${a.portion_usuelle.unite}`
    };
  },

  /**
   * Extrait un sous-ensemble d'une catégorie BDD, dans l'ordre donné.
   * @param {Object}   db       - La BDD (objet avec .categories)
   * @param {string}   catId    - ID de la catégorie BDD
   * @param {string[]|null} ids - IDs à extraire (null = tous)
   * @returns {Array}
   */
  _pick(db, catId, ids) {
    const cat = db.categories.find(c => c.id === catId);
    if (!cat) { console.warn(`⚠️ SimpleModeDataBuilder: catégorie '${catId}' introuvable`); return []; }
    const aliments = ids
      ? ids.map(id => cat.aliments.find(a => a.id === id)).filter(Boolean)
      : cat.aliments;
    return aliments.map(a => this._toWizard(a));
  },

  /**
   * Extrait des aliments depuis plusieurs catégories BDD, dans l'ordre donné.
   * @param {Object}   db     - La BDD
   * @param {Array}    multi  - Array de [catId, ids[]]
   * @returns {Array}
   */
  _pickMulti(db, multi) {
    return multi.flatMap(([catId, ids]) => this._pick(db, catId, ids));
  },

  /**
   * Popule toutes les sections de SimpleModeData depuis la BDD.
   * Appelé par app.js après FoodDatabase.load().
   *
   * @param {Object} db - this.data de FoodDatabase (objet JSON brut)
   */
  build(db) {
    if (!db || !db.categories) {
      console.error('❌ SimpleModeDataBuilder.build() : BDD invalide ou non chargée');
      return false;
    }

    const p = this._pick.bind(this, db);
    const m = this._pickMulti.bind(this, db);

    // ── BOISSONS ─────────────────────────────────────────────────────────
    SimpleModeData.boissons_petit_dej = p('boissons', [
      'eau', 'lait_boisson', 'chocolat_chaud', 'jus_orange', 'jus_pomme', 'cafe', 'the'
    ]);

    SimpleModeData.boissons_repas = p('boissons', [
      'eau', 'sirop_fruit', 'coca_cola', 'the_glace', 'limonade'
    ]);

    SimpleModeData.boissons_gouter = p('boissons', [
      'eau', 'lait_boisson', 'chocolat_chaud', 'jus_orange', 'jus_pomme', 'coca_cola', 'sirop_fruit'
    ]);

    // ── PAINS ─────────────────────────────────────────────────────────────
    SimpleModeData.pains_petit_dej = p('pain_cereales', [
      'pain_blanc', 'pain_complet', 'pain_mie', 'biscotte', 'pain_epices', 'pain_epeautre'
    ]);

    SimpleModeData.pains = p('pain_cereales', [
      'pain_blanc', 'pain_complet', 'pain_mie', 'pain_seigle',
      'pain_campagne', 'biscotte', 'pain_epeautre'
    ]);

    SimpleModeData.pains_gouter = p('pain_cereales', [
      'pain_blanc', 'pain_complet', 'pain_mie', 'brioche', 'pain_epices'
    ]);

    // ── PETIT-DÉJEUNER ───────────────────────────────────────────────────
    // croissant, pain_chocolat, brioche, céréales, muesli, flocons → pain_cereales
    // crepe_nature, gaufre, biscuit_sec → desserts_sucreries
    SimpleModeData.petit_dej_contenu = [
      ...p('pain_cereales',     ['croissant', 'pain_chocolat', 'brioche', 'cereales_nature', 'muesli', 'flocons_avoine']),
      ...p('desserts_sucreries', ['crepe_nature', 'gaufre', 'biscuit_sec'])
    ];

    SimpleModeData.petit_dej_garniture = m([
      ['produits_laitiers', ['beurre', 'fromage_tartiner']],
      ['desserts_sucreries', ['confiture', 'miel', 'pate_tartiner']]
    ]);

    // ── ENTRÉES ───────────────────────────────────────────────────────────
    // "Crudités variées" n'a pas d'ID propre en BDD → item inline
    const cruditesItem = {
      id: 'crudites', nom: 'Crudités variées', emoji: '🥗',
      glucides: 5, ig: 20, portion: '1 assiette (100g)'
    };
    SimpleModeData.entrees = [
      ...p('legumes', ['salade', 'tomate', 'concombre', 'carotte']),
      ...p('plats_prepares', ['soupe_legumes']),
      cruditesItem
    ];

    // ── PLAT PRINCIPAL ────────────────────────────────────────────────────
    SimpleModeData.feculents  = p('feculents',  null);  // tous
    SimpleModeData.legumes    = p('legumes',    null);  // tous
    SimpleModeData.proteines  = p('proteines',  null);  // tous

    // ── FROMAGES ──────────────────────────────────────────────────────────
    SimpleModeData.fromages = p('produits_laitiers', [
      'fromage_pate_dure', 'camembert', 'chevre', 'fromage_fondu', 'fromage_tartiner'
    ]);

    // ── DESSERTS ──────────────────────────────────────────────────────────
    SimpleModeData.desserts_fruits = p('fruits', [
      'pomme', 'poire', 'banane', 'orange', 'fraise', 'raisin', 'kiwi', 'peche'
    ]);

    SimpleModeData.fruits_frais = p('fruits', [
      'pomme', 'poire', 'banane', 'orange', 'fraise', 'raisin',
      'kiwi', 'peche', 'mandarine', 'melon', 'pasteque', 'cerise', 'fruits_secs'
    ]);

    SimpleModeData.desserts_quotidiens = p('produits_laitiers', [
      'yaourt_nature', 'yaourt_fruits', 'fromage_blanc', 'petit_suisse',
      'compote', 'creme_dessert', 'flan', 'mousse_chocolat', 'riz_lait'
    ]);

    SimpleModeData.desserts_festifs = p('desserts_sucreries', [
      'gateau_chocolat', 'cookie', 'glace_vanille', 'crepe_nature', 'tarte_fruits'
    ]);

    // ── GOÛTER ────────────────────────────────────────────────────────────
    SimpleModeData.gouter_contenu = [
      ...p('desserts_sucreries', [
        'cookie', 'gateau_chocolat', 'barre_cereales', 'madeleine',
        'quatre_quarts', 'biscuit_sec', 'gaufre'
      ]),
      ...p('pain_cereales',     ['croissant']),
      ...p('produits_laitiers', ['yaourt_fruits', 'compote'])
    ];

    SimpleModeData.gouter_garniture = m([
      ['produits_laitiers', ['beurre']],
      ['desserts_sucreries', ['confiture', 'pate_tartiner', 'miel']]
    ]);

    const total = Object.entries(SimpleModeData)
      .filter(([k, v]) => k !== 'structures' && Array.isArray(v))
      .reduce((sum, [, v]) => sum + v.length, 0);

    console.log(`✅ SimpleModeData v3.0 : ${total} entrées (${Object.keys(SimpleModeData).filter(k => k !== 'structures' && Array.isArray(SimpleModeData[k])).length} sections) — source : aliments-index.json`);
    return true;
  }
};

// Exposition globale
if (typeof window !== 'undefined') {
  window.SimpleModeData        = SimpleModeData;
  window.SimpleModeDataBuilder = SimpleModeDataBuilder;
}

// Export Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SimpleModeData, SimpleModeDataBuilder };
}
