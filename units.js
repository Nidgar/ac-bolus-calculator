/**
 * GlyUnits v1.0 — Gestion des unités de glycémie AC Bolus
 * ─────────────────────────────────────────────────────────
 * Source unique de vérité pour :
 *   - Conversion mg/dL ↔ g/L  (et mmol/L pour usage futur)
 *   - Parsing robuste des saisies utilisateur (virgule/point)
 *   - Formatage cohérent à l'affichage
 *
 * L'app AC Bolus fonctionne en mg/dL nativement.
 * Ces fonctions permettent de supporter d'autres unités sans
 * modifier le moteur de calcul (BolusMath reste en mg/dL).
 *
 * Facteurs de conversion :
 *   1 g/L   = 100 mg/dL
 *   1 mmol/L = 18.016 mg/dL  (glucose, M = 180.16 g/mol)
 *
 * IMPORTANT : N'auto-instancie PAS. Accessible via window.GlyUnits.
 */

const GlyUnits = (() => {

  // ─── Facteurs de conversion ───────────────────────────────────────────
  const GL_TO_MGDL   = 100;         // 1 g/L → 100 mg/dL
  const MGDL_TO_GL   = 1 / 100;     // 1 mg/dL → 0.01 g/L
  const MMOL_TO_MGDL = 18.016;      // 1 mmol/L → 18.016 mg/dL
  const MGDL_TO_MMOL = 1 / 18.016;  // 1 mg/dL → ~0.0555 mmol/L

  // ─── Plages physiologiques (en mg/dL) ────────────────────────────────
  const RANGE = {
    min:  20,   // En dessous = valeur non physiologique
    max: 600,   // Au-dessus  = valeur non physiologique
  };

  // ─── Helpers internes ─────────────────────────────────────────────────

  /**
   * Parse une chaîne numérique (accepte virgule et point comme séparateur décimal).
   * @private
   */
  function _parse(str) {
    if (str === null || str === undefined) return NaN;
    const s = String(str).trim().replace(',', '.');
    if (s === '') return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  // ─── Conversions ─────────────────────────────────────────────────────

  /**
   * Convertit mg/dL → g/L
   * @param {number} mgdl
   * @returns {number}
   */
  function mgdlToGl(mgdl) {
    const n = _parse(mgdl);
    return Number.isFinite(n) ? n * MGDL_TO_GL : NaN;
  }

  /**
   * Convertit g/L → mg/dL
   * @param {number} gl
   * @returns {number}
   */
  function glToMgdl(gl) {
    const n = _parse(gl);
    return Number.isFinite(n) ? n * GL_TO_MGDL : NaN;
  }

  /**
   * Convertit mg/dL → mmol/L  (usage futur)
   * @param {number} mgdl
   * @returns {number}
   */
  function mgdlToMmol(mgdl) {
    const n = _parse(mgdl);
    return Number.isFinite(n) ? n * MGDL_TO_MMOL : NaN;
  }

  /**
   * Convertit mmol/L → mg/dL  (usage futur)
   * @param {number} mmol
   * @returns {number}
   */
  function mmolToMgdl(mmol) {
    const n = _parse(mmol);
    return Number.isFinite(n) ? n * MMOL_TO_MGDL : NaN;
  }

  // ─── Parsing ──────────────────────────────────────────────────────────

  /**
   * Parse une saisie glycémie en mg/dL.
   * Accepte virgule ou point comme séparateur décimal.
   * Retourne NaN si la valeur est hors plage physiologique ou non numérique.
   *
   * @param {string|number} str  - Saisie brute (ex: "1,20" ou "120")
   * @param {{ allowOutOfRange?: boolean }} [opts]
   * @returns {number} Valeur en mg/dL, ou NaN si invalide
   */
  function parseGly(str, opts = {}) {
    const n = _parse(str);
    if (!Number.isFinite(n)) return NaN;
    if (!opts.allowOutOfRange && (n < RANGE.min || n > RANGE.max)) return NaN;
    return n;
  }

  /**
   * Parse une saisie glycémie en g/L et la convertit en mg/dL.
   * Utile si l'utilisateur saisit en g/L (ex: "1,20" → 120 mg/dL).
   *
   * @param {string|number} str
   * @returns {number} Valeur en mg/dL, ou NaN si invalide
   */
  function parseGlyGl(str) {
    const gl = _parse(str);
    if (!Number.isFinite(gl)) return NaN;
    const mgdl = glToMgdl(gl);
    if (!Number.isFinite(mgdl) || mgdl < RANGE.min || mgdl > RANGE.max) return NaN;
    return mgdl;
  }

  // ─── Formatage ────────────────────────────────────────────────────────

  /**
   * Formate une valeur mg/dL pour l'affichage (entier, sans unité).
   * @param {number} mgdl
   * @returns {string}  Ex: "120" ou "—" si NaN
   */
  function formatMgdl(mgdl) {
    return Number.isFinite(mgdl) ? String(Math.round(mgdl)) : '—';
  }

  /**
   * Formate une valeur en g/L (1 décimale).
   * @param {number} gl
   * @returns {string}  Ex: "1.2" ou "—" si NaN
   */
  function formatGl(gl) {
    return Number.isFinite(gl) ? gl.toFixed(1) : '—';
  }

  /**
   * Détecte si une saisie ressemble à une valeur en g/L plutôt qu'en mg/dL.
   * Heuristique : si la valeur parsée < 30, elle est probablement en g/L
   * (ex: "1.2" = 1.2 g/L = 120 mg/dL, jamais 1.2 mg/dL physiologique).
   *
   * @param {string|number} str
   * @returns {'mgdl'|'gl'|'unknown'}
   */
  function detectUnit(str) {
    const n = _parse(str);
    if (!Number.isFinite(n)) return 'unknown';
    if (n >= RANGE.min && n <= RANGE.max) return 'mgdl';
    if (n > 0 && n < RANGE.min) {
      // Pourrait être en g/L (ex: 1.2 g/L = 120 mg/dL)
      const asMgdl = glToMgdl(n);
      if (asMgdl >= RANGE.min && asMgdl <= RANGE.max) return 'gl';
    }
    return 'unknown';
  }

  // ─── Exposition ───────────────────────────────────────────────────────
  return {
    // Conversions
    mgdlToGl,
    glToMgdl,
    mgdlToMmol,
    mmolToMgdl,
    // Parsing
    parseGly,
    parseGlyGl,
    // Formatage
    formatMgdl,
    formatGl,
    // Détection
    detectUnit,
    // Constantes
    GL_TO_MGDL,
    MGDL_TO_GL,
    MMOL_TO_MGDL,
    MGDL_TO_MMOL,
    RANGE,
  };

})();

// Exposition globale
window.GlyUnits = GlyUnits;
console.log('✅ GlyUnits chargé (v1.0)');
