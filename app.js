/**
 * app.js — Bootstrap unique AC Bolus
 * @version 1.2.0
 *
 * ORDRE DE CHARGEMENT dans calculateur-bolus-final.html (bas du <body>) :
 *   1. storage.js       4. notifications.js   7. food-search-ui.js
 *   2. bolusMath.js     5. food-database.js    8. simple-mode-data.js
 *   3. units.js         6. bolus-optimizer.js  9. simple-mode-wizard.js
 *  10. app.js   ← CE FICHIER, en dernier
 */

(() => {
  "use strict";

  if (window.__acBolusBooted) {
    console.warn("⚠️ app.js déjà exécuté — initialisation ignorée");
    return;
  }
  window.__acBolusBooted = true;

  // ══════════════════════════════════════════════════════════════════════════
  // DOM CONTRACT
  // Liste exhaustive des IDs HTML requis par chaque module.
  //
  // Criticité :
  //   'critical' → module inutilisable sans cet élément, init bloquée
  //   'optional' → dégradé acceptable, module fonctionne partiellement
  //
  // MAINTENANCE : si tu ajoutes un getElementById() dans un module,
  // ajoute l'ID ici. Si tu renommes un ID dans le HTML, mets à jour les deux.
  // ══════════════════════════════════════════════════════════════════════════

  const DOM_CONTRACT = {

    FoodSearchUI: {
      critical: [
        'carbFast',           // Input glucides du calculateur (cible de validateMeal)
        'foodSearchToggle',   // Bouton ouvrir/fermer le panneau
        'foodSearchPanel',    // Panneau principal
        'foodSearchInput',    // Champ de recherche
        'searchResults',      // Zone résultats de recherche
        'plateItems',         // Liste des aliments de l'assiette
        'plateSummary',       // Résumé glucides/IG/CG
        'validateMealBtn',    // Bouton "Valider mon repas"
      ],
      optional: [
        'statusFast',         // Zone de statut du calculateur (fallback: 'status')
        'status',             // Fallback si statusFast absent
      ],
    },

    SimpleModeWizard: {
      critical: [
        'wizardOverlay',          // Modale principale du wizard
        'simpleModeContainer',    // Container écran d'accueil mode simple
      ],
      optional: [
        'recapAliments',          // Accordéon récap aliments
        'recapAccordeonBtn',      // Bouton accordéon récap
      ],
    },

  };

  // ══════════════════════════════════════════════════════════════════════════
  // VÉRIFICATION DU CONTRAT DOM
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Vérifie la présence des éléments DOM requis pour un module.
   * @param {string} moduleName
   * @param {{ critical: string[], optional: string[] }} contract
   * @returns {{ ok: boolean, missing: string[], missingOptional: string[] }}
   */
  function checkDOMContract(moduleName, contract) {
    const missing         = (contract.critical || []).filter(id => !document.getElementById(id));
    const missingOptional = (contract.optional || []).filter(id => !document.getElementById(id));

    if (missing.length > 0) {
      const list = missing.map(id => `#${id}`).join(', ');
      console.error(`❌ DOM Contract — ${moduleName} : éléments critiques manquants → ${list}`);

      if (window.Notify?.banner) {
        window.Notify.banner(
          `Erreur d'interface — ${moduleName} désactivé`,
          'error',
          {
            id:          `dom-contract-${moduleName}`,
            detail:      `Éléments manquants : ${list}`,
            actionLabel: '🔄 Recharger',
            onAction:    () => location.reload(),
          }
        );
      }
    }

    if (missingOptional.length > 0) {
      console.warn(`⚠️ DOM Contract — ${moduleName} : optionnels absents → ${missingOptional.map(id => `#${id}`).join(', ')} (mode dégradé)`);
    }

    return { ok: missing.length === 0, missing, missingOptional };
  }

  function requireElement(id) {
    const el = document.getElementById(id);
    if (!el) console.error(`❌ app.js : élément #${id} introuvable`);
    return el;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INITIALISATIONS
  // ══════════════════════════════════════════════════════════════════════════

  function initFoodSearchUI() {
    if (window.foodSearchUI) { console.warn("⚠️ FoodSearchUI déjà initialisé — skip"); return; }
    if (typeof FoodSearchUI === "undefined") { console.error("❌ app.js : FoodSearchUI non chargée"); return; }
    if (typeof FoodDatabase === "undefined") { console.error("❌ app.js : FoodDatabase non chargée"); return; }

    const check = checkDOMContract('FoodSearchUI', DOM_CONTRACT.FoodSearchUI);
    if (!check.ok) {
      console.error("❌ FoodSearchUI non initialisé : DOM contract échoué");
      return;
    }

    const carbsInput = requireElement("carbFast");
    if (!carbsInput) return;

    try {
      window.foodSearchUI = new FoodSearchUI(carbsInput);
      console.log("✅ FoodSearchUI initialisé");
    } catch (err) {
      console.error("❌ Erreur création FoodSearchUI :", err);
    }
  }

  function initSimpleModeWizard() {
    if (window.simpleModeWizard) { console.warn("⚠️ SimpleModeWizard déjà initialisé — skip"); return; }
    if (typeof SimpleModeWizard === "undefined") { console.error("❌ app.js : SimpleModeWizard non chargée"); return; }
    if (typeof SimpleModeData   === "undefined") { console.error("❌ app.js : SimpleModeData non chargé");   return; }

    const check = checkDOMContract('SimpleModeWizard', DOM_CONTRACT.SimpleModeWizard);
    if (!check.ok) {
      console.error("❌ SimpleModeWizard non initialisé : DOM contract échoué");
      return;
    }

    try {
      window.simpleModeWizard = new SimpleModeWizard();
      window.simpleModeWizard.init();
      console.log("✅ SimpleModeWizard initialisé");
    } catch (err) {
      console.error("❌ Erreur création SimpleModeWizard :", err);
    }
  }

  // ─── Bootstrap ────────────────────────────────────────────────────────────
  function boot() {
    console.log("🚀 app.js : boot démarré");
    initFoodSearchUI();
    initSimpleModeWizard();
    console.log("✅ app.js : boot terminé");
  }

  boot();

})();
