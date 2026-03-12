/**
 * AppStorage v1.0 — Storage unifié AC Bolus
 * ─────────────────────────────────────────
 * Remplace tous les accès directs à localStorage dispersés dans l'app.
 *
 * API publique :
 *   AppStorage.get(key, { maxAge?, schemaVersion? })
 *     → valeur (any) ou null si absente / expirée / version obsolète
 *
 *   AppStorage.set(key, value, { ttl?, schemaVersion? })
 *     → true si succès, false si quota dépassé ou erreur
 *
 *   AppStorage.clear(key)
 *     → void
 *
 * Format interne stocké (JSON) :
 * {
 *   v: 1,                  // version enveloppe AppStorage (pour migration future)
 *   sv: <schemaVersion>,   // version du schéma de la donnée (optionnel)
 *   savedAt: <timestamp>,  // date d'écriture (ms)
 *   expiresAt: <timestamp> | null,  // null = pas d'expiration
 *   data: <any>            // la vraie valeur
 * }
 *
 * IMPORTANT : N'auto-instancie PAS. Accessible via window.AppStorage.
 */

const AppStorage = (() => {

  // Version de l'enveloppe (à incrémenter si on change le format interne)
  const ENVELOPE_VERSION = 1;

  /**
   * Lire une valeur depuis localStorage
   *
   * @param {string} key - Clé localStorage
   * @param {object} [opts]
   * @param {number} [opts.maxAge]         - Durée max en ms (prioritaire sur expiresAt stocké)
   * @param {number} [opts.schemaVersion]  - Si fourni, rejette les données d'une autre version
   * @returns {*} La valeur désérialisée, ou null si absente / expirée / incompatible
   */
  function get(key, opts = {}) {
    const { maxAge, schemaVersion } = opts;

    let raw;
    try {
      raw = localStorage.getItem(key);
    } catch (e) {
      console.warn(`⚠️ AppStorage.get("${key}") : localStorage inaccessible`, e);
      return null;
    }

    if (raw === null) return null;

    let envelope;
    try {
      envelope = JSON.parse(raw);
    } catch (e) {
      console.warn(`⚠️ AppStorage.get("${key}") : JSON invalide — clé supprimée`);
      _silentRemove(key);
      return null;
    }

    // Vérification format enveloppe (compatibilité future)
    if (!envelope || typeof envelope !== 'object' || envelope.v !== ENVELOPE_VERSION) {
      console.warn(`⚠️ AppStorage.get("${key}") : enveloppe v${envelope?.v} ≠ v${ENVELOPE_VERSION} — clé supprimée`);
      _silentRemove(key);
      return null;
    }

    // Vérification schemaVersion
    if (schemaVersion !== undefined && envelope.sv !== schemaVersion) {
      console.warn(`⚠️ AppStorage.get("${key}") : schéma v${envelope.sv} ≠ v${schemaVersion} attendu — clé supprimée`);
      _silentRemove(key);
      return null;
    }

    // Vérification expiration
    const now = Date.now();

    // maxAge (fourni à l'appel) est prioritaire sur expiresAt stocké
    if (maxAge !== undefined) {
      if (!Number.isFinite(envelope.savedAt) || now - envelope.savedAt > maxAge) {
        console.log(`⏰ AppStorage.get("${key}") : expiré (maxAge=${maxAge}ms) — clé supprimée`);
        _silentRemove(key);
        return null;
      }
    } else if (envelope.expiresAt !== null && Number.isFinite(envelope.expiresAt)) {
      if (now > envelope.expiresAt) {
        console.log(`⏰ AppStorage.get("${key}") : expiré (expiresAt=${new Date(envelope.expiresAt).toLocaleTimeString()}) — clé supprimée`);
        _silentRemove(key);
        return null;
      }
    }

    return envelope.data;
  }

  /**
   * Écrire une valeur dans localStorage
   *
   * @param {string} key - Clé localStorage
   * @param {*} value    - Valeur à stocker (doit être sérialisable en JSON)
   * @param {object} [opts]
   * @param {number} [opts.ttl]           - Durée de vie en ms (ex: 8 * 3600 * 1000 pour 8h)
   * @param {number} [opts.schemaVersion] - Version du schéma de la donnée
   * @returns {boolean} true si succès, false si erreur
   */
  function set(key, value, opts = {}) {
    const { ttl, schemaVersion } = opts;
    const now = Date.now();

    const envelope = {
      v: ENVELOPE_VERSION,
      sv: schemaVersion !== undefined ? schemaVersion : null,
      savedAt: now,
      expiresAt: (ttl !== undefined && Number.isFinite(ttl)) ? now + ttl : null,
      data: value
    };

    try {
      localStorage.setItem(key, JSON.stringify(envelope));
      return true;
    } catch (e) {
      // QuotaExceededError ou autres
      console.error(`❌ AppStorage.set("${key}") : échec écriture`, e);
      return false;
    }
  }

  /**
   * Supprimer une clé
   * @param {string} key
   */
  function clear(key) {
    _silentRemove(key);
  }

  /**
   * Supprimer sans lever d'exception
   * @private
   */
  function _silentRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (_) { /* silencieux */ }
  }

  // ─── Clés centralisées ────────────────────────────────────────────────────
  // Toutes les clés de l'app sont déclarées ici pour éviter les typos
  // et faciliter la migration future.
  const KEYS = {
    theme:       'bc_theme',
    simpleMode:  'bc_simple',
    ratios:      'bc_ratios',
    lastCarbs:   'bc_last_carbs',
    meal:        'bc_meal_composition',
  };

  // ─── Versions de schéma ───────────────────────────────────────────────────
  const SCHEMA = {
    ratios: 2,  // v2 : { basale, rapide, objectif, step }
    meal:   2,  // v2 : Array<{ id, nom, glucides, ig, quantite, … }>
  };

  // ─── TTL par défaut ───────────────────────────────────────────────────────
  const TTL = {
    ratios: 3 * 24 * 60 * 60 * 1000,  // 3 jours
    meal:   8 * 60 * 60 * 1000,       // 8 heures
  };

  // ─── API exposée ──────────────────────────────────────────────────────────
  return {
    get,
    set,
    clear,
    KEYS,
    SCHEMA,
    TTL,
  };

})();

// Exposition globale (pas d'ES modules pour compatibilité maximale)
// Garde-fou : si déjà défini par le script inline du HTML, ne pas écraser
if (!window.AppStorage) {
  window.AppStorage = AppStorage;
  console.log('✅ AppStorage chargé depuis storage.js (v1.0)');
} else {
  console.log('✅ AppStorage déjà présent (défini inline) — storage.js ignoré');
}
