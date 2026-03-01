#!/usr/bin/env node
/**
 * qa-full.js — Validation complète de aliments-index.json
 * ────────────────────────────────────────────────────────
 * Remplace et étend qa-alias-check.js (collisions alias incluses).
 *
 * Usage : node qa-full.js [chemin-vers-aliments-index.json]
 *
 * Checks effectués :
 *   STRUCTURE  — version, categories, champs obligatoires
 *   IDS        — unicité des ids dans toute la base
 *   TYPES      — types JS corrects pour chaque champ
 *   BORNES     — glucides [0–100], ig [0–100] ou null, portion.quantite > 0
 *   UNITÉS     — portion.unite ∈ { 'g', 'ml' }
 *   NOMS       — nom non vide, description portion non vide
 *   SYNONYMES  — liste de strings, pas de doublons intra-aliment
 *   ALIAS      — collisions (erreur si alias = id dédié, avertissement si générique)
 *   IG NULL    — ig=null réservé aux aliments non-glucidiques (glucides ≤ 1)
 *
 * Exit codes :
 *   0 — aucune erreur bloquante
 *   1 — au moins une erreur bloquante (ERREUR)
 */

'use strict';
const fs   = require('fs');
const path = require('path');

// ─── Normalisation (miroir exact de FoodDatabase.normalize) ───────────────────
function normalize(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// ─── Chargement ───────────────────────────────────────────────────────────────
const jsonPath = process.argv[2]
  || path.join(__dirname, 'aliments-index.json');

let data;
try {
  data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
} catch (e) {
  console.error(`❌ Impossible de lire ${jsonPath} : ${e.message}`);
  process.exit(1);
}

// ─── Collecteurs ──────────────────────────────────────────────────────────────
const errors   = []; // bloquants — exit 1
const warnings = []; // informatifs — exit 0

function err(msg)  { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

// ─── CHECK 1 : Structure racine ───────────────────────────────────────────────
if (!data.version)    err('Champ "version" manquant à la racine');
if (!data.date)       warn('Champ "date" manquant à la racine');
if (!Array.isArray(data.categories) || data.categories.length === 0)
  err('Champ "categories" manquant ou vide');

// ─── Collecte de tous les aliments ────────────────────────────────────────────
const allAliments = []; // { aliment, catNom, catId }

for (const cat of (data.categories || [])) {
  if (!cat.id)  err(`Catégorie sans "id" : ${JSON.stringify(cat.nom)}`);
  if (!cat.nom) err(`Catégorie sans "nom" : id=${cat.id}`);
  if (!Array.isArray(cat.aliments))
    err(`Catégorie "${cat.id}" : "aliments" n'est pas un tableau`);
  for (const a of (cat.aliments || [])) {
    allAliments.push({ a, catId: cat.id, catNom: cat.nom });
  }
}

const total = allAliments.length;

// ─── CHECK 2 : IDs uniques ────────────────────────────────────────────────────
const idCount = {};
for (const { a } of allAliments) {
  if (!a.id) { err(`Aliment sans "id" : nom="${a.nom}"`); continue; }
  idCount[a.id] = (idCount[a.id] || 0) + 1;
}
for (const [id, count] of Object.entries(idCount)) {
  if (count > 1) err(`ID dupliqué "${id}" (${count} occurrences)`);
}
const allIds = new Set(Object.keys(idCount));

// ─── CHECK 3 : Champs obligatoires + types ────────────────────────────────────
for (const { a, catNom } of allAliments) {
  const id = a.id || '(sans id)';
  const ctx = `[${id}] "${a.nom}" (${catNom})`;

  // nom
  if (typeof a.nom !== 'string' || !a.nom.trim())
    err(`${ctx} : "nom" vide ou invalide`);

  // synonymes
  if (!Array.isArray(a.synonymes))
    err(`${ctx} : "synonymes" doit être un tableau (reçu ${typeof a.synonymes})`);
  else {
    // doublons intra-aliment
    const synNorms = a.synonymes.map(normalize);
    const uniq = new Set(synNorms);
    if (uniq.size < synNorms.length)
      warn(`${ctx} : synonymes contient des doublons`);
    // chaque synonyme doit être une string
    for (const s of a.synonymes) {
      if (typeof s !== 'string')
        err(`${ctx} : synonyme non-string : ${JSON.stringify(s)}`);
    }
  }

  // glucides — nombre fini, borné [0, 100]
  if (typeof a.glucides !== 'number' || !Number.isFinite(a.glucides))
    err(`${ctx} : "glucides" doit être un nombre (reçu ${typeof a.glucides} = ${a.glucides})`);
  else {
    if (a.glucides < 0)   err(`${ctx} : glucides négatif (${a.glucides})`);
    if (a.glucides > 100) err(`${ctx} : glucides > 100g/100g — vraisemblable ? (${a.glucides})`);
  }

  // ig — null ou nombre fini [0, 100]
  if (a.ig !== null && a.ig !== undefined) {
    if (typeof a.ig !== 'number' || !Number.isFinite(a.ig))
      err(`${ctx} : "ig" doit être un nombre ou null (reçu ${typeof a.ig} = ${a.ig})`);
    else {
      if (a.ig < 0)   err(`${ctx} : ig négatif (${a.ig})`);
      if (a.ig > 100) err(`${ctx} : ig > 100 — impossible (${a.ig})`);
    }
  }

  // ig=null réservé aux aliments avec glucides ≤ 1
  if (a.ig === null && typeof a.glucides === 'number' && a.glucides > 1)
    warn(`${ctx} : ig=null mais glucides=${a.glucides} > 1 — ig mesurable attendu ?`);

  // ig=0 résiduel — devrait être null pour les non-glucidiques
  if (a.ig === 0 && typeof a.glucides === 'number' && a.glucides === 0)
    warn(`${ctx} : ig=0 avec glucides=0 — préférer ig=null (Issue 6)`);

  // portion_usuelle
  const p = a.portion_usuelle;
  if (!p || typeof p !== 'object') {
    err(`${ctx} : "portion_usuelle" manquant ou invalide`);
  } else {
    // quantite > 0
    if (typeof p.quantite !== 'number' || !Number.isFinite(p.quantite) || p.quantite <= 0)
      err(`${ctx} : portion_usuelle.quantite doit être > 0 (reçu ${p.quantite})`);

    // unite ∈ { 'g', 'ml' }
    if (!['g', 'ml'].includes(p.unite))
      err(`${ctx} : portion_usuelle.unite invalide "${p.unite}" — attendu 'g' ou 'ml'`);

    // description non vide
    if (typeof p.description !== 'string' || !p.description.trim())
      warn(`${ctx} : portion_usuelle.description vide ou manquante`);
  }
}

// ─── CHECK 4 : Collisions alias (logique de qa-alias-check.js intégrée) ───────
const aliasMap  = new Map(); // normalisé(alias) → [{ id, nom, catNom, source }]
const normNames = new Map(); // normalisé(nom) → id

for (const { a, catNom } of allAliments) {
  normNames.set(normalize(a.nom), a.id);

  const register = (alias, source) => {
    const key = normalize(alias);
    if (!aliasMap.has(key)) aliasMap.set(key, []);
    aliasMap.get(key).push({ id: a.id, nom: a.nom, catNom, source });
  };

  register(a.nom, 'nom');
  for (const syn of (a.synonymes || [])) register(syn, 'synonyme');
}

for (const [alias, entries] of aliasMap) {
  if (entries.length <= 1) continue;

  const isDedicatedId   = allIds.has(alias);
  const isDedicatedName = normNames.has(alias);
  const usedAsSynonymBy = entries.filter(e => normalize(e.nom) !== alias);

  if ((isDedicatedId || isDedicatedName) && usedAsSynonymBy.length > 0) {
    const dedicatedEntry = entries.find(e => normalize(e.nom) === alias || e.id === alias);
    err(
      `Alias "${alias}" est un id/nom dédié dans la base` +
      (dedicatedEntry ? ` ([${dedicatedEntry.id}])` : '') +
      ` mais utilisé comme synonyme par : ` +
      usedAsSynonymBy.map(e => `[${e.id}]`).join(', ')
    );
  } else {
    warn(
      `Alias générique "${alias}" → ${entries.length} aliments : ` +
      entries.map(e => `[${e.id}]`).join(', ') +
      ` (intentionnel ?)`
    );
  }
}

// ─── RAPPORT ──────────────────────────────────────────────────────────────────
const sep  = '─'.repeat(62);
const sep2 = '═'.repeat(62);

console.log(`\n${sep2}`);
console.log(`  🔬 QA Full — AC Bolus aliments-index.json`);
console.log(`  ${total} aliments · v${data.version || '?'} · ${path.basename(jsonPath)}`);
console.log(`${sep2}\n`);

if (errors.length > 0) {
  console.log(`❌  ERREURS BLOQUANTES (${errors.length}) :\n`);
  errors.forEach((e, i) => console.log(`  ${String(i+1).padStart(2)}. ⛔ ${e}`));
  console.log();
}

if (warnings.length > 0) {
  console.log(`⚠️   AVERTISSEMENTS (${warnings.length}) :\n`);
  warnings.forEach((w, i) => console.log(`  ${String(i+1).padStart(2)}. 🔶 ${w}`));
  console.log();
}

console.log(sep);
if (errors.length === 0 && warnings.length === 0) {
  console.log(`  ✅ Base propre — aucun problème détecté`);
} else {
  console.log(
    `  Résultat : ${errors.length} erreur(s) bloquante(s) · ` +
    `${warnings.length} avertissement(s)`
  );
}
console.log(`${sep}\n`);

process.exit(errors.length > 0 ? 1 : 0);
