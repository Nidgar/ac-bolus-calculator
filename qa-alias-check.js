/**
 * qa-alias-check.js — Garde-fou collisions d'alias
 * ─────────────────────────────────────────────────
 * Usage : node qa-alias-check.js [chemin-vers-aliments-index.json]
 *
 * Détecte deux types de problèmes :
 *   ERREUR  — Alias identique au nom/id d'un aliment dédié
 *             (ex: "couscous" comme synonyme de semoule alors qu'un id "couscous" existe)
 *   AVERTISSEMENT — Alias générique partagé entre plusieurs aliments
 *             (ex: "chocolat" → chocolat_noir + chocolat_lait)
 *             Ces cas sont souvent intentionnels (comportement de recherche voulu).
 *
 * Exit code : 0 = OK, 1 = au moins une ERREUR détectée
 */

const fs   = require('fs');
const path = require('path');

// ─── Normalisation (miroir de FoodDatabase.normalize) ─────────────────────────
function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// ─── Chargement ───────────────────────────────────────────────────────────────
const jsonPath = process.argv[2] || path.join(__dirname, 'aliments-index.json');

let data;
try {
  data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
} catch (e) {
  console.error(`❌ Impossible de lire ${jsonPath} : ${e.message}`);
  process.exit(1);
}

// ─── Collecte ─────────────────────────────────────────────────────────────────
// Index : normalisé(alias) → [{ id, nom, categorie, source }]
const aliasMap  = new Map();
// Index : tous les IDs et noms normalisés des aliments dédiés
const dedicatedIds   = new Set();
const dedicatedNames = new Map(); // normalisé(nom) → id

for (const cat of data.categories) {
  for (const a of cat.aliments) {
    dedicatedIds.add(a.id);
    dedicatedNames.set(normalize(a.nom), a.id);

    const register = (alias, source) => {
      const key = normalize(alias);
      if (!aliasMap.has(key)) aliasMap.set(key, []);
      aliasMap.get(key).push({ id: a.id, nom: a.nom, categorie: cat.nom, source });
    };

    register(a.nom, 'nom');
    for (const syn of (a.synonymes || [])) {
      register(syn, `synonyme`);
    }
  }
}

// ─── Détection ────────────────────────────────────────────────────────────────
const errors   = []; // BLOQUANT — alias = id/nom d'un aliment dédié chez un autre
const warnings = []; // INFO     — alias générique partagé (intentionnel possible)

for (const [alias, entries] of aliasMap) {
  if (entries.length <= 1) continue;

  // Vérifier si cet alias correspond exactement à l'id ou au nom d'un aliment dédié
  const isDedicatedId   = dedicatedIds.has(alias);
  const isDedicatedName = dedicatedNames.has(alias);

  // Trouver les entrées où l'alias est un synonyme (pas le nom propre de l'aliment)
  const usedAsSynonymBy = entries.filter(e => {
    return normalize(e.nom) !== alias; // ce n'est pas le nom propre de cet aliment
  });

  if ((isDedicatedId || isDedicatedName) && usedAsSynonymBy.length > 0) {
    // L'alias correspond à un aliment dédié ET est utilisé comme synonyme ailleurs → ERREUR
    const dedicatedEntry = entries.find(e => normalize(e.nom) === alias || e.id === alias);
    errors.push({
      alias,
      dedicated: dedicatedEntry,
      wrongUsage: usedAsSynonymBy,
      reason: isDedicatedId
        ? `"${alias}" est un id dédié dans la base`
        : `"${alias}" est le nom exact de l'aliment [${dedicatedNames.get(alias)}]`
    });
  } else {
    // Collision générique — avertissement uniquement
    warnings.push({ alias, entries });
  }
}

// ─── Rapport ──────────────────────────────────────────────────────────────────
const sep = '─'.repeat(60);
console.log(`\n${sep}`);
console.log(`  QA Alias Check — ${jsonPath}`);
console.log(`  ${data.categories.reduce((s, c) => s + c.aliments.length, 0)} aliments | ${aliasMap.size} alias uniques`);
console.log(`${sep}\n`);

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ Aucune collision détectée — base propre.\n');
  process.exit(0);
}

if (errors.length > 0) {
  console.log(`❌ ERREURS BLOQUANTES (${errors.length}) — à corriger avant déploiement :\n`);
  for (const e of errors) {
    console.log(`  ⛔ Alias "${e.alias}" — ${e.reason}`);
    if (e.dedicated) {
      console.log(`     Aliment dédié : [${e.dedicated.id}] "${e.dedicated.nom}"`);
    }
    console.log(`     Utilisé à tort comme synonyme par :`);
    for (const w of e.wrongUsage) {
      console.log(`       → [${w.id}] "${w.nom}" (${w.categorie})`);
    }
    console.log();
  }
}

if (warnings.length > 0) {
  console.log(`⚠️  AVERTISSEMENTS (${warnings.length}) — alias génériques partagés (vérifier si intentionnel) :\n`);
  for (const w of warnings) {
    console.log(`  🔶 "${w.alias}" → ${w.entries.length} aliments :`);
    for (const e of w.entries) {
      console.log(`       [${e.id}] "${e.nom}" (${e.categorie}) — via ${e.source}`);
    }
    console.log();
  }
}

console.log(sep);
console.log(`  Résultat : ${errors.length} erreur(s) | ${warnings.length} avertissement(s)`);
console.log(sep + '\n');

// Exit 1 uniquement si erreurs bloquantes
process.exit(errors.length > 0 ? 1 : 0);
