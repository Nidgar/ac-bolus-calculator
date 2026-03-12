/**
 * app.js — Bootstrap unique AC Bolus
 * @version 1.4.0
 *
 * CHANGEMENT v1.4.0 (2026-03-12) :
 *   - ✅ Ajout constante APP_VERSION (source de vérité versioning)
 *   - ✅ Affichage version dans le footer (#appVersion)
 *   - ✅ Log console au démarrage avec version et date
 *
 * CHANGEMENT v1.3.0 (2026-03-01) :
 *   - ✅ SimpleModeDataBuilder.build(db.data) appelé après FoodDatabase.load()
 *     → Simple mode lit maintenant la BDD unifiée aliments-index.json v3.0
 *   - ✅ SimpleModeWizard initialisé APRÈS build() pour garantir que
 *     SimpleModeData est populé avant le premier rendu du wizard
 *   - ✅ FoodSearchUI conserve son init indépendante (async interne inchangée)
 *   - ✅ Aucun changement sur food-database.js, food-search-ui.js, simple-mode-wizard.js
 *   - ✅ Aucun impact sur les calculs : calculateMeal() utilise FoodDatabase.data
 *     (g/100g × quantite_g), le wizard utilise glucides pré-calculés/portion
 *
 * ORDRE DE CHARGEMENT dans calculateur-bolus-final.html (bas du <body>) :
 *   1. storage.js       4. notifications.js   7. food-search-ui.js
 *   2. bolusMath.js     5. food-database.js    8. simple-mode-data.js    ← v3.0
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
  // VERSION — SOURCE DE VÉRITÉ
  // Modifier uniquement ici. Le footer HTML lit window.APP_VERSION au boot.
  // SemVer : MAJEUR.MINEUR.PATCH
  //   MAJEUR → refonte majeure (ex : apprentissage personnalisé)
  //   MINEUR → nouvelle fonctionnalité (ex : scan code-barres)
  //   PATCH  → correction de bug ou amélioration mineure
  // ══════════════════════════════════════════════════════════════════════════

  window.APP_VERSION = {
    number : '2.1.1',
    date   : '2026-03-12',
    label  : 'v2.1.1 — 12 mars 2026',
  };

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
        // 'statusFast' et 'status' retirés : statusFast existe toujours dans le HTML,
        // 'status' (nu) n'a jamais été créé — fallback géré dans le code via el.statusFast || el.status.
      ],
    },

    SimpleModeWizard: {
      critical: [
        'wizardOverlay',          // Modale principale du wizard
        'simpleModeContainer',    // Container écran d'accueil mode simple
      ],
      optional: [
        // 'recapAliments' et 'recapAccordeonBtn' retirés : injectés dynamiquement
        // par SimpleModeWizard.renderRecap() — absents au boot, c'est voulu.
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

  // ─── Mode Initié : FoodSearchUI ───────────────────────────────────────────
  // FoodSearchUI gère lui-même le chargement async de la BDD (FoodDatabase.load).
  // Son init reste synchrone ici — la BDD est chargée en interne de manière async.
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

  // ─── Mode Simple : chargement BDD → build() → wizard ──────────────────────
  /**
   * Lance le chargement de la BDD unifiée, appelle SimpleModeDataBuilder.build()
   * puis initialise SimpleModeWizard.
   *
   * Séquence garantie :
   *   FoodDatabase.load() → (async) → SimpleModeDataBuilder.build(db.data) → SimpleModeWizard.init()
   *
   * Robustesse :
   *   - Si SimpleModeDataBuilder est absent (ancienne version), fallback sur l'init directe.
   *   - Si la BDD échoue à charger, le wizard ne s'initialise pas (état dégradé).
   */
  async function initSimpleModeWithDB() {
    if (window.simpleModeWizard) { console.warn("⚠️ SimpleModeWizard déjà initialisé — skip"); return; }
    if (typeof SimpleModeWizard === "undefined") { console.error("❌ app.js : SimpleModeWizard non chargée"); return; }
    if (typeof SimpleModeData   === "undefined") { console.error("❌ app.js : SimpleModeData non chargé");   return; }

    const check = checkDOMContract('SimpleModeWizard', DOM_CONTRACT.SimpleModeWizard);
    if (!check.ok) {
      console.error("❌ SimpleModeWizard non initialisé : DOM contract échoué");
      return;
    }

    // ── Cas v3.0 : SimpleModeDataBuilder disponible → charger BDD et builder ──
    if (typeof SimpleModeDataBuilder !== "undefined" && typeof FoodDatabase !== "undefined") {
      try {
        const db = new FoodDatabase();
        const success = await db.load();

        if (!success) {
          console.error("❌ app.js : FoodDatabase.load() échoué — SimpleModeData non populé");
          // Wizard désactivé (bannière déjà injectée par FoodDatabase._onLoadFail)
          return;
        }

        // Partager l'instance DB pour que FoodSearchUI (déjà initialisé) et
        // SimpleModeDataBuilder utilisent les mêmes données.
        // Note : FoodSearchUI a sa propre instance DB — c'est intentionnel
        // (deux modules indépendants, chacun gère son état).
        const built = SimpleModeDataBuilder.build(db.data);
        if (!built) {
          console.error("❌ app.js : SimpleModeDataBuilder.build() échoué");
          return;
        }

      } catch (err) {
        console.error("❌ app.js : erreur lors du chargement BDD pour Simple mode :", err);
        return;
      }
    } else {
      // ── Fallback v2.x : SimpleModeData déjà populé statiquement ──────────
      console.log("ℹ️ app.js : SimpleModeDataBuilder absent — SimpleModeData statique v2.x utilisé");
    }

    // ── Initialisation du wizard (après build garanti) ────────────────────
    try {
      window.simpleModeWizard = new SimpleModeWizard();
      window.simpleModeWizard.init();
      console.log("✅ SimpleModeWizard initialisé (BDD unifiée v3.0)");
    } catch (err) {
      console.error("❌ Erreur création SimpleModeWizard :", err);
    }
  }

  // ─── Bootstrap ────────────────────────────────────────────────────────────
  async function boot() {
    const v = window.APP_VERSION;
    console.log(`🚀 AC Bolus ${v.label} — boot démarré`);

    // Injection de la version dans le footer
    const versionEl = document.getElementById('appVersion');
    if (versionEl) {
      versionEl.textContent = v.label;
    } else {
      console.warn("⚠️ app.js : élément #appVersion introuvable dans le footer");
    }

    // FoodSearchUI (mode Initié) — sync, gère son async en interne
    initFoodSearchUI();

    // SimpleModeWizard (mode Simple) — async, attend la BDD
    await initSimpleModeWithDB();

    console.log(`✅ AC Bolus ${v.label} : boot terminé`);
  }

  boot();

})();
