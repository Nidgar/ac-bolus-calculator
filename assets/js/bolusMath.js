/**
 * BolusMath v1.0 — Fonctions pures du moteur bolus AC Bolus
 * ──────────────────────────────────────────────────────────
 * Source unique de vérité pour tous les calculs de dose d'insuline.
 * Aucune dépendance UI, aucun effet de bord, 100% testable.
 *
 * Formules de référence :
 *   DTQ  = basale + rapide
 *   ICR  = 500  / DTQ      (g de glucides couverts par 1 U)
 *   FSI  = 1800 / DTQ      (mg/dL de glycémie abaissée par 1 U)
 *   Correction = (glycémie - objectif) / FSI
 *   Repas      = glucides  / ICR
 *   Total      = correction + repas
 *   Affiché    = roundToStep(total, step)
 *
 * ⚠️ Sécurité médicale : ces fonctions retournent NaN (pas 0) en cas
 * d'entrée invalide, afin que l'UI puisse bloquer l'affichage proprement.
 *
 * IMPORTANT : N'auto-instancie PAS. Accessible via window.BolusMath.
 */

const BolusMath = (() => {

  // ─── Constantes médicales ──────────────────────────────────────────────
  // Règle des 500 / 1800 (méthode DiabetesNet / Walsh)
  const ICR_CONSTANT = 500;   // g de glucides / DTQ
  const FSI_CONSTANT = 1800;  // mg/dL / DTQ

  // ─── Helpers internes ─────────────────────────────────────────────────

  /**
   * Retourne true si n est un nombre fini et strictement positif
   * @private
   */
  function _positif(n) {
    return Number.isFinite(n) && n > 0;
  }

  // ─── API publique ──────────────────────────────────────────────────────

  /**
   * Calcule ICR, FSI et DTQ depuis les doses quotidiennes d'insuline.
   *
   * @param {number} basale  - Insuline basale quotidienne (U/j)
   * @param {number} rapide  - Insuline rapide quotidienne (U/j)
   * @returns {{ dtq: number, icr: number, fsi: number }}
   *   Retourne NaN sur chaque propriété si les entrées sont invalides.
   */
  function calcRatios(basale, rapide) {
    if (!Number.isFinite(basale) || !Number.isFinite(rapide)) {
      return { dtq: NaN, icr: NaN, fsi: NaN };
    }
    const dtq = basale + rapide;
    if (!_positif(dtq)) return { dtq: NaN, icr: NaN, fsi: NaN };

    return {
      dtq,
      icr: ICR_CONSTANT / dtq,
      fsi: FSI_CONSTANT / dtq,
    };
  }

  /**
   * Calcule la dose de correction.
   * Peut être négative (hypo → correction négative soustrait au bolus repas).
   *
   * @param {number} glycemie  - Glycémie actuelle (mg/dL)
   * @param {number} objectif  - Glycémie cible (mg/dL)
   * @param {number} fsi       - Facteur de sensibilité à l'insuline (mg/dL/U)
   * @returns {number} Dose de correction en U (peut être négative)
   */
  function calcCorrection(glycemie, objectif, fsi) {
    if (!Number.isFinite(glycemie) || !Number.isFinite(objectif) || !_positif(fsi)) {
      return NaN;
    }
    return (glycemie - objectif) / fsi;
  }

  /**
   * Calcule la dose repas.
   *
   * @param {number} glucides  - Glucides du repas (g)
   * @param {number} icr       - Ratio insuline/glucides (g/U)
   * @returns {number} Dose repas en U (≥ 0)
   */
  function calcRepas(glucides, icr) {
    if (!Number.isFinite(glucides) || glucides < 0 || !_positif(icr)) {
      return NaN;
    }
    return glucides / icr;
  }

  /**
   * Calcule le bolus total (correction + repas).
   *
   * @param {number} correction - Dose de correction (U, peut être négative)
   * @param {number} repas      - Dose repas (U)
   * @returns {number} Bolus total en U
   */
  function calcTotal(correction, repas) {
    if (!Number.isFinite(correction) || !Number.isFinite(repas)) {
      return NaN;
    }
    return correction + repas;
  }

  /**
  // ─── Constante step ───────────────────────────────────────────────────
  /** Pas d'arrondi par défaut (stylo insuline standard). */
  const STEP_DEFAULT = 0.1;

  /**
   * Arrondit une dose à l'incrément demandé (step).
   * Utilisé uniquement pour l'AFFICHAGE — les calculs internes restent précis.
   *
   * Si `step` est invalide (≤ 0, NaN, non-fini), applique le fallback STEP_DEFAULT
   * plutôt que de retourner `n` brut silencieusement.
   *
   * @param {number} n     - Valeur à arrondir
   * @param {number} step  - Incrément (ex: 0.1, 0.5, 1). Fallback 0.1 si invalide.
   * @returns {number} Valeur arrondie (NaN si n invalide)
   */
  function roundToStep(n, step) {
    if (!Number.isFinite(n)) return NaN;
    const s = Number(step);
    const safeStep = (Number.isFinite(s) && s > 0) ? s : STEP_DEFAULT;
    return Math.round(n / safeStep) * safeStep;
  }

  /**
   * Clamp un nombre entre min et max.
   *
   * @param {number} n
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  function clamp(n, min, max) {
    if (!Number.isFinite(n)) return NaN;
    return Math.min(max, Math.max(min, n));
  }

  /**
   * Calcul complet : correction + repas + arrondi, en une seule passe.
   * Pratique pour les tests unitaires.
   *
   * @param {{ glycemie, objectif, glucides, basale, rapide, step }} params
   * @returns {{ correction, repas, total, totalArrondi, dtq, icr, fsi }}
   *   Toutes les propriétés sont NaN si un paramètre est invalide.
   */
  function calcBolus({ glycemie, objectif, glucides, basale, rapide, step = 0.1 }) {
    const { dtq, icr, fsi } = calcRatios(basale, rapide);
    const correction   = calcCorrection(glycemie, objectif, fsi);
    const repas        = calcRepas(glucides, icr);
    const total        = calcTotal(correction, repas);
    const totalArrondi = roundToStep(total, step);

    return { correction, repas, total, totalArrondi, dtq, icr, fsi };
  }

  // ─── Exposition ───────────────────────────────────────────────────────
  return {
    calcRatios,
    calcCorrection,
    calcRepas,
    calcTotal,
    calcBolus,
    roundToStep,
    clamp,
    // Constantes exposées pour les tests
    ICR_CONSTANT,
    FSI_CONSTANT,
    STEP_DEFAULT,
  };

})();

// Exposition globale
window.BolusMath = BolusMath;
console.log('✅ BolusMath chargé (v1.0)');
