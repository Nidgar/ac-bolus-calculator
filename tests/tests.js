/**
 * AC Bolus — Suite de tests navigateur (sans framework)
 * ───────────────────────────────────────────────────────
 * Usage : ouvrir tests/test-runner.html dans un navigateur.
 * Les tests passent sans serveur HTTP (file://) car aucun fetch n'est requis.
 *
 * Couverture :
 *   T1–T5  : BolusMath (cas nominaux, hyper, correction négative, 0g, arrondi)
 *   U1–U3  : GlyUnits  (conversions mg/dL ↔ g/L, parsing, aller-retour)
 *   DB1–DB3: FoodDatabase mock (calculateMeal, load fail, aliment introuvable)
 *   OPT1–OPT2: BolusOptimizer (facteur IG, stratégie fractionnement)
 */

// ─── Runner minimaliste ──────────────────────────────────────────────────────

const TestRunner = (() => {
  let _passed = 0;
  let _failed = 0;
  let _suite   = '';
  const _results = [];

  function suite(name) {
    _suite = name;
    _results.push({ type: 'suite', name });
  }

  /**
   * Assertion principale.
   * @param {string} label   Description lisible du test
   * @param {boolean} cond   true = ✅ PASS, false = ❌ FAIL
   * @param {string} [detail] Détail affiché en cas d'échec
   */
  function assert(label, cond, detail = '') {
    if (cond) {
      _passed++;
      _results.push({ type: 'pass', suite: _suite, label });
    } else {
      _failed++;
      _results.push({ type: 'fail', suite: _suite, label, detail });
    }
  }

  /** Vérifie que deux nombres sont proches à epsilon près. */
  function near(a, b, eps = 0.0001) {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    return Math.abs(a - b) < eps;
  }

  function run() {
    return { passed: _passed, failed: _failed, results: _results };
  }

  return { suite, assert, near, run };
})();

const { suite, assert, near } = TestRunner;


// ════════════════════════════════════════════════════════════════════════════
// T1–T5 : BolusMath
// ════════════════════════════════════════════════════════════════════════════
suite('BolusMath — calcRatios');

(() => {
  // DTQ = 25 + 15 = 40 → ICR = 500/40 = 12.5, FSI = 1800/40 = 45
  const r = BolusMath.calcRatios(25, 15);
  assert('calcRatios : DTQ = 40',        near(r.dtq, 40));
  assert('calcRatios : ICR = 12.5',      near(r.icr, 12.5));
  assert('calcRatios : FSI = 45',        near(r.fsi, 45));

  // DTQ = 0 → invalide
  const r0 = BolusMath.calcRatios(0, 0);
  assert('calcRatios : DTQ=0 → NaN',     isNaN(r0.dtq) && isNaN(r0.icr) && isNaN(r0.fsi));

  // Entrée non-numérique
  const rNaN = BolusMath.calcRatios('abc', 15);
  assert('calcRatios : basale=string → NaN', isNaN(rNaN.dtq));
})();


suite('BolusMath — T1 (cas nominal)');
(() => {
  // basale=25, rapide=15, gly=180, objectif=110, carbs=60, step=0.1
  // ICR=12.5, FSI=45
  // correction = (180-110)/45 = 1.5556
  // repas      = 60/12.5 = 4.8
  // total      = 6.3556
  // arrondi    = 6.4
  const r = BolusMath.calcBolus({ glycemie:180, objectif:110, glucides:60, basale:25, rapide:15, step:0.1 });
  assert('T1 : correction ≈ 1.556',      near(r.correction, 1.5556, 0.001));
  assert('T1 : repas = 4.8',             near(r.repas, 4.8));
  assert('T1 : total ≈ 6.356',           near(r.total, 6.3556, 0.001));
  assert('T1 : totalArrondi = 6.4',      near(r.totalArrondi, 6.4));
})();


suite('BolusMath — T2 (hyperglycémie)');
(() => {
  // gly=280, objectif=110, carbs=80
  // correction = (280-110)/45 = 3.7778
  // repas      = 80/12.5 = 6.4
  // total      = 10.1778
  // arrondi    = 10.2
  const r = BolusMath.calcBolus({ glycemie:280, objectif:110, glucides:80, basale:25, rapide:15, step:0.1 });
  assert('T2 : correction ≈ 3.778',      near(r.correction, 3.7778, 0.001));
  assert('T2 : repas = 6.4',             near(r.repas, 6.4));
  assert('T2 : totalArrondi = 10.2',     near(r.totalArrondi, 10.2));
})();


suite('BolusMath — T3 (correction négative / hypoglycémie)');
(() => {
  // gly=80, objectif=110, carbs=45
  // correction = (80-110)/45 = -0.6667
  // repas      = 45/12.5 = 3.6
  // total      = 2.9333
  // arrondi    = 2.9
  const r = BolusMath.calcBolus({ glycemie:80, objectif:110, glucides:45, basale:25, rapide:15, step:0.1 });
  assert('T3 : correction est négative',       r.correction < 0);
  assert('T3 : correction ≈ -0.667',           near(r.correction, -0.6667, 0.001));
  assert('T3 : repas = 3.6',                   near(r.repas, 3.6));
  assert('T3 : totalArrondi = 2.9',            near(r.totalArrondi, 2.9));
})();


suite('BolusMath — T4 (0 glucides)');
(() => {
  // gly=180, carbs=0 → repas = 0, total = correction seule
  const r = BolusMath.calcBolus({ glycemie:180, objectif:110, glucides:0, basale:25, rapide:15, step:0.1 });
  assert('T4 : repas = 0',              near(r.repas, 0));
  assert('T4 : total = correction',     near(r.total, r.correction));
  assert('T4 : totalArrondi = 1.6',     near(r.totalArrondi, 1.6));
})();


suite('BolusMath — T5 (arrondi 0.5 U)');
(() => {
  // même params que T1, step=0.5
  // total ≈ 6.356 → arrondi(0.5) = 6.5
  const r = BolusMath.calcBolus({ glycemie:180, objectif:110, glucides:60, basale:25, rapide:15, step:0.5 });
  assert('T5 : totalArrondi(0.5) = 6.5',  near(r.totalArrondi, 6.5));

  // Test arrondi vers le bas : 6.124 → 6.0
  assert('T5b : roundToStep(6.124, 0.5) = 6.0', near(BolusMath.roundToStep(6.124, 0.5), 6.0));

  // Arrondi 1 U : 6.356 → 6
  assert('T5c : roundToStep(6.356, 1) = 6', near(BolusMath.roundToStep(6.356, 1), 6));
})();


suite('BolusMath — Sécurité (entrées invalides)');
(() => {
  assert('calcCorrection : fsi=0 → NaN',        isNaN(BolusMath.calcCorrection(180, 110, 0)));
  assert('calcRepas : glucides négatifs → NaN',  isNaN(BolusMath.calcRepas(-10, 12.5)));
  assert('calcRepas : icr=0 → NaN',             isNaN(BolusMath.calcRepas(60, 0)));
  assert('calcTotal : correction=NaN → NaN',    isNaN(BolusMath.calcTotal(NaN, 4.8)));
  assert('roundToStep : n=NaN → NaN',           isNaN(BolusMath.roundToStep(NaN, 0.1)));
  assert('roundToStep : step=0 → fallback 0.1 (3.14 → 3.1)', near(BolusMath.roundToStep(3.14, 0), 3.1));
})();


suite('BolusMath — STEP1 : step invalide → fallback 0.1 garanti');
(() => {
  // step=0 → fallback 0.1
  assert('STEP1 : step=0 → arrondi à 0.1',         near(BolusMath.roundToStep(6.3556, 0), 6.4, 0.001));
  // step=NaN → fallback 0.1
  assert('STEP1 : step=NaN → arrondi à 0.1',        near(BolusMath.roundToStep(6.3556, NaN), 6.4, 0.001));
  // step=-1 → fallback 0.1
  assert('STEP1 : step=-1 → arrondi à 0.1',         near(BolusMath.roundToStep(6.3556, -1), 6.4, 0.001));
  // step=Infinity → fallback 0.1
  assert('STEP1 : step=Infinity → arrondi à 0.1',   near(BolusMath.roundToStep(6.3556, Infinity), 6.4, 0.001));
  // step valide 0.5 → pas de fallback, arrondi normal
  assert('STEP1 : step=0.5 valide → pas de fallback', near(BolusMath.roundToStep(6.3556, 0.5), 6.5));
  // step valide 1 → arrondi à 1
  assert('STEP1 : step=1 valide → arrondi à 1',      near(BolusMath.roundToStep(6.3556, 1), 6));
  // STEP_DEFAULT exposé = 0.1
  assert('STEP1 : STEP_DEFAULT = 0.1',               near(BolusMath.STEP_DEFAULT, 0.1));
  // calcBolus avec step=0 utilise le fallback → résultat arrondi (pas brut)
  const r0 = BolusMath.calcBolus({ glycemie:180, objectif:110, glucides:60, basale:25, rapide:15, step:0 });
  const rOk = BolusMath.calcBolus({ glycemie:180, objectif:110, glucides:60, basale:25, rapide:15, step:0.1 });
  assert('STEP1 : calcBolus(step=0) = calcBolus(step=0.1)', near(r0.totalArrondi, rOk.totalArrondi));
})();


// ════════════════════════════════════════════════════════════════════════════
// U1–U3 : GlyUnits
// ════════════════════════════════════════════════════════════════════════════
suite('GlyUnits — U1 : conversions mg/dL ↔ g/L');
(() => {
  assert('U1 : 120 mg/dL → 1.2 g/L',    near(GlyUnits.mgdlToGl(120), 1.2));
  assert('U1 : 1.2 g/L → 120 mg/dL',    near(GlyUnits.glToMgdl(1.2), 120));
  assert('U1 : 0 mg/dL → 0 g/L',        near(GlyUnits.mgdlToGl(0), 0));
  assert('U1 : NaN → NaN',              isNaN(GlyUnits.mgdlToGl(NaN)));
  assert('U1 : string "abc" → NaN',     isNaN(GlyUnits.mgdlToGl('abc')));
})();


suite('GlyUnits — U2 : parsing saisies utilisateur');
(() => {
  // Accepte virgule et point
  assert('U2 : parseGly("120") = 120',        near(GlyUnits.parseGly('120'), 120));
  assert('U2 : parseGly("1,20") → NaN (hors range)', isNaN(GlyUnits.parseGly('1,20')));
  // "1,20" parsé = 1.20, hors plage [20–600] → NaN
  assert('U2 : parseGlyGl("1,20") = 120',    near(GlyUnits.parseGlyGl('1,20'), 120));
  assert('U2 : parseGlyGl("1.20") = 120',    near(GlyUnits.parseGlyGl('1.20'), 120));

  // Hors plage
  assert('U2 : parseGly(10) → NaN (< 20)',    isNaN(GlyUnits.parseGly(10)));
  assert('U2 : parseGly(700) → NaN (> 600)',  isNaN(GlyUnits.parseGly(700)));
  assert('U2 : parseGly(700, allowOutOfRange) = 700', near(GlyUnits.parseGly(700, { allowOutOfRange: true }), 700));

  // Entrées invalides
  assert('U2 : parseGly("") → NaN',          isNaN(GlyUnits.parseGly('')));
  assert('U2 : parseGly(null) → NaN',        isNaN(GlyUnits.parseGly(null)));
})();


suite('GlyUnits — U3 : aller-retour sans dérive (10 fois)');
(() => {
  let val = 120; // mg/dL
  for (let i = 0; i < 10; i++) {
    val = GlyUnits.glToMgdl(GlyUnits.mgdlToGl(val));
  }
  assert('U3 : 10 allers-retours mg/dL→g/L→mg/dL sans dérive', near(val, 120, 0.001));

  // mmol/L aller-retour
  let valMmol = 120;
  for (let i = 0; i < 10; i++) {
    valMmol = GlyUnits.mmolToMgdl(GlyUnits.mgdlToMmol(valMmol));
  }
  assert('U3 : 10 allers-retours mg/dL→mmol→mg/dL sans dérive', near(valMmol, 120, 0.001));
})();


suite('GlyUnits — formatage');
(() => {
  assert('formatMgdl(120) = "120"',      GlyUnits.formatMgdl(120) === '120');
  assert('formatMgdl(120.6) = "121"',    GlyUnits.formatMgdl(120.6) === '121');
  assert('formatMgdl(NaN) = "—"',        GlyUnits.formatMgdl(NaN) === '—');
  assert('formatGl(1.2) = "1.2"',        GlyUnits.formatGl(1.2) === '1.2');
  assert('detectUnit("120") = "mgdl"',   GlyUnits.detectUnit('120') === 'mgdl');
  assert('detectUnit("1.2") = "gl"',     GlyUnits.detectUnit('1.2') === 'gl');
  assert('detectUnit("abc") = "unknown"',GlyUnits.detectUnit('abc') === 'unknown');
})();


// ════════════════════════════════════════════════════════════════════════════
// DB1–DB3 : FoodDatabase (mock — sans fetch)
// ════════════════════════════════════════════════════════════════════════════
suite('FoodDatabase — DB1 : calculateMeal → contrat MealMetrics');
(() => {
  const db = new FoodDatabase();
  db.data = {
    version: 'mock',
    categories: [{
      id: 'test', nom: 'Test', icon: '🧪',
      aliments: [
        { id: 'pain',  nom: 'Pain blanc', synonymes: ['baguette'], glucides: 55, ig: 70, cg: 38.5,
          portion_usuelle: { quantite: 50,  unite: 'g', description: '2 tranches' } },
        { id: 'pomme', nom: 'Pomme',      synonymes: ['golden'],   glucides: 14, ig: 38, cg: 5.3,
          portion_usuelle: { quantite: 150, unite: 'g', description: '1 pomme' } },
      ]
    }]
  };
  db.loaded = true;

  // 50g de pain + 150g de pomme
  // Pain  : carbs = 55*50/100  = 27.5g, cg = 38.5*50/100  = 19.25
  // Pomme : carbs = 14*150/100 = 21g,   cg = 5.3*150/100  = 7.95
  // carbs_g  = 48.5 (brut, pas d'arrondi interne)
  // ig_mean  = round((70*27.5 + 38*21) / 48.5) = round(56.14) = 56
  // cg_total = 27.2 brut
  const meal = db.calculateMeal([
    { aliment_id: 'pain',  quantite_g: 50  },
    { aliment_id: 'pomme', quantite_g: 150 },
  ]);

  // Contrat MealMetrics — champs corrects
  assert('DB1 : contrat MealMetrics valide',       MealMetrics.isValid(meal));
  assert('DB1 : carbs_g brut ≈ 48.5',              near(meal.carbs_g, 48.5));
  assert('DB1 : ig_mean = 56',                     meal.ig_mean === 56);
  assert('DB1 : cg_total brut ≈ 27.2',             near(meal.cg_total, 27.2, 0.01));

  // MealMetrics.format() — arrondis UI
  const fmt = MealMetrics.format(meal);
  assert('DB1 : format().carbs_g = "48.5"',        fmt.carbs_g  === '48.5');
  assert('DB1 : format().ig_mean = "56"',          fmt.ig_mean  === '56');
  assert('DB1 : format().cg_total = "27.2"',       fmt.cg_total === '27.2');

  // Assiette vide → MealMetrics.empty()
  const empty = db.calculateMeal([]);
  assert('DB1 : assiette vide → carbs_g=0',        empty.carbs_g === 0);
  assert('DB1 : assiette vide → MealMetrics valide', MealMetrics.isValid(empty));

  // Repas 2 : pain seul 100g → carbs_g = 55, ig_mean = 70, cg_total = 38.5
  const meal2 = db.calculateMeal([{ aliment_id: 'pain', quantite_g: 100 }]);
  assert('DB1 meal2 : carbs_g = 55',               near(meal2.carbs_g, 55));
  assert('DB1 meal2 : ig_mean = 70',               meal2.ig_mean === 70);
  assert('DB1 meal2 : cg_total = 38.5',            near(meal2.cg_total, 38.5));
})();


suite('FoodDatabase — DB2 : load fail (fetch échoue)');
(() => {
  const db = new FoodDatabase();

  // Stub console pour ce test : DB2 déclenche volontairement des erreurs
  // (retry, échec définitif, bannière fallback) — on les silence dans le runner.
  const _ce = console.error;
  const _cw = console.warn;
  console.error = () => {};
  console.warn  = () => {};

  const promise = db.load('./fichier-inexistant-404.json', { retry: false });
  promise.then(result => {
    // Restaurer la console dès que la promesse résout
    console.error = _ce;
    console.warn  = _cw;

    assert('DB2 : load("404.json") retourne false', result === false);
    assert('DB2 : db.loaded reste false',           db.loaded === false);
    if (typeof window !== 'undefined' && window._testRunnerRenderFinal) {
      window._testRunnerRenderFinal();
    }
  }).catch(() => {
    console.error = _ce;
    console.warn  = _cw;
  });
})();


suite('FoodDatabase — DB3 : aliment introuvable');
(() => {
  const db = new FoodDatabase();
  db.data   = { version: 'mock', categories: [] };
  db.loaded = true;

  // Stub console : ces appels déclenchent volontairement console.error/warn
  const _ce = console.error, _cw = console.warn;
  console.error = () => {};
  console.warn  = () => {};

  assert('DB3 : getById("inconnu") retourne null',  db.getById('inconnu') === null);
  const meal = db.calculateMeal([{ aliment_id: 'inexistant', quantite_g: 100 }]);
  assert('DB3 : calculateMeal(aliment inconnu) → carbs_g=0', meal.carbs_g === 0);

  console.error = _ce;
  console.warn  = _cw;
})();


// ════════════════════════════════════════════════════════════════════════════
// OPT1–OPT2 : BolusOptimizer
// ════════════════════════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════════════════
// MM1–MM3 : MealMetrics (contrat + format + validation)
// ════════════════════════════════════════════════════════════════════════════
suite('MealMetrics — MM1 : contrat et format');
(() => {
  // empty()
  const e = MealMetrics.empty();
  assert('MM1 : empty() → carbs_g=0',   e.carbs_g  === 0);
  assert('MM1 : empty() → ig_mean=0',   e.ig_mean  === 0);
  assert('MM1 : empty() → cg_total=0',  e.cg_total === 0);
  assert('MM1 : empty() valide',         MealMetrics.isValid(e));

  // format() — arrondis
  const m = { carbs_g: 48.4789, ig_mean: 56, cg_total: 27.1999 };
  const f = MealMetrics.format(m);
  assert('MM1 : format carbs_g="48.5"',  f.carbs_g  === '48.5');
  assert('MM1 : format ig_mean="56"',    f.ig_mean  === '56');
  assert('MM1 : format cg_total="27.2"', f.cg_total === '27.2');

  // isValid()
  assert('MM1 : isValid({0,0,0})',         MealMetrics.isValid({ carbs_g: 0, ig_mean: 0, cg_total: 0 }));
  assert('MM1 : isValid(null)=false',      !MealMetrics.isValid(null));
  assert('MM1 : isValid(NaN champ)=false', !MealMetrics.isValid({ carbs_g: NaN, ig_mean: 0, cg_total: 0 }));
  assert('MM1 : isValid(champ manquant)=false', !MealMetrics.isValid({ carbs_g: 10 }));
})();


suite('BolusOptimizer — OPT3 : rétro-compat anciens champs');
(() => {
  const opt = new BolusOptimizer();
  // Anciens noms : glucides, ig_moyen, cg_totale
  const r = opt.optimizeBolus({ bolus_standard: 5, glucides: 60, ig_moyen: 70, cg_totale: 25 });
  assert('OPT3 : rétro-compat → bolus_optimized défini', Number.isFinite(r.bolus_optimized));
  // Nouveaux noms : carbs_g, ig_mean, cg_total
  const r2 = opt.optimizeBolus({ bolus_standard: 5, carbs_g: 60, ig_mean: 70, cg_total: 25 });
  assert('OPT3 : nouveaux champs → même bolus_optimized', near(r.bolus_optimized, r2.bolus_optimized));
})();

suite('BolusOptimizer — OPT1 : facteur IG');
(() => {
  const opt = new BolusOptimizer();
  // IG = 55 (référence) → facteur = 1.0 (pas d'ajustement)
  assert('OPT1 : IG=55 → facteur=1.0',      near(opt.calculateIGFactor(55), 1.0));
  // IG = 70 → facteur = 1 + (70-55)*0.005 = 1 + 0.075 = 1.075
  assert('OPT1 : IG=70 → facteur=1.075',     near(opt.calculateIGFactor(70), 1.075));
  // IG = 35 (bas) → facteur = 1 + (35-55)*0.005 = 1 - 0.1 = 0.9
  assert('OPT1 : IG=35 → facteur=0.9',       near(opt.calculateIGFactor(35), 0.9));
  // IG très élevé → clamp à 1.20 (max +20%)
  assert('OPT1 : IG=1000 → clamp à 1.20',    near(opt.calculateIGFactor(1000), 1.20));
})();


suite('BolusOptimizer — OPT2 : stratégie fractionnement');
(() => {
  const opt = new BolusOptimizer();
  // IG < 55 → strategy 'normal'
  assert('OPT2 : IG=40 → strategy normal',  opt.determineBolusStrategy(40).strategy === 'normal');
  // IG 55–70 → strategy 'fast'
  assert('OPT2 : IG=62 → strategy fast',    opt.determineBolusStrategy(62).strategy === 'fast');
  // IG > 70 → strategy 'split'
  assert('OPT2 : IG=80 → strategy split',   opt.determineBolusStrategy(80).strategy === 'split');
  // split : 60% avant, 40% après
  const s = opt.determineBolusStrategy(85);
  assert('OPT2 : split 60/40',              s.split.before === 60 && s.split.after === 40);
})();
