/**
 * BolusOptimizer - Optimisation du calcul de bolus selon IG/CG
 * Intégration avec FoodDatabase pour ajustements intelligents
 */

class BolusOptimizer {
  constructor() {
    // Paramètres par défaut (personnalisables)
    this.config = {
      // Facteur de sensibilité à l'IG (0.005 = 0.5% par point d'IG)
      ig_sensitivity: 0.005,
      
      // IG de référence (autour duquel il n'y a pas d'ajustement)
      ig_reference: 55,
      
      // Limites des ajustements (±20%)
      max_adjustment: 0.20,
      min_adjustment: -0.20,
      
      // Seuils CG
      cg_low: 10,
      cg_high: 20,
      
      // Ajustements CG
      cg_low_adjustment: -0.05,  // -5%
      cg_high_adjustment: 0.05,  // +5%
      
      // Seuils pour fractionnement
      ig_split_threshold: 70,
      ig_fast_threshold: 55
    };
  }

  /**
   * Calcule le facteur d'ajustement basé sur l'IG
   * @param {number} ig_moyen - IG moyen du repas
   * @returns {number} - Facteur multiplicateur (ex: 1.05 = +5%)
   */
  calculateIGFactor(ig_moyen) {
    if (!ig_moyen || ig_moyen < 0) return 1.0;
    
    // Formule : 1 + ((IG - IG_ref) × sensibilité)
    let factor = 1 + ((ig_moyen - this.config.ig_reference) * this.config.ig_sensitivity);
    
    // Limiter les ajustements
    const maxFactor = 1 + this.config.max_adjustment;
    const minFactor = 1 + this.config.min_adjustment;
    
    factor = Math.max(minFactor, Math.min(maxFactor, factor));
    
    return factor;
  }

  /**
   * Calcule le facteur d'ajustement basé sur la CG
   * @param {number} cg_totale - CG totale du repas
   * @returns {number} - Facteur multiplicateur
   */
  calculateCGFactor(cg_totale) {
    if (!cg_totale || cg_totale < 0) return 1.0;
    
    if (cg_totale < this.config.cg_low) {
      return 1 + this.config.cg_low_adjustment;  // -5%
    } else if (cg_totale >= this.config.cg_high) {
      return 1 + this.config.cg_high_adjustment; // +5%
    }
    
    return 1.0; // CG moyenne, pas d'ajustement
  }

  /**
   * Détermine la stratégie de bolus optimale
   * @param {number} ig_moyen - IG moyen du repas
   * @returns {Object} - {strategy, split, timing, message}
   */
  determineBolusStrategy(ig_moyen) {
    if (!ig_moyen || ig_moyen < 0) {
      return {
        strategy: 'standard',
        split: { before: 100, after: 0 },
        timing: 'normal',
        message: 'Bolus standard : 10-15 min avant le repas',
        icon: '🟢'
      };
    }

    if (ig_moyen < this.config.ig_fast_threshold) {
      // IG bas : bolus normal
      return {
        strategy: 'normal',
        split: { before: 100, after: 0 },
        timing: 'normal',
        message: 'Bolus normal : 10-15 min avant le repas',
        icon: '🟢',
        detail: 'IG bas - absorption lente, pas de risque de pic'
      };
    } else if (ig_moyen < this.config.ig_split_threshold) {
      // IG moyen : bolus rapide
      return {
        strategy: 'fast',
        split: { before: 100, after: 0 },
        timing: 'fast',
        message: 'Bolus rapide : 5-10 min avant le repas',
        icon: '🟡',
        detail: 'IG moyen - absorption modérée'
      };
    } else {
      // IG élevé : fractionnement suggéré
      return {
        strategy: 'split',
        split: { before: 60, after: 40 },
        timing: 'split',
        message: 'Bolus fractionné : 60% avant, 40% après 30-45 min',
        icon: '🟠',
        detail: 'IG élevé - risque de pic rapide puis prolongé',
        warning: '⚠️ Surveillance glycémie recommandée à +30min et +2h'
      };
    }
  }

  /**
   * Optimise le calcul du bolus complet
   * @param {Object} params - {bolus_standard, ig_moyen, cg_totale, glucides}
   * @returns {Object} - Résultat optimisé avec détails
   */
  optimizeBolus(params) {
    const { bolus_standard, ig_moyen, cg_totale, glucides } = params;

    // 1. Calculer les facteurs d'ajustement
    const ig_factor = this.calculateIGFactor(ig_moyen);
    const cg_factor = this.calculateCGFactor(cg_totale);
    
    // 2. Facteur combiné (multiplication)
    const combined_factor = ig_factor * cg_factor;
    
    // 3. Bolus optimisé
    const bolus_optimized = bolus_standard * combined_factor;
    
    // 4. Stratégie de bolus
    const strategy = this.determineBolusStrategy(ig_moyen);
    
    // 5. Calcul du fractionnement si nécessaire
    let split_doses = null;
    if (strategy.strategy === 'split') {
      split_doses = {
        before: bolus_optimized * (strategy.split.before / 100),
        after: bolus_optimized * (strategy.split.after / 100),
        timing_after: '30-45 minutes'
      };
    }

    // 6. Classification IG/CG
    const ig_class = this.classifyIG(ig_moyen);
    const cg_class = this.classifyCG(cg_totale);

    return {
      // Bolus
      bolus_standard: bolus_standard,
      bolus_optimized: bolus_optimized,
      adjustment: combined_factor,
      adjustment_percent: ((combined_factor - 1) * 100).toFixed(1),
      
      // Facteurs détaillés
      factors: {
        ig: {
          value: ig_moyen,
          factor: ig_factor,
          adjustment_percent: ((ig_factor - 1) * 100).toFixed(1),
          class: ig_class
        },
        cg: {
          value: cg_totale,
          factor: cg_factor,
          adjustment_percent: ((cg_factor - 1) * 100).toFixed(1),
          class: cg_class
        }
      },
      
      // Stratégie
      strategy: strategy,
      split_doses: split_doses,
      
      // Recommandations
      recommendations: this.generateRecommendations({
        ig_moyen,
        cg_totale,
        glucides,
        strategy
      })
    };
  }

  /**
   * Classifie l'IG
   */
  classifyIG(ig) {
    if (ig < 55) return { label: 'Bas', color: 'green', icon: '🟢' };
    if (ig < 70) return { label: 'Moyen', color: 'yellow', icon: '🟡' };
    return { label: 'Élevé', color: 'orange', icon: '🟠' };
  }

  /**
   * Classifie la CG
   */
  classifyCG(cg) {
    if (cg < 10) return { label: 'Basse', color: 'green', icon: '🟢' };
    if (cg < 20) return { label: 'Moyenne', color: 'yellow', icon: '🟡' };
    return { label: 'Élevée', color: 'orange', icon: '🟠' };
  }

  /**
   * Génère des recommandations personnalisées
   */
  generateRecommendations(params) {
    const { ig_moyen, cg_totale, glucides, strategy } = params;
    const recommendations = [];

    // Recommandation timing
    recommendations.push({
      type: 'timing',
      icon: '⏰',
      text: strategy.message
    });

    // Recommandation surveillance
    if (ig_moyen >= 70) {
      recommendations.push({
        type: 'monitoring',
        icon: '📊',
        text: 'Surveiller la glycémie à +30min, +1h et +2h'
      });
    }

    // Recommandation CG élevée
    if (cg_totale >= 20) {
      recommendations.push({
        type: 'caution',
        icon: '⚠️',
        text: 'CG élevée : risque de pic glycémique prolongé'
      });
    }

    // Recommandation activité
    if (glucides > 60) {
      recommendations.push({
        type: 'activity',
        icon: '🚶',
        text: 'Repas copieux : activité physique légère recommandée après le repas'
      });
    }

    return recommendations;
  }

  /**
   * Formate l'affichage du résultat optimisé
   */
  formatResult(result, step = 0.1) {
    const rounded_standard = Math.round(result.bolus_standard / step) * step;
    const rounded_optimized = Math.round(result.bolus_optimized / step) * step;

    return {
      ...result,
      bolus_standard_display: rounded_standard.toFixed(1),
      bolus_optimized_display: rounded_optimized.toFixed(1),
      split_doses_display: result.split_doses ? {
        before: (Math.round(result.split_doses.before / step) * step).toFixed(1),
        after: (Math.round(result.split_doses.after / step) * step).toFixed(1),
        timing_after: result.split_doses.timing_after
      } : null
    };
  }

  /**
   * Compare deux stratégies de bolus (pour A/B testing futur)
   */
  compareStrategies(bolus1, bolus2) {
    return {
      difference: bolus2 - bolus1,
      difference_percent: ((bolus2 - bolus1) / bolus1 * 100).toFixed(1),
      recommendation: bolus2 > bolus1 ? 'increase' : 'decrease'
    };
  }

  /**
   * Exporte la configuration actuelle
   */
  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Importe une configuration personnalisée
   */
  importConfig(configJson) {
    try {
      const newConfig = JSON.parse(configJson);
      this.config = { ...this.config, ...newConfig };
      return true;
    } catch (error) {
      console.error('Config import error:', error);
      return false;
    }
  }
}

// Export global
window.BolusOptimizer = BolusOptimizer;
