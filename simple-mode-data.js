/**
 * SIMPLE MODE DATA v3.6 — Source unique : aliments-index.json
 * ════════════════════════════════════════════════════════════
 *
 * MIGRATION v3.6 (2026-03-01) :
 *   - ✅ AUDIT COMPLET : tous les aliments BDD maintenant mappés dans le wizard
 *   - ✅ pain_cereales : +9 nouveaux pains dans les listes petit-déj/repas/goûter
 *   - ✅ boissons : +11 nouvelles boissons dans les 3 contextes repas
 *   - ✅ desserts_quotidiens : +6 (skyr, yaourt grec, fromage blanc 0%, crème anglaise, panna cotta, île flottante)
 *   - ✅ desserts_festifs : +14 (brownie, muffin, tiramisu, crumble, chocolats...)
 *   - ✅ patisseries : nouvelle section — 24 pâtisseries françaises
 *   - ✅ legumineuses : nouvelle section — mappée dans sous-étape plat principal
 *   - ✅ plats_chauds : nouvelle section — nouvelle étape wizard "Plat préparé"
 *   - ✅ Dessert : 3 sous-étapes (Yaourts, Pâtisseries, Fruits)
 *   - ✅ Plat principal : 4 sous-étapes (Féculent, Légumineuses, Légumes, Protéine)
 *   - ✅ galette_riz, chapelure, ble_precuit exclus volontairement (ingrédients cuisine)
 *
 * MIGRATION v3.5 (2026-03-01) :
 *   - ✅ entrees_froides mappée dans le wizard (catégorie BDD v3.2)
 *   - ✅ Fusion dans l'étape Entrée : charcuterie fine en tête, puis légumes, soupe, crudités
 *   - ✅ SimpleModeData.entrees_froides exposée séparément (usage futur)
 *
 * MIGRATION v3.4 (2026-03-01) :
 *   - ✅ Nouvelle étape "Sauces & Condiments" dans dejeuner/dîner (étape 5)
 *       → 7 aliments : ketchup, moutarde, mayo, sauce soja, vinaigrette, huile d'olive, sauce tomate
 *   - ✅ Fromage décalé étape 6, Dessert étape 7
 *   - ✅ EMOJI_OVERRIDES enrichi : sauce_soja 🥢, vinaigrette 🥗, sauce_tomate 🫙
 *   - ✅ Aucune modification du wizard
 *
 * MIGRATION v3.3 (2026-03-01) :
 *   - ✅ desserts_fruits : fruits_secs ajouté (cohérent avec fruits_frais)
 *   - ✅ Framboise : emoji corrigé 🫐 → 🔴 (wizard only, BDD inchangée)
 *       via EMOJI_OVERRIDES — mécanisme réutilisable pour futurs conflits
 *
 * MIGRATION v3.2 (2026-03-01) :
 *   - ✅ desserts_fruits : 8 → 17 fruits (ajout mandarine, framboise, melon,
 *       pastèque, abricot, cerise, ananas, mangue, myrtille)
 *   - ✅ fruits_frais : 13 → 18 entrées (idem + fruits_secs)
 *   - ✅ Constante partagée tousLesFruitsFrais pour éviter toute divergence future
 *   - ✅ Aucune modification wizard ni structure
 *
 * MIGRATION v3.1 (2026-03-01) :
 *   - ✅ Desserts séparés en 2 sous-étapes distinctes :
 *       → "🍮 Yaourts & Pâtisseries" (desserts_quotidiens + desserts_festifs)
 *       → "🍎 Fruits" (desserts_fruits)
 *   - ✅ Aucun changement sur les données ni sur le wizard (zéro dommage collatéral)
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
  entrees_froides:     [],

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
        etape: 4, id: "plat_prepare",
        titre: "Plat préparé", emoji: "🍲",
        question: "Un plat préparé / complet ?",
        categorie: "plats_chauds",
        obligatoire: false, multiSelect: false, canSkip: true
      },
      {
        etape: 5, id: "plat",
        titre: "Plat", emoji: "🍽️",
        question: "Ton plat principal",
        sousEtapes: [
          { id: "feculent",     titre: "🍝 Féculent",        categorie: "feculents",    obligatoire: true,  multiSelect: true },
          { id: "legumineuse",  titre: "🫘 Légumineuses",    categorie: "legumineuses", obligatoire: false, multiSelect: true },
          { id: "legumes",      titre: "🥦 Légumes",          categorie: "legumes",      obligatoire: false, multiSelect: true },
          { id: "proteine",     titre: "🍗 Protéine",         categorie: "proteines",    obligatoire: false, multiSelect: true }
        ],
        obligatoire: true, canSkip: false
      },
      {
        etape: 6, id: "sauces",
        titre: "Sauces", emoji: "🫙",
        question: "Une sauce ou condiment ?",
        categorie: "sauces_condiments",
        obligatoire: false, multiSelect: true, canSkip: true
      },
      {
        etape: 7, id: "fromage",
        titre: "Fromage", emoji: "🧀",
        question: "Du fromage ?",
        categorie: "fromages",
        obligatoire: false, multiSelect: true, canSkip: true
      },
      {
        etape: 8, id: "dessert",
        titre: "Dessert", emoji: "🍰",
        question: "Un dessert ?",
        sousEtapes: [
          {
            id: "yaourts_glaces",   titre: "🍮 Yaourts & Desserts",
            categorie: "desserts_quotidiens",
            obligatoire: false, multiSelect: true
          },
          {
            id: "patisseries",      titre: "🥐 Pâtisseries",
            categories: ["desserts_festifs", "patisseries"],
            obligatoire: false, multiSelect: true
          },
          {
            id: "fruits_dessert",   titre: "🍎 Fruits",
            categorie: "desserts_fruits",
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
   * Corrections d'emojis wizard — appliquées par-dessus la BDD.
   * Utile quand deux aliments partagent le même emoji en BDD (ex: framboise et myrtille → 🫐).
   * La BDD reste inchangée ; seul l'affichage wizard est patché ici.
   */
  EMOJI_OVERRIDES: {
    framboise:   '🔴',  // 🫐 déjà utilisé par myrtille — 🔴 = petit fruit rouge reconnaissable
    sauce_soja:  '🥢',  // 🫙 déjà utilisé par vinaigrette
    vinaigrette: '🥗',  // 🫙 déjà utilisé par sauce_soja
    ketchup:     '🍅',  // OK — sauce_tomate sera patchée
    sauce_tomate:'🫙',  // 🍅 déjà utilisé par ketchup
  },

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
      emoji:    this.EMOJI_OVERRIDES[a.id] || a.emoji || '🍽️',
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
      'eau', 'lait_boisson', 'chocolat_chaud', 'jus_orange', 'jus_pomme',
      'jus_ananas', 'jus_mangue', 'smoothie_fruits',
      'lait_amande', 'lait_avoine', 'lait_coco', 'cafe', 'the'
    ]);

    // Laits végétaux et fermentés — boissons alternatives petit-déj / goûter
    // (lait_entier, lait_ecreme, lait_soja, kefir sont dans produits_laitiers BDD
    //  mais servis comme boissons → mappés ici via _pick inline)
    const laitsBoissonPdej = [
      ...p('produits_laitiers', ['lait_entier', 'lait_demi_ecreme', 'lait_ecreme', 'lait_soja', 'kefir'])
    ];
    SimpleModeData.boissons_petit_dej = [...SimpleModeData.boissons_petit_dej, ...laitsBoissonPdej];

    SimpleModeData.boissons_repas = p('boissons', [
      'eau', 'sirop_fruit', 'coca_cola', 'the_glace', 'limonade',
      'jus_orange', 'jus_pomme', 'jus_raisin', 'jus_tomate',
      'jus_cranberry', 'jus_ananas', 'jus_mangue',
      'lait_amande', 'lait_avoine', 'kombucha', 'boisson_sportive'
    ]);

    SimpleModeData.boissons_gouter = p('boissons', [
      'eau', 'lait_boisson', 'chocolat_chaud', 'jus_orange', 'jus_pomme',
      'jus_raisin', 'jus_ananas', 'jus_mangue', 'smoothie_fruits',
      'lait_amande', 'lait_avoine', 'lait_coco', 'coca_cola', 'sirop_fruit', 'kombucha'
    ]);
    SimpleModeData.boissons_gouter = [
      ...SimpleModeData.boissons_gouter,
      ...p('produits_laitiers', ['lait_entier', 'lait_ecreme', 'lait_soja', 'kefir'])
    ];

    // ── PAINS ─────────────────────────────────────────────────────────────
    SimpleModeData.pains_petit_dej = p('pain_cereales', [
      'pain_blanc', 'pain_complet', 'pain_mie', 'pain_seigle', 'pain_seigle_complet',
      'biscotte', 'cracotte', 'pain_epices', 'pain_epeautre', 'pain_cereales_multi'
    ]);

    SimpleModeData.pains = p('pain_cereales', [
      'pain_blanc', 'pain_complet', 'pain_mie', 'pain_seigle', 'pain_seigle_complet',
      'pain_campagne', 'biscotte', 'cracotte', 'pain_epeautre', 'pain_cereales_multi',
      'pain_pita', 'pain_naan', 'bagel', 'tortilla_ble', 'pain_hamburger'
    ]);

    SimpleModeData.pains_gouter = p('pain_cereales', [
      'pain_blanc', 'pain_complet', 'pain_mie', 'brioche', 'pain_epices',
      'pain_cereales_multi', 'cracotte', 'pain_seigle_complet'
    ]);

    // ── PETIT-DÉJEUNER ───────────────────────────────────────────────────
    // croissant, pain_chocolat, brioche, céréales, muesli, flocons → pain_cereales
    // crepe_nature, gaufre, biscuit_sec → desserts_sucreries
    SimpleModeData.petit_dej_contenu = [
      ...p('pain_cereales',     ['croissant', 'pain_chocolat', 'brioche', 'cereales_nature', 'muesli', 'flocons_avoine']),
      ...p('desserts_sucreries', ['crepe_nature', 'gaufre', 'biscuit_sec'])
    ];

    SimpleModeData.petit_dej_garniture = m([
      ['produits_laitiers', ['beurre', 'fromage_tartiner', 'creme_fraiche', 'lait_concentre_sucre']],
      ['desserts_sucreries', ['confiture', 'miel', 'pate_tartiner']]
    ]);

    // ── ENTRÉES ───────────────────────────────────────────────────────────
    // "Crudités variées" n'a pas d'ID propre en BDD → item inline
    const cruditesItem = {
      id: 'crudites', nom: 'Crudités variées', emoji: '🥗',
      glucides: 5, ig: 20, portion: '1 assiette (100g)'
    };
    // Populer entrees_froides pour usage éventuel en section isolée
    SimpleModeData.entrees_froides = p('entrees_froides', null);  // tous

    SimpleModeData.entrees = [
      // Entrées froides & charcuterie fine (nouvelle catégorie v3.2)
      ...SimpleModeData.entrees_froides,
      // Crudités & légumes froids
      ...p('legumes', ['salade', 'tomate', 'concombre', 'carotte']),
      // Entrée chaude
      ...p('plats_prepares', ['soupe_legumes']),
      cruditesItem
    ];

    // ── PLAT PRINCIPAL ────────────────────────────────────────────────────
    SimpleModeData.feculents  = p('feculents',  null);  // tous
    SimpleModeData.legumineuses = p('legumineuses', null); // tous (fèves, lentilles, pois chiches...)
    SimpleModeData.legumes    = p('legumes',    null);  // tous
    SimpleModeData.proteines  = p('proteines',  null);  // tous

    // ── FROMAGES ──────────────────────────────────────────────────────────
    SimpleModeData.fromages = p('produits_laitiers', [
      'fromage_pate_dure', 'camembert', 'chevre', 'fromage_fondu', 'fromage_tartiner', 'creme_fraiche'
    ]);

    // ── DESSERTS ──────────────────────────────────────────────────────────
    // Tous les fruits frais disponibles en BDD (17 fruits, sans fruits_secs)
    const tousLesFruitsFrais = [
      'pomme', 'poire', 'banane', 'orange', 'mandarine',
      'fraise', 'framboise', 'raisin', 'kiwi', 'peche',
      'melon', 'pasteque', 'abricot', 'cerise', 'ananas', 'mangue', 'myrtille'
    ];

    SimpleModeData.desserts_fruits = p('fruits', [...tousLesFruitsFrais, 'fruits_secs']);

    SimpleModeData.fruits_frais = p('fruits', [
      ...tousLesFruitsFrais,
      'fruits_secs'
    ]);

    SimpleModeData.desserts_quotidiens = p('produits_laitiers', [
      'yaourt_nature', 'yaourt_fruits', 'yaourt_grec', 'skyr',
      'fromage_blanc', 'fromage_blanc_0', 'petit_suisse',
      'compote', 'creme_dessert', 'flan', 'mousse_chocolat', 'riz_lait',
      'creme_anglaise', 'panna_cotta', 'ile_flottante'
    ]);

    // Desserts festifs classiques
    SimpleModeData.desserts_festifs = p('desserts_sucreries', [
      'gateau_chocolat', 'cookie', 'glace_vanille', 'crepe_nature', 'tarte_fruits',
      'brownie', 'muffin', 'tiramisu', 'crumble', 'pain_perdu',
      'chocolat_noir', 'chocolat_lait', 'bonbon', 'sucre_blanc'
    ]);

    // Pâtisseries françaises (nouvelle section v3.6)
    SimpleModeData.patisseries = p('desserts_sucreries', [
      'tarte_fraise', 'tarte_citron', 'tarte_pommes', 'tarte_tatin',
      'eclair_chocolat', 'millefeuille', 'chou_creme', 'profiteroles',
      'paris_brest', 'religieuse', 'saint_honore', 'baba_rhum',
      'fraisier', 'opera', 'charlotte_fraises',
      'fondant_chocolat', 'clafoutis', 'far_breton', 'biscuit_roule',
      'macaron', 'sable_breton', 'nougat', 'calisson', 'touron'
    ]);

    // ── SAUCES & CONDIMENTS ──────────────────────────────────────────────────
    SimpleModeData.sauces_condiments = p('sauces_condiments', null);  // tous

    // ── PLATS PRÉPARÉS (nouvelle section v3.6) ───────────────────────────────
    SimpleModeData.plats_chauds = p('plats_prepares', null);  // tous

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
