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
- **Stockage** : LocalStorage (ratios, préférences)
- **Base de données** : JSON statique (78 aliments)
- **Aucune dépendance externe** : Pas de framework, pas de build step

---

## 📁 STRUCTURE DU PROJET

### Fichiers principaux (production)
```
📦 AC Bolus/
├── 🎯 calculateur-bolus-final.html    # Application principale (51KB)
├── 🗄️ aliments-index.json             # Base de données (78 aliments, 26KB)
├── 🧠 food-database.js                # Module recherche (6.7KB)
├── 🎨 food-search-ui.js               # Module interface (11KB)
├── 🔧 bolus-optimizer.js              # Module optimisation (9KB)
├── 🖼️ favicon-96.png                  # Logo AC BOLUS (5.7KB)
├── 📱 manifest.json                   # Configuration PWA
└── 🎨 icon-*.png                      # Icônes PWA (8 fichiers)
```

### Fichiers de test
```
📁 tests/
├── test-food-database.html            # Test module DB
├── test-bolus-optimizer.html          # Test module optimisation
├── test-search.html                   # Test recherche
├── test-minimal.html                  # Test minimal
└── test-all-in-one.html               # Test intégration
```

### Documentation
```
📁 docs/
├── README.md                          # Documentation principale
├── GUIDE-TEST-COMPLET.md             # Tests détaillés (11 tests)
├── TEST-RAPIDE.md                    # Test rapide (5 min)
├── INTEGRATION-ETAPE3.md             # Doc technique
├── VERSION-2_0-PROPRE.md             # Notes version
└── AMELIORATIONS-V1_1.md             # Changelog
```

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
# Tests manuels (navigateur)
1. Ouvrir calculateur-bolus-final.html
2. F12 → Console
3. Vérifier : "✅ 78 aliments chargés"

# Tests modules individuels
1. Ouvrir test-food-database.html
2. Vérifier console pour résultats
```

### Déploiement
```bash
# PWA : Copier tous les fichiers sur serveur HTTPS
scp calculateur-bolus-final.html user@server:/var/www/
scp *.js user@server:/var/www/
scp aliments-index.json user@server:/var/www/
scp favicon-96.png user@server:/var/www/
scp manifest.json user@server:/var/www/
scp icon-*.png user@server:/var/www/
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

// Export global
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

### Aliments (JSON)
```json
{
  "version": "2.0",
  "date": "2026-02-15",
  "categories": [
    {
      "id": "pain_cereales",
      "nom": "Pain & Céréales",
      "icon": "🍞",
      "aliments": [
        {
          "id": "pain_blanc",
          "nom": "Pain blanc",
          "synonymes": ["baguette", "pain"],
          "glucides": 55,
          "ig": 70,
          "cg": 38.5,
          "portion_usuelle": {
            "quantite": 50,
            "unite": "g",
            "description": "2 tranches"
          }
        }
      ]
    }
  ]
}
```

### LocalStorage
```javascript
// Clés utilisées
'bc_theme_v1'      // Thème (clair/sombre)
'bc_simple_v1'     // Mode simple (true/false)
'bc_ratios_v1'     // Ratios insuline (JSON)

// Structure ratios
{
  basale: 25,
  rapide: 15,
  objectif: 110,
  timestamp: 1708012345678
}
```

---

## 🧮 FORMULES ET ALGORITHMES

### Calcul de bolus standard
```javascript
// Correction
const correction = (glycemie - objectif) / FSI;

// Repas
const repas = glucides / ICR;

// Total
const bolusTotal = correction + repas;
```

### Optimisation IG/CG
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
│  - Logique métier (JS inline)   │
└─────────────────────────────────┘
         ↓ imports
┌─────────────────────────────────┐
│    Modules JavaScript (ES6)     │
├─────────────────────────────────┤
│  • FoodDatabase                 │
│  • BolusOptimizer               │
│  • FoodSearchUI                 │
└─────────────────────────────────┘
         ↓ loads
┌─────────────────────────────────┐
│     aliments-index.json         │
│     (Base de données)           │
└─────────────────────────────────┘
```

### Pattern Observer
```javascript
// Les modules communiquent via événements personnalisés
window.addEventListener('mealValidated', (e) => {
  const { glucides, igMoyen, cgTotale } = e.detail;
  updateBolusCalculation(glucides, igMoyen, cgTotale);
});
```

### Pattern Module
```javascript
// Chaque module est une classe exportée globalement
// Pas d'ES modules pour compatibilité maximale
window.FoodDatabase = FoodDatabase;
```

---

## 🧪 TESTING

### Tests manuels (Guide)
```bash
# Test complet (30 min)
1. Ouvrir GUIDE-TEST-COMPLET.md
2. Suivre les 11 tests
3. Cocher chaque vérification

# Test rapide (5 min)
1. Ouvrir TEST-RAPIDE.md
2. Tests essentiels uniquement
```

### QA automatique (aliments-index.json)
```bash
# Script principal — valide TOUT (ids, types, bornes, unités, alias)
node qa-full.js [aliments-index.json]

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

### Politique des alias génériques acceptés
Les alias suivants retournent intentionnellement plusieurs aliments
(comportement de recherche voulu, documenté dans `aliments-index.json#qa`) :
- `"viennoiserie"` → croissant + pain au chocolat
- `"chocolat"` → chocolat noir + chocolat au lait
- `"poisson"` → saumon + thon

### Tests automatisés (futurs)
```javascript
// TODO : Ajouter Jest ou similaire pour :
// - Tests unitaires des modules
// - Tests d'intégration
// - Tests de performance (< 50ms chargement DB)
```

### Debug
```javascript
// Mode debug intégré
localStorage.setItem('debug', 'true');

// Logs détaillés dans console
console.log('🔍 Mode debug activé');
```

---

## 🔧 MAINTENANCE

### Ajouter un aliment
```json
// Dans aliments-index.json
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
// ⚠️ Champ "cg" supprimé (Issue P0) — calculé dynamiquement
// ⚠️ Lancer "node qa-full.js" après tout ajout
```

### Modifier un calcul
```javascript
// Dans bolus-optimizer.js
this.config = {
  ig_sensitivity: 0.005,  // Ajuster ici
  ig_reference: 55,
  // ...
};
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
- ✅ Tout en localStorage (local)
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
**Solution** : Vérifier console (F12), fichier présent ?

### Bolus négatif affiché
**Cause** : Glycémie < objectif avec glucides faibles
**Solution** : Normal, mais ajouter validation UI

### Sphère IG reste jaune (≥70 devrait être rouge)
**Cause** : Script de coloration automatique
**Solution** : Appeler `testColorerBlocIG()` en console

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

### v2.0 (en cours)
- [x] Mode simple/initié
- [x] Recherche aliments (78)
- [x] Optimisation IG/CG
- [x] PWA avec icônes
- [x] Coloration dynamique bloc IG
- [ ] Mode wizard repas (en cours)
- [ ] Historique repas favoris

### v2.1 (planifié)
- [ ] Plus d'aliments (150+)
- [ ] Scan code-barres
- [ ] Export données (CSV)
- [ ] Graphiques glycémie

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

### UI/UX
- ✅ Feedback visuel immédiat
- ✅ Messages clairs (emojis)
- ✅ Animations douces (0.3s)
- ✅ Couleurs distinctives (vert/jaune/rouge)
- ✅ Interface adaptée ados

### Architecture
- ✅ Séparation des concerns (modules)
- ✅ Single file pour simplicité
- ✅ Pas de build step
- ✅ Tout en local (offline-ready)

---

## 🤖 INSTRUCTIONS POUR CLAUDE

### Lors de modifications du code :
1. ✅ **Toujours** conserver le style existant (camelCase, français)
2. ✅ **Toujours** ajouter des commentaires explicatifs
3. ✅ **Toujours** utiliser des emojis dans les console.log
4. ✅ **Toujours** tester mentalement la compatibilité navigateur
5. ✅ **Toujours** préserver l'architecture modulaire

### Lors d'ajout de fonctionnalités :
1. ✅ Vérifier cohérence avec l'existant
2. ✅ Documenter dans un fichier MD séparé
3. ✅ Mettre à jour CLAUDE.md si nécessaire
4. ✅ Prévoir un test manuel

### Lors de corrections de bugs :
1. ✅ Identifier la cause racine
2. ✅ Proposer la solution minimale
3. ✅ Documenter le bug et la solution
4. ✅ Ajouter dans section "Bugs connus" si récurrent

---

## 📝 CHANGELOG RÉCENT

### 2026-02-23
- ✅ Ajout logo AC BOLUS (favicon-96.png)
- ✅ Coloration dynamique bloc IG (vert/jaune/rouge)
- ✅ Correction sphère IG après chiffre
- ✅ Configuration PWA complète (manifest.json + icônes)
- ✅ Création CLAUDE.md (ce fichier)

### 2026-02-15
- ✅ Version 2.0 avec 78 aliments
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

**Priorité absolue** : Sécurité médicale et clarté des calculs.

---

*Dernière mise à jour : 2026-02-23*
*Version CLAUDE.md : 1.0.0*
*Maintenu par : Claude (Anthropic)*
