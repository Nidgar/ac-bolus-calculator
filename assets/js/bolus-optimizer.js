/**
 * BolusOptimizer v2.0 — Optimisation bolus selon IG/CG (Issue 8)
 * ──────────────────────────────────────────────────────────────
 * Changements v2.0 :
 *   - optimizeBolus() accepte désormais MealMetrics { carbs_g, ig_mean, cg_total }
 *   - Rétro-compatibilité : les anciens champs { glucides, ig_moyen, cg_totale }
 *     sont acceptés via mapping interne (_normalizeMealMetrics)
 *   - Les arrondis d'affichage sont délégués à MealMetrics.format() ou à l'UI
 */

class BolusOptimizer {
  constructor() {
    this.config = {
      ig_sensitivity:    0.005,  // 0.5% par point d'IG
      ig_reference:      55,     // IG de référence (pas d'ajustement autour de 55)
      max_adjustment:    0.20,   // +20% max
      min_adjustment:   -0.20,   // -20% min
      cg_low:            10,
      cg_high:           20,
      cg_low_adjustment: -0.05,  // -5%
      cg_high_adjustment: 0.05,  // +5%
      ig_split_threshold: 70,
      ig_fast_threshold:  55,
    };
  }

  // ─── Normalisation du contrat d'entrée ────────────────────────────────

  /**
   * Normalise les métriques repas vers le contrat MealMetrics standard.
   * Accepte les deux formes :
   *   - Nouveau : { carbs_g, ig_mean, cg_total }
   *   - Ancien  : { glucides, ig_moyen, cg_totale }  (rétro-compat)
   *
   * @param {object} params
   * @returns {{ carbs_g: number, ig_mean: number, cg_total: number }}
   * @private
   */
  _normalizeMealMetrics(params) {
    return {
      carbs_g:  params.carbs_g  ?? params.glucides  ?? 0,
      ig_mean:  params.ig_mean  ?? params.ig_moyen  ?? 0,
      cg_total: params.cg_total ?? params.cg_totale ?? 0,
    };
  }

  // ─── Calcul des facteurs ──────────────────────────────────────────────

  /**
   * Facteur d'ajustement basé sur l'IG.
   * Formule : 1 + ((IG - IG_ref) × sensibilité), clampé ±20%
   *
   * @param {number} igMean
   * @returns {number} ex: 1.075 pour IG=70
   */
  calculateIGFactor(igMean) {
    if (!igMean || igMean < 0) return 1.0;
    const factor = 1 + ((igMean - this.config.ig_reference) * this.config.ig_sensitivity);
    const max = 1 + this.config.max_adjustment;
    const min = 1 + this.config.min_adjustment;
    return Math.max(min, Math.min(max, factor));
  }

  /**
   * Facteur d'ajustement basé sur la CG.
   *
   * @param {number} cgTotal
   * @returns {number} 0.95 | 1.0 | 1.05
   */
  calculateCGFactor(cgTotal) {
    if (!cgTotal || cgTotal < 0) return 1.0;
    if (cgTotal < this.config.cg_low)  return 1 + this.config.cg_low_adjustment;
    if (cgTotal >= this.config.cg_high) return 1 + this.config.cg_high_adjustment;
    return 1.0;
  }

  // ─── Stratégie ────────────────────────────────────────────────────────

  /**
   * Détermine la stratégie de bolus optimale selon l'IG moyen.
   *
   * @param {number} igMean
   * @returns {{ strategy: string, split: object, timing: string, message: string, icon: string }}
   */
  determineBolusStrategy(igMean, cgTotal = 0) {
    // P0 Issue 2 — 9 cas IG × CG : chiffres éducatifs + garde-fou "selon ton plan"

    // IG bas (< 55)
    if (!igMean || igMean < this.config.ig_fast_threshold) {
      let message;
      if      (cgTotal < 10) message = 'Bolus : 15 min avant — absorption lente, CG faible. Selon ton plan habituel.';
      else if (cgTotal < 20) message = 'Bolus : 10-15 min avant — selon ton plan habituel.';
      else                   message = 'Bolus : 10-15 min avant — CG élevée, absorption prolongée possible. Selon ton plan.';
      return {
        strategy: 'normal',
        split: { before: 100, after: 0 },
        timing: 'normal',
        message,
        icon: '🟢',
        detail: 'IG bas — absorption lente'
      };
    }

    // IG moyen (55–69)
    if (igMean < this.config.ig_split_threshold) {
      let message;
      if      (cgTotal < 10) message = 'Bolus : au moment du repas (0-5 min) — CG faible, impact modéré. Selon ton protocole.';
      else if (cgTotal < 20) message = 'Bolus : souvent proche du repas (5-10 min) — selon ton protocole.';
      else                   message = 'Bolus : 10-15 min avant — CG élevée sur IG moyen. Selon ton protocole.';
      return {
        strategy: 'fast',
        split: { before: 100, after: 0 },
        timing: 'fast',
        message,
        icon: '🟡',
        detail: 'IG moyen — absorption modérée'
      };
    }

    // IG élevé (≥ 70) : durée fractionnement modulée par CG
    let duree;
    if      (cgTotal < 20) duree = '~1h';
    else if (cgTotal < 40) duree = '1h à 1h30';
    else                   duree = '1h30 à 2h';
    return {
      strategy: 'split',
      split: { before: 60, after: 40 },
      timing: 'split',
      message: `Bolus IG élevé : certains protocoles fractionnent (${duree} entre les deux parties). Uniquement si prévu dans ton plan — valide avec un adulte/soignant.`,
      icon: '🟠',
      detail: 'IG élevé — absorption rapide et prolongée'
    };
  }

  // ─── Optimisation complète ────────────────────────────────────────────

  /**
   * Optimise le calcul du bolus complet.
   *
   * @param {object} params
   *   Champs MealMetrics v2 : { bolus_standard, carbs_g, ig_mean, cg_total }
   *   Champs legacy v1      : { bolus_standard, glucides, ig_moyen, cg_totale }
   *   Les deux formes sont acceptées (rétro-compat via _normalizeMealMetrics).
   * @returns {object} Résultat optimisé avec détails
   */
  optimizeBolus(params) {
    const { bolus_standard } = params;
    const { carbs_g, ig_mean, cg_total } = this._normalizeMealMetrics(params);

    const ig_factor       = this.calculateIGFactor(ig_mean);
    const cg_factor       = this.calculateCGFactor(cg_total);
    const combined_factor = ig_factor * cg_factor;
    const bolus_optimized = bolus_standard * combined_factor;
    // P0 Issue 2 — passer cg_total pour les 9 cas IG × CG
    const strategy        = this.determineBolusStrategy(ig_mean, cg_total);

    let split_doses = null;
    if (strategy.strategy === 'split') {
      split_doses = {
        before:       bolus_optimized * (strategy.split.before / 100),
        after:        bolus_optimized * (strategy.split.after  / 100),
        timing_after: '30-45 minutes' // donnée structurelle interne, non affichée directement
      };
    }

    const ig_class = this.classifyIG(ig_mean);
    const cg_class = this.classifyCG(cg_total);

    return {
      bolus_standard,
      bolus_optimized,
      adjustment:         combined_factor,
      adjustment_percent: ((combined_factor - 1) * 100).toFixed(1),
      factors: {
        ig: { value: ig_mean,  factor: ig_factor, adjustment_percent: ((ig_factor - 1) * 100).toFixed(1), class: ig_class },
        cg: { value: cg_total, factor: cg_factor, adjustment_percent: ((cg_factor - 1) * 100).toFixed(1), class: cg_class },
      },
      strategy,
      split_doses,
      recommendations: this.generateRecommendations({ ig_mean, cg_total, carbs_g, strategy }),
    };
  }

  // ─── Utilitaires ─────────────────────────────────────────────────────

  classifyIG(ig) {
    if (ig < 55) return { label: 'Bas',   color: 'green',  icon: '🟢' };
    if (ig < 70) return { label: 'Moyen', color: 'yellow', icon: '🟡' };
    return              { label: 'Élevé', color: 'orange', icon: '🟠' };
  }

  classifyCG(cg) {
    if (cg < 10) return { label: 'Basse',   color: 'green',  icon: '🟢' };
    if (cg < 20) return { label: 'Moyenne', color: 'yellow', icon: '🟡' };
    return              { label: 'Élevée',  color: 'orange', icon: '🟠' };
  }

  generateRecommendations({ ig_mean, cg_total, carbs_g, strategy }) {
    const recs = [];
    // Timing : message non prescriptif (Issue 2)
    recs.push({ type: 'timing', icon: strategy.icon, text: strategy.message });
    // Infos contextuelles sans impératif clinique
    if (ig_mean  >= 70) recs.push({ type: 'info', icon: '📋', text: 'IG élevé : voir les consignes de ton plan avec ton équipe soignante.' });
    if (cg_total >= 20) recs.push({ type: 'info', icon: '📋', text: 'CG élevée : à prendre en compte selon ton protocole habituel.' });
    // P1 Issue 4 — Activité physique : repère non prescriptif + garde-fou sécurité
    if (carbs_g  >  60) recs.push({ type: 'activity', icon: '🚶', text: 'Repère : l\'activité peut influencer la glycémie. À faire uniquement si prévu dans ton plan et en sécurité (surveillance + adulte).' });
    return recs;
  }

  /**
   * Formate le résultat pour l'affichage.
   * Les arrondis d'affichage sont centralisés ici (pas dans optimizeBolus).
   *
   * P1 Issue 5 — Arrondi fractionnement cohérent :
   *   before est arrondi en premier, after = total_arrondi - before_arrondi
   *   → garantit before + after = bolus_optimized_display à ±0.0 par construction.
   */
  formatResult(result, step = 0.1) {
    const round    = (n) => (Math.round(n / step) * step).toFixed(1);
    const toNum    = (s) => Math.round(parseFloat(s) * 1000) / 1000; // évite les erreurs flottantes

    const bolus_optimized_display = round(result.bolus_optimized);

    let split_doses_display = null;
    if (result.split_doses) {
      // Arrondir before en premier, after = total - before (somme garantie exacte)
      const beforeRaw    = result.bolus_optimized * (result.strategy.split.before / 100);
      const beforeStr    = round(beforeRaw);
      const afterNum     = toNum(bolus_optimized_display) - toNum(beforeStr);
      const afterStr     = afterNum.toFixed(1);

      split_doses_display = {
        before:       beforeStr,
        after:        afterStr,
        timing_after: result.split_doses.timing_after,
      };
    }

    return {
      ...result,
      bolus_standard_display:  round(result.bolus_standard),
      bolus_optimized_display,
      split_doses_display,
    };
  }

  exportConfig() { return JSON.stringify(this.config, null, 2); }

  importConfig(configJson) {
    try {
      this.config = { ...this.config, ...JSON.parse(configJson) };
      return true;
    } catch (e) {
      console.error('BolusOptimizer: config import error', e);
      return false;
    }
  }
}

window.BolusOptimizer = BolusOptimizer;
console.log('✅ BolusOptimizer chargé (v2.0)');
