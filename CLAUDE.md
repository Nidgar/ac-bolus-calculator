# 📘 CLAUDE.md - Guide de Référence du Projet AC BOLUS

> **Guide pour Claude AI** : Ce document récapitule la structure, les conventions, et les commandes du projet "Calculateur de Bolus" pour faciliter les futures interactions.

---

## 🎯 VUE D'ENSEMBLE DU PROJET

### Nom du projet
**AC Bolus** - Calculateur de Bolus Intelligent pour Diabète Type 1

### Description
Application web standalone (HTML/CSS/JS vanilla) pour calculer les doses d'insuline en tenant compte de l'index glycémique (IG) et de la charge glycémique (CG) des aliments.

### Public cible
- Adolescents diabétiques (10 ans+)
- Interface ludique et pédagogique
- Deux modes : Simple (débutants) et Initié (avancés)

### Technologies
- **Frontend** : HTML5, CSS3, JavaScript Vanilla (ES6+)
- **Stockage** : LocalStorage via module `AppStorage` (ratios, préférences)
- **Base de données** : JSON statique (344 aliments, 12 catégories)
- **Aucune dépendance externe** : Pas de framework, pas de build step

---

## 📁 STRUCTURE DU PROJET

### Arborescence complète

```
📦 ac-bolus/
│
├── 📄 calculateur-bolus-final.html    # Application principale (~120KB)
├── 📄 manifest.json                   # Configuration PWA (reste à la racine — standard)
├── 📄 top10.html                      # Page Top aliments (easter egg 🏆)
├── 📄 403.html                        # Page erreur 403 (easter egg 🚫)
├── 📄 404.html                        # Page erreur 404 (easter egg 🔍)
├── 📄 CLAUDE.md                       # Ce fichier
│
├── 📁 assets/
│   │
│   ├── 📁 js/                         # Modules JS — ordre de chargement impératif
│   │   ├── 1️⃣  storage.js             # AppStorage v1.0 — LocalStorage unifié
│   │   ├── 2️⃣  bolusMath.js           # BolusMath v1.0 — Calculs purs (ICR/FSI)
│   │   ├── 3️⃣  units.js               # GlyUnits v1.0 — Conversion mg/dL ↔ g/L
│   │   ├── 4️⃣  notifications.js       # Notify v1.0 — Notifications centralisées
│   │   ├── 5️⃣  food-database.js       # FoodDatabase — Module recherche (~19KB)
│   │   ├── 6️⃣  bolus-optimizer.js     # BolusOptimizer — Optimisation IG/CG (~11KB)
│   │   ├── 7️⃣  food-search-ui.js      # FoodSearchUI — Module interface (~25KB)
│   │   ├── 8️⃣  simple-mode-data.js    # SimpleModeDataBuilder v3.7 — Données wizard
│   │   ├── 9️⃣  simple-mode-wizard.js  # SimpleModeWizard v2.1 — Logique wizard
│   │   └── 🔟  app.js                 # Bootstrap unique v1.3.0 (toujours en dernier)
│   │
│   ├── 📁 data/                       # Données statiques
│   │   └── 📄 aliments-index.json     # Base de données (344 aliments, v3.4)
│   │
│   └── 📁 img/                        # Icônes & favicons PWA
│       ├── 🖼️ favicon-32.png
│       ├── 🖼️ favicon-48.png
│       ├── 🖼️ favicon-96.png          # Logo affiché dans le header
│       ├── 🖼️ icon-192.png
│       ├── 🖼️ icon-192-maskable.png
│       ├── 🖼️ icon-512.png
│       └── 🖼️ icon-512-maskable.png
│
└── 📁 tests/                          # Tests & QA
    ├── 🧪 test-runner.html            # Lanceur de tests (navigateur)
    ├── 🧪 tests.js                    # Suite de tests unitaires
    ├── 🧪 tests-cas-cliniques.js      # Tests cas cliniques
    ├── ✅ qa-full.js                  # QA complet aliments-index.json
    └── ✅ qa-alias-check.js           # Vérification collisions d'alias
```

> ⚠️ **Ordre de chargement impératif** : Les modules sont chargés dans l'ordre 1→10 en bas du `<body>`. `app.js` doit toujours être en dernier — c'est lui qui orchestre l'initialisation de tous les modules.

### Règles de chemins

| Depuis | Vers les JS | Vers les données | Vers les images |
|---|---|---|---|
| `calculateur-bolus-final.html` | `assets/js/module.js` | `assets/data/aliments-index.json` | `assets/img/favicon-96.png` |
| `top10.html` | — | `assets/data/aliments-index.json` | — |
| `403.html` / `404.html` | — | — | `assets/img/favicon-32.png` |
| `tests/test-runner.html` | `../assets/js/module.js` | — | — |
| `tests/qa-full.js` (Node) | — | `../assets/data/aliments-index.json` | — |

> ℹ️ `manifest.json` reste à la racine — obligation du standard PWA (les navigateurs le cherchent au même niveau que le HTML principal).

---

## 🚀 COMMANDES ET WORKFLOW

### Démarrage (pas de build)
```bash
# Aucune commande de build nécessaire
# Double-cliquer sur calculateur-bolus-final.html
# OU
python -m http.server 8000  # Serveur local pour tests
```

### Tests
```bash
# Tests navigateur
1. Ouvrir test-runner.html
2. F12 → Console
3. Vérifier les résultats de la suite tests.js

# Vérification chargement DB
1. Ouvrir calculateur-bolus-final.html
2. F12 → Console
3. Vérifier : "✅ 344 aliments chargés"
```

### QA base de données
```bash
# Depuis le dossier tests/ (chemin par défaut automatique)
node tests/qa-full.js
node tests/qa-alias-check.js

# Ou avec chemin explicite depuis la racine du projet
node tests/qa-full.js assets/data/aliments-index.json

# Checks effectués :
#   ✅ IDs uniques dans toute la base
#   ✅ Champs obligatoires (id, nom, glucides, ig, portion_usuelle)
#   ✅ Types JS corrects pour chaque champ
#   ✅ glucides borné [0–100], ig [0–100] ou null
#   ✅ portion.unite ∈ { 'g', 'ml' }
#   ✅ portion.quantite > 0
#   ✅ ig=null réservé aux aliments non-glucidiques (glucides ≤ 1)
#   ✅ Collisions alias (ERREUR si alias = id dédié, ⚠️ si générique)

# Exit codes :
#   0 → base propre (prête au déploiement)
#   1 → erreur(s) bloquante(s) à corriger

# À lancer OBLIGATOIREMENT :
#   - avant tout déploiement
#   - après ajout ou modification d'un aliment
#   - après fusion de branches (futur CI)
```

### Déploiement
```bash
# PWA : Copier toute l'arborescence sur serveur HTTPS
# Structure obligatoire à respecter sur le serveur :
scp calculateur-bolus-final.html  user@server:/var/www/acbolus/
scp manifest.json                 user@server:/var/www/acbolus/
scp top10.html 403.html 404.html  user@server:/var/www/acbolus/
scp -r assets/                    user@server:/var/www/acbolus/
# NB : ne pas copier le dossier tests/ en production
```

---

## 🎨 CONVENTIONS DE CODE

### Style CSS

#### Variables CSS (thème)
```css
:root {
  --bg: #0b1220;           /* Background sombre */
  --panel: rgba(255,255,255,0.06);  /* Panneaux transparents */
  --text: rgba(255,255,255,0.92);   /* Texte principal */
  --accent: #6ee7ff;       /* Accent cyan */
  --good: #34d399;         /* Vert (succès) */
  --warn: #fbbf24;         /* Jaune (warning) */
  --bad: #fb7185;          /* Rouge (erreur) */
}
```

#### Naming classes
- **BEM-like** : `.blockName`, `.blockName__element`, `.blockName--modifier`
- **Camel case** pour multi-mots : `.myPlate`, `.recapRepas`
- **Kebab case** pour composants : `.food-item`, `.search-results`

#### Structure
```css
/* Ordre des propriétés :
   1. Positionnement (display, position, top, left)
   2. Box model (width, height, margin, padding)
   3. Typographie (font, color, text)
   4. Visuel (background, border, shadow)
   5. Autres (transform, transition)
*/
```

### Style JavaScript

#### Naming conventions
```javascript
// Classes : PascalCase
class FoodDatabase { }
class BolusOptimizer { }
class SimpleModeWizard { }

// Fonctions : camelCase
function calculateBolus() { }
function searchAliments() { }

// Constantes : UPPER_SNAKE_CASE
const MAX_RESULTS = 10;
const IG_THRESHOLD = 70;

// Variables : camelCase
let bolusTotal = 0;
let igMoyen = 55;
```

#### Structure des modules
```javascript
/**
 * Module description
 * @version X.X
 */
class ModuleName {
  constructor() {
    // Initialisation
  }

  /**
   * Method description
   * @param {type} param - Description
   * @returns {type} - Description
   */
  methodName(param) {
    // Implementation
  }
}

// Export global (pas d'ES modules pour compatibilité maximale)
if (typeof window !== 'undefined') {
  window.ModuleName = ModuleName;
}
```

#### Gestion des erreurs
```javascript
// ✅ Toujours avec try-catch pour async
async load(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // ...
  } catch (error) {
    console.error('❌ Erreur:', error);
    return false;
  }
}

// ✅ Console avec emojis pour clarté
console.log('✅ Succès');
console.warn('⚠️ Attention');
console.error('❌ Erreur');
```

#### Commentaires
```javascript
// Commentaires en français
// Style JSDoc pour fonctions publiques

/**
 * Calcule le bolus optimisé selon IG/CG
 * @param {Object} options - Paramètres du calcul
 * @param {number} options.bolus_standard - Bolus de base
 * @param {number} options.ig_moyen - IG moyen du repas
 * @returns {Object} Résultat avec bolus ajusté
 */
```

---

## 🗄️ STRUCTURE DES DONNÉES

### Base aliments (aliments-index.json v3.4)

**12 catégories, 344 aliments :**

| Catégorie            | ID                   | Aliments |
|----------------------|----------------------|----------|
| Pain & Céréales      | pain_cereales        | 30       |
| Féculents            | feculents            | 32       |
| Légumineuses         | legumineuses         | 13       |
| Fruits               | fruits               | 23       |
| Légumes              | legumes              | 29       |
| Protéines            | proteines            | 41       |
| Produits laitiers    | produits_laitiers    | 33       |
| Desserts & sucreries | desserts_sucreries   | 51       |
| Boissons             | boissons             | 27       |
| Plats préparés       | plats_prepares       | 26       |
| Sauces & condiments  | sauces_condiments    | 18       |
| Entrées froides      | entrees_froides      | 21       |

**Structure d'un aliment :**
```json
{
  "id": "pain_blanc",
  "nom": "Pain blanc",
  "synonymes": ["baguette", "pain"],
  "glucides": 55,
  "ig": 70,
  "portion_usuelle": {
    "quantite": 50,
    "unite": "g",
    "description": "2 tranches"
  }
}
```

> ⚠️ **Champ `cg` supprimé** (Issue P0 résolue) — la charge glycémique est calculée dynamiquement.

### LocalStorage via AppStorage
```javascript
// Clés utilisées
'bc_theme_v1'      // Thème (clair/sombre)
'bc_simple_v1'     // Mode simple (true/false)
'bc_ratios_v1'     // Ratios insuline (JSON)
'bc_unit_v1'       // Unité glycémie (mg/dL ou g/L)

// Structure ratios
{
  basale: 25,
  rapide: 15,
  objectif: 110,
  timestamp: 1708012345678
}

// API AppStorage (module storage.js)
AppStorage.get(key, { maxAge?, schemaVersion? })   // → valeur | null
AppStorage.set(key, value, { ttl?, schemaVersion? }) // → true | false
AppStorage.clear(key)                               // → void
```

---

## 🧮 FORMULES ET ALGORITHMES

### Calcul de bolus (BolusMath v1.0)
```javascript
// Règle des 500/1800 (méthode DiabetesNet / Walsh)
const DTQ  = basale + rapide;
const ICR  = 500  / DTQ;   // g de glucides couverts par 1 U
const FSI  = 1800 / DTQ;   // mg/dL abaissés par 1 U

// Correction
const correction = (glycemie - objectif) / FSI;

// Repas
const repas = glucides / ICR;

// Total
const bolusTotal = correction + repas;

// ⚠️ Sécurité : BolusMath retourne NaN (pas 0) en cas d'entrée invalide
```

### Optimisation IG/CG (BolusOptimizer)
```javascript
// Facteur IG : 1 + ((IG - 55) × 0.005)
const facteurIG = 1 + ((igMoyen - 55) * 0.005);

// Facteur CG
let facteurCG = 1.0;
if (cgTotale < 10) facteurCG = 0.95;      // -5%
else if (cgTotale >= 20) facteurCG = 1.05; // +5%

// Bolus optimisé
const bolusOptimise = bolusStandard * facteurIG * facteurCG;
```

### Algorithme de recherche
```javascript
/**
 * Scoring :
 * - Match exact : 100
 * - Début du nom : 90
 * - Début d'un mot : 80
 * - Synonyme exact : 70
 * - Contient dans nom : 60
 * - Contient dans synonyme : 50
 * - Catégorie : 40
 */
```

### Conversion unités glycémie (GlyUnits v1.0)
```javascript
// L'app fonctionne en mg/dL nativement
// 1 g/L   = 100 mg/dL
// 1 mmol/L = 18.016 mg/dL (glucose, M = 180.16 g/mol)
GlyUnits.toMgdl(value, unit)   // → number en mg/dL
GlyUnits.fromMgdl(value, unit) // → number dans l'unité cible
GlyUnits.parse(str)            // → number (accepte virgule et point)
GlyUnits.format(value, unit)   // → string formaté
```

---

## 🎨 DESIGN PATTERNS

### Architecture générale
```
┌─────────────────────────────────┐
│   calculateur-bolus-final.html  │
│   (Application principale)      │
├─────────────────────────────────┤
│  - Interface utilisateur (HTML) │
│  - Styles (CSS inline)          │
│  - Logique métier (inline)      │
└─────────────────────────────────┘
         ↓ imports (ordre 1→10)
┌─────────────────────────────────┐
│    Modules JavaScript (ES6)     │
├─────────────────────────────────┤
│  • AppStorage   (stockage)      │
│  • BolusMath    (calculs)       │
│  • GlyUnits     (unités)        │
│  • Notify       (notifications) │
│  • FoodDatabase (base aliments) │
│  • BolusOptimizer (IG/CG)       │
│  • FoodSearchUI (interface)     │
│  • SimpleModeDataBuilder        │
│  • SimpleModeWizard             │
│  • app.js       (bootstrap)     │
└─────────────────────────────────┘
         ↓ loads
┌─────────────────────────────────┐
│     aliments-index.json         │
│  (344 aliments, 12 catégories)  │
└─────────────────────────────────┘
```

### Bootstrap unique (app.js v1.3.0)
```javascript
// Garde-fou anti-double initialisation
if (window.__acBolusBooted) return;
window.__acBolusBooted = true;

// Ordre d'init :
// 1. FoodDatabase.load()           → fetch aliments-index.json
// 2. SimpleModeDataBuilder.build() → peuple SimpleModeData depuis la BDD
// 3. SimpleModeWizard.init()       → wizard initialisé après build()
// 4. FoodSearchUI.init()           → init indépendante (async interne)
```

### Pattern Observer
```javascript
// Les modules communiquent via événements personnalisés
window.addEventListener('mealValidated', (e) => {
  const { glucides, igMoyen, cgTotale } = e.detail;
  updateBolusCalculation(glucides, igMoyen, cgTotale);
});
```

### Politique des alias génériques acceptés
Les alias suivants retournent intentionnellement plusieurs aliments
(comportement de recherche voulu, documenté dans `aliments-index.json#qa`) :
- `"viennoiserie"` → croissant + pain au chocolat
- `"chocolat"` → chocolat noir + chocolat au lait
- `"poisson"` → saumon + thon

---

## 🧪 TESTING

### Suite de tests (tests.js + test-runner.html)
```bash
# Ouvrir test-runner.html dans un navigateur
# Pas de serveur HTTP requis (file://)
# Les tests passent sans fetch (modules inline)
```

### QA automatique
```bash
node qa-full.js [aliments-index.json]   # Validation complète
node qa-alias-check.js                  # Vérification alias uniquement
```

### Tests manuels essentiels
```bash
# 5 minutes
1. Ouvrir calculateur-bolus-final.html
2. Console : "✅ 344 aliments chargés"
3. Rechercher "pomme" → résultats
4. Calculer un bolus (valeurs connues)
5. Vérifier mode simple/initié
```

### Debug
```javascript
// Mode debug intégré
localStorage.setItem('debug', 'true');
console.log('🔍 Mode debug activé');
```

---

## 🔧 MAINTENANCE

### Ajouter un aliment
```json
// Dans aliments-index.json — respecter la structure :
{
  "id": "nouvel_aliment",
  "nom": "Nom de l'aliment",
  "synonymes": ["alias1", "alias2"],
  "glucides": 50,
  "ig": 55,
  "portion_usuelle": {
    "quantite": 100,
    "unite": "g",
    "description": "1 portion"
  }
}
// ⚠️ Pas de champ "cg" — calculé dynamiquement
// ⚠️ ig: null uniquement si glucides ≤ 1 (aliment non glucidique)
// ⚠️ Lancer "node qa-full.js" après tout ajout
```

### Ajouter un aliment au wizard
```javascript
// Dans simple-mode-data.js → SimpleModeDataBuilder
// Mapper le nouvel id vers l'étape/sous-étape appropriée
// Exemples d'exclusions volontaires (ingrédients cuisine) :
// galette_riz, chapelure, ble_precuit → pas dans le wizard
```

### Modifier un calcul
```javascript
// Dans bolus-optimizer.js
this.config = {
  ig_sensitivity: 0.005,  // Ajuster ici
  ig_reference: 55,
  // ...
};

// ⚠️ Pour modifier ICR/FSI : éditer les constantes dans bolusMath.js
// const ICR_CONSTANT = 500;
// const FSI_CONSTANT = 1800;
```

### Changer un style
```css
/* Dans calculateur-bolus-final.html */
:root {
  --accent: #6ee7ff;  /* Modifier la couleur d'accent */
}
```

---

## 📱 PWA (Progressive Web App)

### Configuration
```json
// manifest.json
{
  "name": "AC Bolus",
  "short_name": "AC Bolus",
  "display": "standalone",
  "theme_color": "#6ee7ff",
  "background_color": "#0b1220"
}
```

### Installation
```bash
# Sur Android/iOS :
1. Ouvrir https://votre-site.com/calculateur-bolus-final.html
2. Menu navigateur → "Ajouter à l'écran d'accueil"
3. L'icône AC BOLUS apparaît
4. Ouvrir en mode plein écran
```

---

## ⚠️ POINTS D'ATTENTION

### Sécurité
- ✅ Aucune donnée envoyée sur internet
- ✅ Tout en localStorage via AppStorage (local)
- ⚠️ Avertissement médical obligatoire
- ⚠️ Ne remplace pas l'avis médical

### Performance
- ✅ Chargement DB : < 50ms
- ✅ Recherche : < 1ms
- ✅ Calcul : < 5ms
- ⚠️ Tester sur mobile (devices lents)

### Compatibilité
- ✅ Chrome/Edge (recommandé)
- ✅ Firefox
- ✅ Safari
- ❌ IE11 (non supporté)

### Accessibilité
- ✅ ARIA labels sur inputs
- ✅ Contraste élevé (WCAG AA)
- ✅ Navigation clavier
- ⚠️ Améliorer lecteurs d'écran

---

## 🐛 BUGS CONNUS ET SOLUTIONS

### Bouton "Composer mon repas" invisible
**Cause** : Mode simple activé
**Solution** : Passer en mode initié (🔭)

### Recherche ne fonctionne pas
**Cause** : aliments-index.json non chargé
**Solution** : Vérifier console (F12), fichier présent ? Chemin relatif correct ?

### Bolus négatif affiché
**Cause** : Glycémie < objectif avec glucides faibles
**Solution** : Normal mathématiquement — validation UI à améliorer (TODO)

### Sphère IG reste jaune (≥70 devrait être rouge)
**Cause** : Script de coloration automatique
**Solution** : Appeler `testColorerBlocIG()` en console

### Double initialisation des modules
**Cause** : `app.js` chargé deux fois
**Solution** : Le garde-fou `window.__acBolusBooted` bloque la deuxième exécution. Vérifier qu'`app.js` n'est inclus qu'une fois dans le HTML.

---

## 🔄 WORKFLOW GIT (futur)

### Branches
```bash
main          # Production stable
dev           # Développement
feature/*     # Nouvelles fonctionnalités
hotfix/*      # Corrections urgentes
```

### Commits
```bash
# Format : type(scope): message

feat(search): ajout recherche par catégorie
fix(bolus): correction calcul IG négatif
docs(readme): mise à jour installation
style(ui): amélioration couleurs mode clair
refactor(db): optimisation recherche
test(optimizer): ajout tests unitaires
```

---

## 📚 RESSOURCES EXTERNES

### Documentation
- Table CIQUAL 2020 (Anses)
- International Tables of Glycemic Index
- Montignac Glycemic Index
- MDN Web Docs (référence JS/CSS)

### Outils
- Chrome DevTools (debug)
- Lighthouse (performance PWA)
- WAVE (accessibilité)

---

## 🎯 ROADMAP

### v2.0 (livré)
- [x] Mode simple/initié
- [x] Recherche aliments
- [x] Optimisation IG/CG
- [x] PWA avec icônes
- [x] Coloration dynamique bloc IG

### v2.1 (en cours)
- [x] Mode wizard repas (SimpleModeWizard v2.1)
- [x] Modules refactorisés (AppStorage, BolusMath, GlyUnits, Notify)
- [x] Bootstrap unique app.js
- [x] Base aliments étendue : 344 aliments, 12 catégories
- [x] Audit complet aliments mappés dans le wizard
- [ ] Historique repas favoris

### v2.2 (planifié)
- [ ] Scan code-barres
- [ ] Export données (CSV)
- [ ] Graphiques glycémie
- [ ] Tests Jest (unitaires + intégration)

### v3.0 (futur)
- [ ] Apprentissage personnalisé
- [ ] Intégration activité physique
- [ ] Multi-langues
- [ ] Sync cloud (optionnel)

---

## 💡 BONNES PRATIQUES OBSERVÉES

### Code
- ✅ Vanilla JS (pas de dépendances)
- ✅ Commentaires en français
- ✅ JSDoc pour API publiques
- ✅ Console avec emojis
- ✅ Gestion d'erreurs complète
- ✅ Modules auto-protégés (pas d'auto-instanciation)
- ✅ Bootstrap unique centralisé (app.js)

### UI/UX
- ✅ Feedback visuel immédiat
- ✅ Messages clairs (emojis)
- ✅ Animations douces (0.3s)
- ✅ Couleurs distinctives (vert/jaune/rouge)
- ✅ Interface adaptée ados

### Architecture
- ✅ Séparation des concerns (modules)
- ✅ Single file pour simplicité (calculateur-bolus-final.html)
- ✅ Pas de build step
- ✅ Tout en local (offline-ready)
- ✅ Ordre de chargement documenté et respecté

---

## 🤖 INSTRUCTIONS POUR CLAUDE

### Lors de modifications du code :
1. ✅ **Toujours** conserver le style existant (camelCase, français)
2. ✅ **Toujours** ajouter des commentaires explicatifs
3. ✅ **Toujours** utiliser des emojis dans les console.log
4. ✅ **Toujours** tester mentalement la compatibilité navigateur
5. ✅ **Toujours** préserver l'architecture modulaire et l'ordre de chargement

### Lors d'ajout de fonctionnalités :
1. ✅ Vérifier cohérence avec l'existant
2. ✅ Mettre à jour CLAUDE.md si nécessaire
3. ✅ Prévoir un test manuel
4. ✅ Si ajout aliment : lancer `node qa-full.js` ensuite

### Lors de corrections de bugs :
1. ✅ Identifier la cause racine
2. ✅ Proposer la solution minimale
3. ✅ Documenter le bug et la solution
4. ✅ Ajouter dans section "Bugs connus" si récurrent

### Rappels critiques :
- ⚠️ Ne jamais auto-instancier les modules — `app.js` s'en charge
- ⚠️ Ne jamais toucher directement `localStorage` — passer par `AppStorage`
- ⚠️ Ne jamais mettre de champ `cg` dans aliments-index.json — calculé dynamiquement
- ⚠️ Toujours valider avec `node qa-full.js` avant déploiement

---

## 📝 CHANGELOG RÉCENT

### 2026-03-12 (aujourd'hui)
- ✅ Réorganisation complète de l'arborescence (nouvelle structure standard)
  - `assets/js/` — tous les modules JS
  - `assets/data/` — aliments-index.json
  - `assets/img/` — icônes et favicons (noms avec tirets : `favicon-96.png`, etc.)
  - `tests/` — test-runner.html, tests.js, tests-cas-cliniques.js, qa-*.js
  - Racine : HTML principaux + manifest.json + CLAUDE.md uniquement
- ✅ Correction de tous les chemins impactés (calculateur-bolus-final.html, food-database.js, top10.html, test-runner.html, qa-full.js, qa-alias-check.js, 403.html, 404.html)
- ✅ Easter eggs préservés (long press ⚙️ → tests/, swipe → index secret)
- ✅ Mise à jour CLAUDE.md v3.0.0

### 2026-03-10
- ✅ Mise à jour CLAUDE.md v2.0.0

### 2026-03-04
- ✅ aliments-index.json v3.4 — 344 aliments, 12 catégories

### 2026-03-01
- ✅ app.js v1.3.0 — Bootstrap unique, SimpleModeDataBuilder.build() après FoodDatabase.load()
- ✅ simple-mode-data.js v3.7 — Audit complet : tous les aliments BDD mappés dans le wizard
- ✅ simple-mode-data.js v3.6 — Nouvelles catégories wizard (plats_chauds, pâtisseries, légumineuses)
- ✅ simple-mode-data.js v3.5 — Intégration entrees_froides dans le wizard

### 2026-02-23
- ✅ Ajout logo AC BOLUS (favicon-96.png)
- ✅ Coloration dynamique bloc IG (vert/jaune/rouge)
- ✅ Correction sphère IG après chiffre
- ✅ Configuration PWA complète (manifest.json + icônes)
- ✅ Création CLAUDE.md v1.0.0

### 2026-02-15
- ✅ Version 2.0 initiale
- ✅ Modules search + optimizer
- ✅ Mode simple/initié
- ✅ Tests complets

---

## 🎉 NOTES FINALES

Ce projet est un **calculateur de bolus éducatif** pour adolescents diabétiques. Il privilégie :

- 🎯 **Simplicité** : Pas de framework, pas de build
- 🔒 **Sécurité** : Tout en local, pas de serveur
- 🎨 **Design** : Interface ludique et claire
- 📱 **Mobile-first** : Responsive et PWA
- 🧠 **Intelligence** : Optimisation IG/CG
- 🧩 **Modularité** : Modules indépendants, bootstrap centralisé

**Priorité absolue** : Sécurité médicale et clarté des calculs.

---

*Dernière mise à jour : 2026-03-12*
*Version CLAUDE.md : 3.0.0*
*Maintenu par : Claude (Anthropic)*
