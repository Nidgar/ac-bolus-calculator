/**
 * AC Bolus — Cas Cliniques (CC1–CC10)
 * ─────────────────────────────────────────────────────────────────────────────
 * Batterie de tests bout-en-bout basée sur des profils patients fictifs réalistes.
 * Chaque cas simule un repas complet avec des aliments de la vraie base
 * (aliments-index.json v3.4), un profil patient et une glycémie mesurée.
 *
 * Pipeline testé pour chaque cas :
 *   FoodDatabase.calculateMeal()
 *     → BolusMath.calcBolus()
 *       → BolusOptimizer.optimizeBolus()
 *         → BolusOptimizer.formatResult()
 *
 * Valeurs de référence calculées indépendamment en Python (vérifiées à la main).
 * Ces tests servent de filet de régression : toute modification des formules
 * métier doit se traduire par une mise à jour explicite de ces valeurs attendues.
 *
 * Ajoutés le 05/03/2026
 */

// ─── Helpers locaux ────────────────────────────────────────────────────────────

/** Reconstruit une FoodDatabase mockée depuis une liste d'aliments de la vraie base */
function buildDB(aliments) {
  const db = new FoodDatabase();
  db.data = {
    version: 'cc-mock',
    categories: [{ id: 'cc', nom: 'Cas Clinique', icon: '🏥', aliments }]
  };
  db.loaded = true;
  return db;
}

/** Arrondit à n décimales */
function round(n, d = 4) { return Math.round(n * 10**d) / 10**d; }

// ════════════════════════════════════════════════════════════════════════════
// CC1 — Ado, collation rapide : pain blanc + banane
// ════════════════════════════════════════════════════════════════════════════
// Profil  : 15 ans, basale=20 U/j, rapide=12 U/j → DTQ=32, ICR=15.625, FSI=56.25
// Repas   : pain_blanc 50g + banane 120g
//   pain  : carbs = 55*50/100 = 27.5g   | cg = 55*70/100 * 50/100 = 19.25
//   banane: carbs = 23*120/100 = 27.6g  | cg = 23*52/100 * 120/100 = 14.352
//   total : carbs = 55.1g | ig_mean = round((70*27.5 + 52*27.6)/55.1) = round(61.05) = 61
//           cg = 33.602
// Glycémie 170 → correction = (170-110)/56.25 = 1.0667
// Repas        = 55.1 / 15.625 = 3.5264
// Total brut   = 4.5931 → arrondi(0.1) = 4.6 U
// ig_factor    = 1 + (61-55)*0.005 = 1.03
// cg_factor    = 1.05 (cg=33.6 ≥ 20)
// bolus_opt    = 4.6 * 1.0815 = 4.9749 → affiché "5.0"

suite('Cas Clinique — CC1 : ado collation pain blanc + banane (IG fast)');
(() => {
  const db = buildDB([
    { id: 'pain_blanc', nom: 'Pain blanc', synonymes: [], glucides: 55, ig: 70, cg: 38.5,
      portion_usuelle: { quantite: 50, unite: 'g', description: '2 tranches' } },
    { id: 'banane',     nom: 'Banane',     synonymes: [], glucides: 23, ig: 52, cg: 12.0,
      portion_usuelle: { quantite: 120, unite: 'g', description: '1 banane' } },
  ]);

  const meal = db.calculateMeal([
    { aliment_id: 'pain_blanc', quantite_g: 50  },
    { aliment_id: 'banane',     quantite_g: 120 },
  ]);

  assert('CC1 : MealMetrics valide',         MealMetrics.isValid(meal));
  assert('CC1 : carbs_g = 55.1',             near(meal.carbs_g, 55.1));
  assert('CC1 : ig_mean = 61',               meal.ig_mean === 61);
  assert('CC1 : cg_total ≈ 33.60',           near(meal.cg_total, 33.602, 0.01));

  const bolus = BolusMath.calcBolus({
    glycemie: 170, objectif: 110, glucides: meal.carbs_g,
    basale: 20, rapide: 12, step: 0.1
  });
  assert('CC1 : correction ≈ 1.067',         near(bolus.correction, 1.0667, 0.001));
  assert('CC1 : repas ≈ 3.526',              near(bolus.repas, 3.5264, 0.001));
  assert('CC1 : totalArrondi = 4.6',         near(bolus.totalArrondi, 4.6));

  const opt    = new BolusOptimizer();
  const result = opt.optimizeBolus({
    bolus_standard: bolus.totalArrondi,
    carbs_g: meal.carbs_g, ig_mean: meal.ig_mean, cg_total: meal.cg_total,
  });
  assert('CC1 : strategy = fast (ig=61)',    result.strategy.strategy === 'fast');
  assert('CC1 : ig_factor = 1.03',           near(result.factors.ig.factor, 1.03));
  assert('CC1 : cg_factor = 1.05',           near(result.factors.cg.factor, 1.05));
  assert('CC1 : bolus_opt > bolus_std',      result.bolus_optimized > bolus.totalArrondi);

  const fmt = opt.formatResult(result, 0.1);
  assert('CC1 : bolus_standard_display="4.6"', fmt.bolus_standard_display === '4.6');
  assert('CC1 : pas de split (fast)',          fmt.split_doses_display === null);
})();


// ════════════════════════════════════════════════════════════════════════════
// CC2 — Adulte, déjeuner équilibré : pâtes + poulet + tomate
// ════════════════════════════════════════════════════════════════════════════
// Profil  : 35 ans, basale=28, rapide=17 → DTQ=45, ICR=11.111, FSI=40
// Repas   : pates_blanches 200g + poulet 120g (ig=null→0) + tomate 100g
//   pâtes : carbs = 25*200/100 = 50g  | cg = 25*60/100 * 200/100 = 30
//   poulet: carbs = 0*120/100  = 0g   | cg = 0
//   tomate: carbs = 4*100/100  = 4g   | cg = 4*30/100 * 100/100 = 1.2
//   total : carbs = 54g | ig_mean = round((60*50 + 0*0 + 30*4)/54) = round(58.15) = 58
//           cg = 31.2
// Glycémie 120 → correction = (120-110)/40 = 0.25
// Repas        = 54 / 11.111 = 4.86
// Total brut   = 5.11 → arrondi = 5.1 U
// ig_factor    = 1 + (58-55)*0.005 = 1.015
// cg_factor    = 1.05 (cg=31.2 ≥ 20)
// bolus_opt    ≈ 5.1 * 1.06575 = 5.435

suite('Cas Clinique — CC2 : adulte déjeuner pâtes + poulet + tomate');
(() => {
  const db = buildDB([
    { id: 'pates_blanches', nom: 'Pâtes blanches', synonymes: [], glucides: 25, ig: 60, cg: 15,
      portion_usuelle: { quantite: 200, unite: 'g', description: '1 assiette' } },
    { id: 'poulet',         nom: 'Poulet',         synonymes: [], glucides: 0,  ig: null, cg: 0,
      portion_usuelle: { quantite: 120, unite: 'g', description: '1 escalope' } },
    { id: 'tomate',         nom: 'Tomate',         synonymes: [], glucides: 4,  ig: 30, cg: 1.2,
      portion_usuelle: { quantite: 100, unite: 'g', description: '1 tomate' } },
  ]);

  const meal = db.calculateMeal([
    { aliment_id: 'pates_blanches', quantite_g: 200 },
    { aliment_id: 'poulet',         quantite_g: 120 },
    { aliment_id: 'tomate',         quantite_g: 100 },
  ]);

  assert('CC2 : carbs_g = 54',               near(meal.carbs_g, 54));
  assert('CC2 : ig_mean = 58',               meal.ig_mean === 58);
  assert('CC2 : cg_total = 31.2',            near(meal.cg_total, 31.2, 0.01));

  const bolus = BolusMath.calcBolus({
    glycemie: 120, objectif: 110, glucides: meal.carbs_g,
    basale: 28, rapide: 17, step: 0.1
  });
  assert('CC2 : correction = 0.25',          near(bolus.correction, 0.25));
  assert('CC2 : repas ≈ 4.86',              near(bolus.repas, 4.86, 0.001));
  assert('CC2 : totalArrondi = 5.1',         near(bolus.totalArrondi, 5.1));

  const opt    = new BolusOptimizer();
  const result = opt.optimizeBolus({
    bolus_standard: bolus.totalArrondi,
    carbs_g: meal.carbs_g, ig_mean: meal.ig_mean, cg_total: meal.cg_total,
  });
  assert('CC2 : strategy = fast (ig=58)',    result.strategy.strategy === 'fast');
  assert('CC2 : cg_factor = 1.05',           near(result.factors.cg.factor, 1.05));
  assert('CC2 : bolus_opt ≈ 5.44',          near(result.bolus_optimized, 5.435, 0.01));
})();


// ════════════════════════════════════════════════════════════════════════════
// CC3 — Enfant, petit-déjeuner IG bas : flocons d'avoine + pomme + lait
// ════════════════════════════════════════════════════════════════════════════
// Profil  : 10 ans, basale=15, rapide=8 → DTQ=23, ICR=21.739, FSI=78.261
// Repas   : flocons_avoine 50g + pomme 150g + lait 200ml
//   flocons: carbs = 60*50/100 = 30g    | cg = 60*55/100 * 50/100 = 16.5
//   pomme  : carbs = 14*150/100 = 21g   | cg = 14*38/100 * 150/100 = 7.98
//   lait   : carbs = 5*200/100  = 10g   | cg = 5*30/100 * 200/100 = 3
//   total  : carbs = 61g | ig_mean = round((55*30 + 38*21 + 30*10)/61) = round(44.75) = 45
//            cg = 27.48
// Glycémie 115 → correction = (115-110)/78.261 = 0.0639
// Repas        = 61 / 21.739 = 2.806
// Total brut   = 2.8699 → arrondi = 2.9 U
// ig_factor    = 1 + (45-55)*0.005 = 0.95
// cg_factor    = 1.05 (cg=27.48 ≥ 20)
// combined     = 0.9975
// bolus_opt    ≈ 2.9 * 0.9975 = 2.8928 → affiché "2.9"

suite('Cas Clinique — CC3 : enfant petit-déjeuner IG bas (optimizer réduit)');
(() => {
  const db = buildDB([
    { id: 'flocons_avoine', nom: 'Flocons avoine', synonymes: [], glucides: 60, ig: 55, cg: 33,
      portion_usuelle: { quantite: 50, unite: 'g', description: '1 bol' } },
    { id: 'pomme',          nom: 'Pomme',          synonymes: [], glucides: 14, ig: 38, cg: 5.3,
      portion_usuelle: { quantite: 150, unite: 'g', description: '1 pomme' } },
    { id: 'lait',           nom: 'Lait',           synonymes: [], glucides: 5,  ig: 30, cg: 1.5,
      portion_usuelle: { quantite: 200, unite: 'ml', description: '1 verre' } },
  ]);

  const meal = db.calculateMeal([
    { aliment_id: 'flocons_avoine', quantite_g: 50  },
    { aliment_id: 'pomme',          quantite_g: 150 },
    { aliment_id: 'lait',           quantite_g: 200 },
  ]);

  assert('CC3 : carbs_g = 61',               near(meal.carbs_g, 61));
  assert('CC3 : ig_mean = 45',               meal.ig_mean === 45);
  assert('CC3 : cg_total ≈ 27.48',           near(meal.cg_total, 27.48, 0.01));

  const bolus = BolusMath.calcBolus({
    glycemie: 115, objectif: 110, glucides: meal.carbs_g,
    basale: 15, rapide: 8, step: 0.1
  });
  assert('CC3 : correction ≈ 0.064',         near(bolus.correction, 0.0639, 0.001));
  assert('CC3 : totalArrondi = 2.9',         near(bolus.totalArrondi, 2.9));

  const opt    = new BolusOptimizer();
  const result = opt.optimizeBolus({
    bolus_standard: bolus.totalArrondi,
    carbs_g: meal.carbs_g, ig_mean: meal.ig_mean, cg_total: meal.cg_total,
  });
  // ig bas → facteur < 1 (réduction), cg haute → facteur > 1 : combined ≈ 0.9975
  assert('CC3 : strategy = normal (ig=45)',  result.strategy.strategy === 'normal');
  assert('CC3 : ig_factor = 0.95',           near(result.factors.ig.factor, 0.95));
  assert('CC3 : cg_factor = 1.05',           near(result.factors.cg.factor, 1.05));
  assert('CC3 : combined ≈ 0.9975',          near(result.adjustment, 0.9975, 0.001));
  // bolus_opt légèrement inférieur ou égal au standard (ig bas domine)
  assert('CC3 : bolus_opt ≈ bolus_std',      near(result.bolus_optimized, 2.8928, 0.01));
})();


// ════════════════════════════════════════════════════════════════════════════
// CC4 — Hypoglycémie en cours : correction négative dominante
// ════════════════════════════════════════════════════════════════════════════
// Profil  : 30 ans, basale=25, rapide=15 → DTQ=40, ICR=12.5, FSI=45
// Repas   : pain_complet 50g + poulet 120g
//   pain  : carbs = 48*50/100 = 24g  | cg = 48*45/100 * 50/100 = 10.8
//   poulet: carbs = 0
//   total : carbs = 24g | ig_mean = 45 | cg = 10.8
// Glycémie 72 (HYPO) → correction = (72-110)/45 = -0.8444
// Repas        = 24 / 12.5 = 1.92
// Total brut   = 1.0756 → arrondi = 1.1 U (correction négative réduit fortement le bolus)
// ig_factor    = 0.95 (ig=45 < 55)
// cg_factor    = 1.0 (cg=10.8, zone neutre 10–20)
// bolus_opt    = 1.1 * 0.95 = 1.045

suite('Cas Clinique — CC4 : hypoglycémie – correction négative (glycémie 72)');
(() => {
  const db = buildDB([
    { id: 'pain_complet', nom: 'Pain complet', synonymes: [], glucides: 48, ig: 45, cg: 21.6,
      portion_usuelle: { quantite: 50, unite: 'g', description: '1 tranche' } },
    { id: 'poulet',       nom: 'Poulet',       synonymes: [], glucides: 0,  ig: null, cg: 0,
      portion_usuelle: { quantite: 120, unite: 'g', description: '1 escalope' } },
  ]);

  const meal = db.calculateMeal([
    { aliment_id: 'pain_complet', quantite_g: 50  },
    { aliment_id: 'poulet',       quantite_g: 120 },
  ]);

  assert('CC4 : carbs_g = 24',               near(meal.carbs_g, 24));
  assert('CC4 : ig_mean = 45',               meal.ig_mean === 45);
  assert('CC4 : cg_total = 10.8',            near(meal.cg_total, 10.8, 0.01));

  const bolus = BolusMath.calcBolus({
    glycemie: 72, objectif: 110, glucides: meal.carbs_g,
    basale: 25, rapide: 15, step: 0.1
  });
  // Correction négative : glycémie < objectif
  assert('CC4 : correction < 0',             bolus.correction < 0);
  assert('CC4 : correction ≈ -0.844',        near(bolus.correction, -0.8444, 0.001));
  assert('CC4 : repas = 1.92',               near(bolus.repas, 1.92));
  assert('CC4 : totalArrondi = 1.1',         near(bolus.totalArrondi, 1.1));
  // Total bien inférieur au bolus repas seul (correction négative a joué)
  assert('CC4 : total < repas seul',         bolus.totalArrondi < bolus.repas);

  const opt    = new BolusOptimizer();
  const result = opt.optimizeBolus({
    bolus_standard: bolus.totalArrondi,
    carbs_g: meal.carbs_g, ig_mean: meal.ig_mean, cg_total: meal.cg_total,
  });
  assert('CC4 : strategy = normal (ig=45)',  result.strategy.strategy === 'normal');
  assert('CC4 : cg_factor = 1.0 (zone neutre)', near(result.factors.cg.factor, 1.0));
  assert('CC4 : bolus_opt ≈ 1.045',          near(result.bolus_optimized, 1.045, 0.01));
})();


// ════════════════════════════════════════════════════════════════════════════
// CC5 — Ado, pizza + coca : IG élevé, CG très haute, grosse dose
// ════════════════════════════════════════════════════════════════════════════
// Profil  : 16 ans, basale=22, rapide=13 → DTQ=35, ICR=14.286, FSI=51.429
// Repas   : pizza_margherita 400g + coca_cola 250ml
//   pizza : carbs = 30*400/100 = 120g | cg = 30*60/100 * 400/100 = 72
//   coca  : carbs = 11*250/100 = 27.5g| cg = 11*65/100 * 250/100 = 17.875
//   total : carbs = 147.5g | ig_mean = round((60*120 + 65*27.5)/147.5) = round(61.02) = 61
//           cg = 89.875
// Glycémie 145 → correction = (145-110)/51.429 = 0.6806
// Repas        = 147.5 / 14.286 = 10.325
// Total        = 11.006 → arrondi = 11.0 U
// ig_factor    = 1.03 | cg_factor = 1.05 | combined = 1.0815
// bolus_opt    = 11.0 * 1.0815 = 11.897

suite('Cas Clinique — CC5 : ado pizza + coca (CG très haute, grosse dose)');
(() => {
  const db = buildDB([
    { id: 'pizza_margherita', nom: 'Pizza margherita', synonymes: [], glucides: 30, ig: 60, cg: 18,
      portion_usuelle: { quantite: 200, unite: 'g', description: '½ pizza' } },
    { id: 'coca_cola',        nom: 'Coca-Cola',        synonymes: [], glucides: 11, ig: 65, cg: 7.15,
      portion_usuelle: { quantite: 250, unite: 'ml', description: '1 verre' } },
  ]);

  const meal = db.calculateMeal([
    { aliment_id: 'pizza_margherita', quantite_g: 400 },
    { aliment_id: 'coca_cola',        quantite_g: 250 },
  ]);

  assert('CC5 : carbs_g = 147.5',            near(meal.carbs_g, 147.5));
  assert('CC5 : ig_mean = 61',               meal.ig_mean === 61);
  assert('CC5 : cg_total ≈ 89.875',          near(meal.cg_total, 89.875, 0.01));

  const bolus = BolusMath.calcBolus({
    glycemie: 145, objectif: 110, glucides: meal.carbs_g,
    basale: 22, rapide: 13, step: 0.1
  });
  assert('CC5 : correction ≈ 0.681',         near(bolus.correction, 0.6806, 0.001));
  assert('CC5 : repas ≈ 10.325',             near(bolus.repas, 10.325, 0.001));
  assert('CC5 : totalArrondi = 11.0',        near(bolus.totalArrondi, 11.0));

  const opt    = new BolusOptimizer();
  const result = opt.optimizeBolus({
    bolus_standard: bolus.totalArrondi,
    carbs_g: meal.carbs_g, ig_mean: meal.ig_mean, cg_total: meal.cg_total,
  });
  assert('CC5 : strategy = fast',            result.strategy.strategy === 'fast');
  assert('CC5 : cg classifié Élevée',        result.factors.cg.class.label === 'Élevée');
  assert('CC5 : bolus_opt ≈ 11.9',          near(result.bolus_optimized, 11.897, 0.01));
  assert('CC5 : bolus_opt > 11',             result.bolus_optimized > 11);

  const fmt = opt.formatResult(result, 0.1);
  assert('CC5 : bolus_standard_display="11.0"', fmt.bolus_standard_display === '11.0');
})();


// ════════════════════════════════════════════════════════════════════════════
// CC6 — Adulte, repas légumineuses : IG très bas, optimizer réduit
// ════════════════════════════════════════════════════════════════════════════
// Profil  : 40 ans, basale=30, rapide=18 → DTQ=48, ICR=10.417, FSI=37.5
// Repas   : lentilles 150g + haricots verts 150g + saumon 120g
//   lentilles: carbs = 20*150/100 = 30g  | cg = 20*30/100 * 150/100 = 9
//   haricots : carbs = 7*150/100  = 10.5g| cg = 7*30/100 * 150/100 = 3.15
//   saumon   : carbs = 0
//   total : carbs = 40.5g | ig_mean = round((30*30 + 30*10.5)/40.5) = 30
//           cg = 12.15
// Glycémie 130 → correction = (130-110)/37.5 = 0.5333
// Repas        = 40.5 / 10.417 = 3.888
// Total        = 4.421 → arrondi = 4.4 U
// ig_factor    = 1 + (30-55)*0.005 = 0.875 (clampé : 0.875 > 0.80 ✓)
// cg_factor    = 1.0 (cg=12.15, zone neutre)
// bolus_opt    = 4.4 * 0.875 = 3.85

suite('Cas Clinique — CC6 : adulte légumineuses + saumon (IG très bas, optimizer réduit)');
(() => {
  const db = buildDB([
    { id: 'lentilles_vertes', nom: 'Lentilles vertes', synonymes: [], glucides: 20, ig: 30, cg: 6,
      portion_usuelle: { quantite: 150, unite: 'g', description: '1 assiette' } },
    { id: 'haricot_vert',     nom: 'Haricots verts',   synonymes: [], glucides: 7,  ig: 30, cg: 2.1,
      portion_usuelle: { quantite: 150, unite: 'g', description: '1 assiette' } },
    { id: 'saumon',           nom: 'Saumon',            synonymes: [], glucides: 0,  ig: null, cg: 0,
      portion_usuelle: { quantite: 120, unite: 'g', description: '1 pavé' } },
  ]);

  const meal = db.calculateMeal([
    { aliment_id: 'lentilles_vertes', quantite_g: 150 },
    { aliment_id: 'haricot_vert',     quantite_g: 150 },
    { aliment_id: 'saumon',           quantite_g: 120 },
  ]);

  assert('CC6 : carbs_g = 40.5',             near(meal.carbs_g, 40.5));
  assert('CC6 : ig_mean = 30',               meal.ig_mean === 30);
  assert('CC6 : cg_total = 12.15',           near(meal.cg_total, 12.15, 0.01));

  const bolus = BolusMath.calcBolus({
    glycemie: 130, objectif: 110, glucides: meal.carbs_g,
    basale: 30, rapide: 18, step: 0.1
  });
  assert('CC6 : correction ≈ 0.533',         near(bolus.correction, 0.5333, 0.001));
  assert('CC6 : repas ≈ 3.888',              near(bolus.repas, 3.888, 0.001));
  assert('CC6 : totalArrondi = 4.4',         near(bolus.totalArrondi, 4.4));

  const opt    = new BolusOptimizer();
  const result = opt.optimizeBolus({
    bolus_standard: bolus.totalArrondi,
    carbs_g: meal.carbs_g, ig_mean: meal.ig_mean, cg_total: meal.cg_total,
  });
  assert('CC6 : strategy = normal (ig=30)',  result.strategy.strategy === 'normal');
  assert('CC6 : ig_factor = 0.875',          near(result.factors.ig.factor, 0.875));
  assert('CC6 : cg_factor = 1.0 (neutre)',   near(result.factors.cg.factor, 1.0));
  // L'optimizer RÉDUIT le bolus : IG très bas compense
  assert('CC6 : bolus_opt < bolus_std',      result.bolus_optimized < bolus.totalArrondi);
  assert('CC6 : bolus_opt = 3.85',           near(result.bolus_optimized, 3.85, 0.01));
})();


// ════════════════════════════════════════════════════════════════════════════
// CC7 — Adulte, dîner purée : IG très élevé → SPLIT obligatoire
// ════════════════════════════════════════════════════════════════════════════
// Profil  : 45 ans, basale=26, rapide=14 → DTQ=40, ICR=12.5, FSI=45
// Repas   : purée 200g + steak haché 100g
//   purée : carbs = 16*200/100 = 32g  | cg = 16*90/100 * 200/100 = 28.8
//   steak : carbs = 0
//   total : carbs = 32g | ig_mean = 90 (IG très élevé) | cg = 28.8
// Glycémie 190 → correction = (190-110)/45 = 1.7778
// Repas        = 32 / 12.5 = 2.56
// Total        = 4.3378 → arrondi = 4.3 U
// ig_factor    = 1 + (90-55)*0.005 = 1.175 (clamp : 1.175 < 1.20 ✓)
// cg_factor    = 1.05 (cg=28.8 ≥ 20)
// bolus_opt    = 4.3 * 1.23375 = 5.305
// → split : before=60%=3.183 | after=40%=2.122

suite('Cas Clinique — CC7 : adulte purée IG 90 → split, hyperglycémie');
(() => {
  const db = buildDB([
    { id: 'puree',        nom: 'Purée',         synonymes: [], glucides: 16, ig: 90, cg: 14.4,
      portion_usuelle: { quantite: 150, unite: 'g', description: '1 assiette' } },
    { id: 'steak_hache',  nom: 'Steak haché',   synonymes: [], glucides: 0,  ig: null, cg: 0,
      portion_usuelle: { quantite: 100, unite: 'g', description: '1 steak' } },
  ]);

  const meal = db.calculateMeal([
    { aliment_id: 'puree',       quantite_g: 200 },
    { aliment_id: 'steak_hache', quantite_g: 100 },
  ]);

  assert('CC7 : carbs_g = 32',               near(meal.carbs_g, 32));
  assert('CC7 : ig_mean = 90',               meal.ig_mean === 90);
  assert('CC7 : cg_total = 28.8',            near(meal.cg_total, 28.8, 0.01));

  const bolus = BolusMath.calcBolus({
    glycemie: 190, objectif: 110, glucides: meal.carbs_g,
    basale: 26, rapide: 14, step: 0.1
  });
  assert('CC7 : correction ≈ 1.778',         near(bolus.correction, 1.7778, 0.001));
  assert('CC7 : repas = 2.56',               near(bolus.repas, 2.56));
  assert('CC7 : totalArrondi = 4.3',         near(bolus.totalArrondi, 4.3));

  const opt    = new BolusOptimizer();
  const result = opt.optimizeBolus({
    bolus_standard: bolus.totalArrondi,
    carbs_g: meal.carbs_g, ig_mean: meal.ig_mean, cg_total: meal.cg_total,
  });
  assert('CC7 : strategy = SPLIT (ig=90)',   result.strategy.strategy === 'split');
  assert('CC7 : ig_factor = 1.175',          near(result.factors.ig.factor, 1.175));
  assert('CC7 : cg_factor = 1.05',           near(result.factors.cg.factor, 1.05));
  assert('CC7 : combined ≈ 1.234',           near(result.adjustment, 1.23375, 0.001));
  assert('CC7 : split_doses défini',         result.split_doses !== null);
  assert('CC7 : split before > after',       result.split_doses.before > result.split_doses.after);
  assert('CC7 : split 60/40 → before ≈ 60%',
    near(result.split_doses.before / result.bolus_optimized, 0.60, 0.001));

  // formatResult : cohérence before + after = total
  const fmt = opt.formatResult(result, 0.1);
  assert('CC7 : split affiché présent',      fmt.split_doses_display !== null);
  const bef = parseFloat(fmt.split_doses_display.before);
  const aft = parseFloat(fmt.split_doses_display.after);
  const tot = parseFloat(fmt.bolus_optimized_display);
  assert('CC7 : before + after = total (±0.001)', Math.abs(bef + aft - tot) < 0.001);
})();


// ════════════════════════════════════════════════════════════════════════════
// CC8 — Ado, goûter biscuits + pâte à tartiner
// ════════════════════════════════════════════════════════════════════════════
// Profil  : 13 ans, basale=18, rapide=10 → DTQ=28, ICR=17.857, FSI=64.286
// Repas   : biscotte 60g + pate_tartiner 20g
//   biscotte: carbs = 75*60/100 = 45g   | cg = 75*70/100 * 60/100 = 31.5
//   pate    : carbs = 57*20/100 = 11.4g | cg = 57*55/100 * 20/100 = 6.27
//   total   : carbs = 56.4g | ig_mean = round((70*45 + 55*11.4)/56.4) = round(66.7) = 67
//             cg = 37.77
// Glycémie 140 → correction = (140-110)/64.286 = 0.4667
// Repas        = 56.4 / 17.857 = 3.1584
// Total        = 3.6251 → arrondi = 3.6 U
// ig_factor    = 1 + (67-55)*0.005 = 1.06
// cg_factor    = 1.05 (cg=37.77 ≥ 20)
// bolus_opt    = 3.6 * 1.113 = 4.007

suite('Cas Clinique — CC8 : ado goûter biscotte + pâte à tartiner (IG fast)');
(() => {
  const db = buildDB([
    { id: 'biscotte',      nom: 'Biscottes',         synonymes: [], glucides: 75, ig: 70, cg: 52.5,
      portion_usuelle: { quantite: 20, unite: 'g', description: '2 biscottes' } },
    { id: 'pate_tartiner', nom: 'Pâte à tartiner',   synonymes: [], glucides: 57, ig: 55, cg: 31.35,
      portion_usuelle: { quantite: 20, unite: 'g', description: '1 c. à soupe' } },
  ]);

  const meal = db.calculateMeal([
    { aliment_id: 'biscotte',      quantite_g: 60 },
    { aliment_id: 'pate_tartiner', quantite_g: 20 },
  ]);

  assert('CC8 : carbs_g = 56.4',             near(meal.carbs_g, 56.4));
  assert('CC8 : ig_mean = 67',               meal.ig_mean === 67);
  assert('CC8 : cg_total ≈ 37.77',           near(meal.cg_total, 37.77, 0.01));

  const bolus = BolusMath.calcBolus({
    glycemie: 140, objectif: 110, glucides: meal.carbs_g,
    basale: 18, rapide: 10, step: 0.1
  });
  assert('CC8 : correction ≈ 0.467',         near(bolus.correction, 0.4667, 0.001));
  assert('CC8 : repas ≈ 3.158',              near(bolus.repas, 3.1584, 0.001));
  assert('CC8 : totalArrondi = 3.6',         near(bolus.totalArrondi, 3.6));

  const opt    = new BolusOptimizer();
  const result = opt.optimizeBolus({
    bolus_standard: bolus.totalArrondi,
    carbs_g: meal.carbs_g, ig_mean: meal.ig_mean, cg_total: meal.cg_total,
  });
  assert('CC8 : strategy = fast (ig=67)',    result.strategy.strategy === 'fast');
  assert('CC8 : ig_factor = 1.06',           near(result.factors.ig.factor, 1.06));
  assert('CC8 : bolus_opt ≈ 4.007',          near(result.bolus_optimized, 4.007, 0.01));
})();


// ════════════════════════════════════════════════════════════════════════════
// CC9 — Adulte, repas complet IG mixte : hyperglycémie importante
// ════════════════════════════════════════════════════════════════════════════
// Profil  : 50 ans, basale=32, rapide=20 → DTQ=52, ICR=9.615, FSI=34.615
// Repas   : riz_blanc 150g + carotte 100g + dinde 120g + pomme 150g
//   riz   : carbs = 28*150/100 = 42g  | cg = 28*70/100 * 150/100 = 29.4
//   carotte: carbs = 7*100/100 = 7g   | cg = 7*47/100 * 100/100 = 3.29
//   dinde : carbs = 0
//   pomme : carbs = 14*150/100 = 21g  | cg = 14*38/100 * 150/100 = 7.98
//   total : carbs = 70g | ig_mean = round((70*42 + 47*7 + 38*21)/70) = round(57.9) = 58
//           cg = 40.67
// Glycémie 210 → correction = (210-110)/34.615 = 2.8889
// Repas        = 70 / 9.615 = 7.28
// Total        = 10.1689 → arrondi = 10.2 U
// ig_factor    = 1.015 | cg_factor = 1.05 | combined = 1.06575
// bolus_opt    = 10.2 * 1.06575 = 10.871

suite('Cas Clinique — CC9 : adulte repas complet mixte, hyperglycémie 210');
(() => {
  const db = buildDB([
    { id: 'riz_blanc', nom: 'Riz blanc', synonymes: [], glucides: 28, ig: 70, cg: 19.6,
      portion_usuelle: { quantite: 150, unite: 'g', description: '1 assiette' } },
    { id: 'carotte',   nom: 'Carotte',   synonymes: [], glucides: 7,  ig: 47, cg: 3.29,
      portion_usuelle: { quantite: 100, unite: 'g', description: '1 carotte' } },
    { id: 'dinde',     nom: 'Dinde',     synonymes: [], glucides: 0,  ig: null, cg: 0,
      portion_usuelle: { quantite: 120, unite: 'g', description: '1 escalope' } },
    { id: 'pomme',     nom: 'Pomme',     synonymes: [], glucides: 14, ig: 38, cg: 5.3,
      portion_usuelle: { quantite: 150, unite: 'g', description: '1 pomme' } },
  ]);

  const meal = db.calculateMeal([
    { aliment_id: 'riz_blanc', quantite_g: 150 },
    { aliment_id: 'carotte',   quantite_g: 100 },
    { aliment_id: 'dinde',     quantite_g: 120 },
    { aliment_id: 'pomme',     quantite_g: 150 },
  ]);

  assert('CC9 : carbs_g = 70',               near(meal.carbs_g, 70));
  assert('CC9 : ig_mean = 58',               meal.ig_mean === 58);
  assert('CC9 : cg_total ≈ 40.67',           near(meal.cg_total, 40.67, 0.05));

  const bolus = BolusMath.calcBolus({
    glycemie: 210, objectif: 110, glucides: meal.carbs_g,
    basale: 32, rapide: 20, step: 0.1
  });
  assert('CC9 : correction ≈ 2.889',         near(bolus.correction, 2.8889, 0.001));
  assert('CC9 : repas ≈ 7.28',               near(bolus.repas, 7.28, 0.01));
  assert('CC9 : totalArrondi = 10.2',        near(bolus.totalArrondi, 10.2));

  const opt    = new BolusOptimizer();
  const result = opt.optimizeBolus({
    bolus_standard: bolus.totalArrondi,
    carbs_g: meal.carbs_g, ig_mean: meal.ig_mean, cg_total: meal.cg_total,
  });
  assert('CC9 : strategy = fast (ig=58)',    result.strategy.strategy === 'fast');
  assert('CC9 : cg_factor = 1.05',           near(result.factors.cg.factor, 1.05));
  assert('CC9 : bolus_opt ≈ 10.87',          near(result.bolus_optimized, 10.871, 0.01));
  assert('CC9 : bolus_opt > 10',             result.bolus_optimized > 10);
})();


// ════════════════════════════════════════════════════════════════════════════
// CC10 — Repas quasi sans glucides : correction pure uniquement
// ════════════════════════════════════════════════════════════════════════════
// Profil  : 35 ans, basale=25, rapide=15 → DTQ=40, ICR=12.5, FSI=45
// Repas   : poulet 120g + courgette 150g + salade 50g
//   poulet  : carbs = 0
//   courgette: carbs = 3*150/100 = 4.5g  | cg = 3*15/100 * 150/100 = 0.675
//   salade  : carbs = 2*50/100  = 1g     | cg = 2*15/100 * 50/100  = 0.15
//   total   : carbs = 5.5g | ig_mean = round((15*4.5 + 15*1)/5.5) = 15 | cg = 0.825
// Glycémie 185 → correction = (185-110)/45 = 1.6667
// Repas        = 5.5 / 12.5 = 0.44
// Total        = 2.1067 → arrondi = 2.1 U
// ig_factor    = 0.80 (ig=15 → 1+(15-55)*0.005=0.80, au bord du clamp)
// cg_factor    = 0.95 (cg=0.825 < 10)
// combined     = 0.80 * 0.95 = 0.76
// bolus_opt    = 2.1 * 0.76 = 1.596

suite('Cas Clinique — CC10 : repas sans glucides, correction pure + optimizer réduit');
(() => {
  const db = buildDB([
    { id: 'poulet',     nom: 'Poulet',     synonymes: [], glucides: 0, ig: null, cg: 0,
      portion_usuelle: { quantite: 120, unite: 'g', description: '1 escalope' } },
    { id: 'courgette',  nom: 'Courgette',  synonymes: [], glucides: 3, ig: 15, cg: 0.45,
      portion_usuelle: { quantite: 150, unite: 'g', description: '1 courgette' } },
    { id: 'salade',     nom: 'Salade',     synonymes: [], glucides: 2, ig: 15, cg: 0.3,
      portion_usuelle: { quantite: 50,  unite: 'g', description: '1 assiette' } },
  ]);

  const meal = db.calculateMeal([
    { aliment_id: 'poulet',    quantite_g: 120 },
    { aliment_id: 'courgette', quantite_g: 150 },
    { aliment_id: 'salade',    quantite_g: 50  },
  ]);

  assert('CC10 : carbs_g = 5.5',             near(meal.carbs_g, 5.5));
  assert('CC10 : ig_mean = 15',              meal.ig_mean === 15);
  assert('CC10 : cg_total ≈ 0.825',          near(meal.cg_total, 0.825, 0.001));

  const bolus = BolusMath.calcBolus({
    glycemie: 185, objectif: 110, glucides: meal.carbs_g,
    basale: 25, rapide: 15, step: 0.1
  });
  assert('CC10 : correction ≈ 1.667',        near(bolus.correction, 1.6667, 0.001));
  assert('CC10 : repas = 0.44',              near(bolus.repas, 0.44));
  assert('CC10 : totalArrondi = 2.1',        near(bolus.totalArrondi, 2.1));
  // Bolus dominé par la correction, pas par le repas
  assert('CC10 : correction >> repas',       bolus.correction > bolus.repas * 3);

  const opt    = new BolusOptimizer();
  const result = opt.optimizeBolus({
    bolus_standard: bolus.totalArrondi,
    carbs_g: meal.carbs_g, ig_mean: meal.ig_mean, cg_total: meal.cg_total,
  });
  assert('CC10 : strategy = normal (ig=15)', result.strategy.strategy === 'normal');
  // ig_factor clampé : 1+(15-55)*0.005 = 0.80 (bord du clamp -20%)
  assert('CC10 : ig_factor = 0.80 (clamp)',  near(result.factors.ig.factor, 0.80));
  assert('CC10 : cg_factor = 0.95 (CG<10)', near(result.factors.cg.factor, 0.95));
  assert('CC10 : combined = 0.76',           near(result.adjustment, 0.76));
  // L'optimizer réduit fortement : CG basse + IG très bas
  assert('CC10 : bolus_opt < bolus_std',     result.bolus_optimized < bolus.totalArrondi);
  assert('CC10 : bolus_opt ≈ 1.596',         near(result.bolus_optimized, 1.596, 0.01));
  assert('CC10 : pas de split',              result.split_doses === null);
})();
