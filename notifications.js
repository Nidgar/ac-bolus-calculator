/**
 * Notify v1.0 — Système de notifications centralisé AC Bolus
 * ─────────────────────────────────────────────────────────────
 * API unifiée pour tous les feedbacks utilisateur.
 * Remplace les showNotification / showCenteredNotification dispersés.
 *
 * Niveaux :
 *   'info'  → cyan   — information neutre (ajout, suppression)
 *   'warn'  → jaune  — attention (doublon, limite dépassée)
 *   'error' → rouge  — erreur bloquante (DB fail, quota dépassé)
 *
 * API :
 *   Notify.toast(message, level, durationMs)  → toast coin haut-droit
 *   Notify.center(message, level, durationMs) → notification centrée (actions rapides)
 *   Notify.banner(message, level, opts)        → bannière persistante (erreurs bloquantes)
 *   Notify.confirm(title, message, onConfirm, level) → modale confirmation
 *   Notify.dismiss(id)                         → fermer une bannière par ID
 *
 * Règles de filtrage (éviter le spam) :
 *   - 'error' → toast + log console.error
 *   - 'warn'  → toast + log console.warn
 *   - 'info'  → toast seul, pas de log console
 *   - Les erreurs de dev internes (aliment introuvable, etc.) restent console-only
 *
 * IMPORTANT : N'auto-instancie PAS. Accessible via window.Notify.
 */

const Notify = (() => {

  // ─── Palette (tokens CSS de l'app) ───────────────────────────────────
  const COLORS = {
    info:    { bg: 'var(--accent, #6ee7ff)',  text: '#0b1220' },
    warn:    { bg: 'var(--warn,  #fbbf24)',   text: '#0b1220' },
    error:   { bg: 'var(--bad,   #fb7185)',   text: 'white'   },
    success: { bg: 'var(--good,  #34d399)',   text: '#0b1220' },
  };

  // ─── Durées par défaut (ms) ───────────────────────────────────────────
  const DURATION = { info: 1800, warn: 3000, error: 4000, success: 1800 };

  // ─── Helpers internes ─────────────────────────────────────────────────

  function _color(level) {
    return COLORS[level] || COLORS.info;
  }

  function _log(message, level) {
    if (level === 'error') console.error(`❌ ${message}`);
    else if (level === 'warn') console.warn(`⚠️ ${message}`);
    // info/success → pas de log console (pas de bruit inutile)
  }

  // ─── Toast (coin haut-droit, auto-disparaît) ──────────────────────────

  /**
   * Affiche un toast dans le coin haut-droit.
   *
   * @param {string} message
   * @param {'info'|'warn'|'error'|'success'} [level='info']
   * @param {number} [duration] — durée en ms (défaut selon niveau)
   */
  function toast(message, level = 'info', duration) {
    _log(message, level);

    const c = _color(level);
    const ms = duration ?? DURATION[level] ?? 2000;

    const el = document.createElement('div');
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'polite');
    el.style.cssText = [
      'position:fixed',
      'top:20px',
      'right:20px',
      `background:${c.bg}`,
      `color:${c.text}`,
      'padding:12px 20px',
      'border-radius:12px',
      'font-weight:800',
      'font-size:14px',
      'z-index:10100',
      'opacity:0',
      'transform:translateY(-8px)',
      'transition:opacity 0.25s ease, transform 0.25s ease',
      'max-width:320px',
      'box-shadow:0 8px 32px rgba(0,0,0,0.35)',
      'pointer-events:none',
    ].join(';');
    el.textContent = message;
    document.body.appendChild(el);

    // Entrée
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    // Sortie
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => el.remove(), 280);
    }, ms);
  }

  // ─── Center (notification centrée, pour actions rapides) ──────────────

  /**
   * Affiche une notification centrée (milieu d'écran), auto-disparaît.
   * Utilisée pour : "✅ ajouté", "🗑️ supprimé", etc.
   *
   * @param {string} message
   * @param {'info'|'warn'|'error'|'success'} [level='info']
   * @param {number} [duration]
   */
  function center(message, level = 'info', duration) {
    _log(message, level);

    const c = _color(level);
    const ms = duration ?? DURATION[level] ?? 1800;

    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%) scale(1)',
      `background:${c.bg}`,
      `color:${c.text}`,
      'padding:20px 32px',
      'border-radius:16px',
      'font-weight:900',
      'font-size:16px',
      'z-index:10102',
      'box-shadow:0 20px 60px rgba(0,0,0,0.30)',
      'transition:opacity 0.28s ease, transform 0.28s ease',
      'pointer-events:none',
      'text-align:center',
    ].join(';');
    el.textContent = message;
    document.body.appendChild(el);

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%,-50%) scale(0.9)';
      setTimeout(() => el.remove(), 300);
    }, ms);
  }

  // ─── Banner (persistante, erreurs bloquantes) ─────────────────────────

  /**
   * Affiche une bannière persistante dans le DOM.
   * Utilisée pour les erreurs bloquantes (DB fail, quota saturé).
   *
   * @param {string} message
   * @param {'info'|'warn'|'error'} [level='error']
   * @param {object} [opts]
   * @param {string}   [opts.id]              — ID unique pour éviter les doublons
   * @param {string}   [opts.targetSelector]  — Sélecteur CSS du container cible
   * @param {string}   [opts.detail]          — Détail technique (ex: URL 404)
   * @param {string}   [opts.actionLabel]     — Texte du bouton action
   * @param {Function} [opts.onAction]        — Callback bouton (défaut: location.reload)
   */
  function banner(message, level = 'error', opts = {}) {
    _log(message, level);

    const id = opts.id || `notify-banner-${Date.now()}`;

    // Éviter les doublons sur un même id
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const c = _color(level);
    const icon = level === 'error' ? '⚠️' : level === 'warn' ? '⚠️' : 'ℹ️';
    const actionLabel = opts.actionLabel ?? '🔄 Recharger';
    const onAction    = opts.onAction    ?? (() => location.reload());

    const el = document.createElement('div');
    el.id = id;
    el.setAttribute('role', 'alert');
    el.style.cssText = [
      'margin:12px',
      'padding:16px',
      'border-radius:14px',
      `border:1px solid ${c.bg.replace('var(--bad', 'rgba(251,113,133,0.45').replace('var(--warn', 'rgba(251,191,36,0.45').replace('var(--accent', 'rgba(110,231,255,0.45')}`,
      `background:${c.bg.replace('var(--bad', 'rgba(251,113,133,0.12').replace('var(--warn', 'rgba(251,191,36,0.10').replace('var(--accent', 'rgba(110,231,255,0.10')}`,
      'color:rgba(255,255,255,0.90)',
      'font-size:14px',
      'font-weight:800',
      'line-height:1.5',
    ].join(';');

    el.innerHTML = `
      <div style="font-size:18px;margin-bottom:6px">${icon} ${message}</div>
      ${opts.detail ? `<div style="font-size:12px;color:rgba(255,255,255,0.45);margin-bottom:10px;font-weight:500;font-family:monospace">${opts.detail}</div>` : ''}
      <button
        style="
          padding:8px 18px;
          background:rgba(110,231,255,0.15);
          border:1px solid rgba(110,231,255,0.50);
          color:#6ee7ff;
          border-radius:50px;
          font-weight:900;
          font-size:13px;
          cursor:pointer
        "
      >${actionLabel}</button>
    `;

    el.querySelector('button').addEventListener('click', onAction);

    // Injection dans le container cible ou body
    const target = (opts.targetSelector && document.querySelector(opts.targetSelector))
                || document.getElementById('foodSearchPanel')
                || document.body;
    target.prepend(el);

    return id; // Retourne l'ID pour dismiss() ultérieur
  }

  // ─── Dismiss ─────────────────────────────────────────────────────────

  /**
   * Ferme une bannière par son ID.
   * @param {string} id
   */
  function dismiss(id) {
    document.getElementById(id)?.remove();
  }

  // ─── Confirm (modale) ─────────────────────────────────────────────────

  /**
   * Modale de confirmation (remplace window.confirm et les alert).
   *
   * @param {string}   title
   * @param {string}   message
   * @param {Function} onConfirm
   * @param {'warn'|'error'} [level='warn']
   */
  function confirm(title, message, onConfirm, level = 'warn') {
    const c = _color(level);
    const icon = level === 'error' ? '🗑️' : '⚠️';

    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(0,0,0,0.55)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'z-index:10200',
      'backdrop-filter:blur(4px)',
    ].join(';');

    const modal = document.createElement('div');
    modal.style.cssText = [
      `background:${c.bg}`,
      `color:${c.text}`,
      'padding:28px',
      'border-radius:20px',
      'max-width:380px',
      'width:90%',
      'text-align:center',
      'box-shadow:0 24px 64px rgba(0,0,0,0.45)',
    ].join(';');

    modal.innerHTML = `
      <div style="font-size:44px;margin-bottom:12px">${icon}</div>
      <h3 style="margin:0 0 8px;font-size:18px;font-weight:900">${title}</h3>
      <p style="margin:0 0 22px;opacity:0.88;font-size:14px;font-weight:500">${message}</p>
      <div style="display:flex;gap:12px;justify-content:center">
        <button data-action="confirm" style="flex:1;padding:12px 20px;background:rgba(255,255,255,0.95);color:#0b1220;border:none;border-radius:12px;font-weight:900;cursor:pointer;font-size:14px">Confirmer</button>
        <button data-action="cancel"  style="flex:1;padding:12px 20px;background:rgba(0,0,0,0.20);color:white; border:none;border-radius:12px;font-weight:900;cursor:pointer;font-size:14px">Annuler</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => { close(); onConfirm(); });
    modal.querySelector('[data-action="cancel"]').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
    });
  }

  // ─── Exposition ───────────────────────────────────────────────────────
  return { toast, center, banner, confirm, dismiss };

})();

window.Notify = Notify;
console.log('✅ Notify chargé (v1.0)');
