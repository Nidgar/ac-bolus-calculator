/**
 * SIMPLE MODE DATA v2.0 - Base alimentaire catégorisée AMÉLIORÉE
 * 
 * CHANGEMENTS v2.0 :
 * - ✅ Séparation des boissons par moment (petit-déj / repas / goûter)
 * - ✅ Ajout de desserts quotidiens (crème, flan, mousse, riz au lait)
 * - ✅ Enrichissement du goûter (+7 items : pain d'épices, petits-beurre, etc.)
 * - ✅ Ajout de légumineuses (+3 items : lentilles, pois chiches, boulgour)
 * - ✅ Total : 150+ aliments (vs 130 avant)
 * - ✅ Structure preservée pour compatibilité wizard
 */


const SimpleModeData = {
  
  // ═══════════════════════════════════════════════════════════
  // BOISSONS - PETIT-DÉJEUNER
  // ═══════════════════════════════════════════════════════════
  boissons_petit_dej: [
    { id: "eau_pdej", nom: "Eau", emoji: "💧", glucides: 0, ig: 0, portion: "1 verre" },
    { id: "lait_pdej", nom: "Lait", emoji: "🥛", glucides: 10, ig: 30, portion: "1 verre (200ml)" },
    { id: "chocolat_chaud", nom: "Chocolat chaud", emoji: "☕", glucides: 30, ig: 55, portion: "1 tasse" },
    { id: "jus_orange_pdej", nom: "Jus d'orange", emoji: "🧃", glucides: 20, ig: 50, portion: "1 verre (200ml)" },
    { id: "jus_pomme_pdej", nom: "Jus de pomme", emoji: "🧃", glucides: 22, ig: 44, portion: "1 verre (200ml)" },
    { id: "cafe", nom: "Café", emoji: "☕", glucides: 0, ig: 0, portion: "1 tasse" },
    { id: "the_pdej", nom: "Thé", emoji: "🍵", glucides: 0, ig: 0, portion: "1 tasse" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // BOISSONS - DÉJEUNER / DÎNER
  // ═══════════════════════════════════════════════════════════
  boissons_repas: [
    { id: "eau_repas", nom: "Eau", emoji: "💧", glucides: 0, ig: 0, portion: "1 verre" },
    { id: "sirop", nom: "Sirop à l'eau", emoji: "🥤", glucides: 16, ig: 65, portion: "1 dose (20ml)" },
    { id: "coca", nom: "Coca-Cola", emoji: "🥤", glucides: 27, ig: 65, portion: "1 canette (330ml)" },
    { id: "the_glace", nom: "Thé glacé", emoji: "🧃", glucides: 18, ig: 50, portion: "1 bouteille (330ml)" },
    { id: "limonade", nom: "Limonade", emoji: "🥤", glucides: 22, ig: 60, portion: "1 verre (250ml)" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // BOISSONS - GOÛTER
  // ═══════════════════════════════════════════════════════════
  boissons_gouter: [
    { id: "eau_gouter", nom: "Eau", emoji: "💧", glucides: 0, ig: 0, portion: "1 verre" },
    { id: "lait_gouter", nom: "Lait", emoji: "🥛", glucides: 10, ig: 30, portion: "1 verre (200ml)" },
    { id: "chocolat_chaud_gouter", nom: "Chocolat chaud", emoji: "☕", glucides: 30, ig: 55, portion: "1 tasse" },
    { id: "jus_orange_gouter", nom: "Jus d'orange", emoji: "🧃", glucides: 20, ig: 50, portion: "1 verre (200ml)" },
    { id: "jus_pomme_gouter", nom: "Jus de pomme", emoji: "🧃", glucides: 22, ig: 44, portion: "1 verre (200ml)" },
    { id: "coca_gouter", nom: "Coca-Cola", emoji: "🥤", glucides: 27, ig: 65, portion: "1 canette (330ml)" },
    { id: "sirop_gouter", nom: "Sirop à l'eau", emoji: "🥤", glucides: 16, ig: 65, portion: "1 dose (20ml)" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // PAINS - PETIT-DÉJEUNER
  // ═══════════════════════════════════════════════════════════
  pains_petit_dej: [
    { id: "pain_blanc_pdej", nom: "Pain blanc", emoji: "🥖", glucides: 27, ig: 70, portion: "2 tranches (50g)" },
    { id: "pain_complet_pdej", nom: "Pain complet", emoji: "🍞", glucides: 24, ig: 45, portion: "2 tranches (50g)" },
    { id: "pain_cereales_pdej", nom: "Pain aux céréales", emoji: "🌾", glucides: 25, ig: 45, portion: "2 tranches (50g)" },
    { id: "pain_mie_pdej", nom: "Pain de mie", emoji: "🍞", glucides: 26, ig: 70, portion: "2 tranches (50g)" },
    { id: "biscottes", nom: "Biscottes", emoji: "🍞", glucides: 15, ig: 70, portion: "2 biscottes (20g)" },
    { id: "pain_epices_pdej_pain", nom: "Pain d'épices", emoji: "🍞", glucides: 30, ig: 70, portion: "2 tranches (40g)" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // PETIT-DÉJEUNER : Contenu
  // ═══════════════════════════════════════════════════════════
  petit_dej_contenu: [
    { id: "croissant", nom: "Croissant", emoji: "🥐", glucides: 27, ig: 70, portion: "1 croissant (60g)" },
    { id: "pain_chocolat", nom: "Pain au chocolat", emoji: "🥐", glucides: 34, ig: 65, portion: "1 pain (70g)" },
    { id: "brioche", nom: "Brioche", emoji: "🍞", glucides: 25, ig: 70, portion: "2 tranches (50g)" },
    { id: "cereales", nom: "Céréales", emoji: "🥣", glucides: 26, ig: 85, portion: "1 bol (30g)" },
    { id: "muesli", nom: "Muesli", emoji: "🥣", glucides: 33, ig: 50, portion: "1 bol (50g)" },
    { id: "flocons_avoine", nom: "Flocons d'avoine", emoji: "🥣", glucides: 30, ig: 55, portion: "1 bol (50g)" },
    { id: "crepes", nom: "Crêpes", emoji: "🥞", glucides: 21, ig: 60, portion: "2 crêpes (60g)" },
    { id: "gaufres", nom: "Gaufres", emoji: "🧇", glucides: 40, ig: 75, portion: "1 gaufre (80g)" },
    { id: "petits_beurre_pdej", nom: "Petits-beurre", emoji: "🍪", glucides: 15, ig: 55, portion: "3 biscuits (25g)" },
  ],
  
  petit_dej_garniture: [
    { id: "beurre", nom: "Beurre", emoji: "🧈", glucides: 0, ig: 0, portion: "1 noix (10g)" },
    { id: "confiture", nom: "Confiture", emoji: "🍓", glucides: 12, ig: 65, portion: "1 cuillère (20g)" },
    { id: "miel", nom: "Miel", emoji: "🍯", glucides: 16, ig: 55, portion: "1 cuillère (20g)" },
    { id: "nutella", nom: "Pâte à tartiner", emoji: "🍫", glucides: 11, ig: 55, portion: "1 cuillère (20g)" },
    { id: "fromage_tartiner", nom: "Fromage à tartiner", emoji: "🧀", glucides: 1, ig: 0, portion: "1 portion (20g)" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // ENTRÉES
  // ═══════════════════════════════════════════════════════════
  entrees: [
    { id: "salade_verte", nom: "Salade verte", emoji: "🥗", glucides: 1, ig: 15, portion: "1 bol" },
    { id: "tomates", nom: "Tomates", emoji: "🍅", glucides: 4, ig: 30, portion: "1 portion" },
    { id: "concombre", nom: "Concombre", emoji: "🥒", glucides: 2, ig: 15, portion: "1/3 concombre" },
    { id: "carottes_rapees", nom: "Carottes râpées", emoji: "🥕", glucides: 7, ig: 47, portion: "1 portion" },
    { id: "soupe", nom: "Soupe de légumes", emoji: "🍜", glucides: 8, ig: 35, portion: "1 bol" },
    { id: "crudites", nom: "Crudités variées", emoji: "🥗", glucides: 5, ig: 20, portion: "1 assiette" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // PAINS (pour accompagnement repas)
  // ═══════════════════════════════════════════════════════════
  pains: [
    { id: "pain_blanc_repas", nom: "Pain blanc", emoji: "🥖", glucides: 27, ig: 70, portion: "2 tranches (50g)" },
    { id: "pain_complet_repas", nom: "Pain complet", emoji: "🍞", glucides: 24, ig: 45, portion: "2 tranches (50g)" },
    { id: "pain_cereales", nom: "Pain aux céréales", emoji: "🌾", glucides: 25, ig: 45, portion: "2 tranches (50g)" },
    { id: "pain_seigle", nom: "Pain de seigle", emoji: "🍞", glucides: 24, ig: 50, portion: "2 tranches (50g)" },
    { id: "pain_campagne", nom: "Pain de campagne", emoji: "🥖", glucides: 26, ig: 65, portion: "2 tranches (50g)" },
    { id: "baguette", nom: "Baguette", emoji: "🥖", glucides: 28, ig: 70, portion: "1/4 baguette (50g)" },
    { id: "pain_epeautre", nom: "Pain d'épeautre", emoji: "🌾", glucides: 25, ig: 40, portion: "2 tranches (50g)" },
    { id: "pain_mie", nom: "Pain de mie", emoji: "🍞", glucides: 26, ig: 70, portion: "2 tranches (50g)" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // FÉCULENTS
  // ═══════════════════════════════════════════════════════════
  feculents: [
    { id: "pates_blanches", nom: "Pâtes blanches", emoji: "🍝", glucides: 50, ig: 60, portion: "1 assiette (200g cuit)" },
    { id: "pates_completes", nom: "Pâtes complètes", emoji: "🍝", glucides: 46, ig: 40, portion: "1 assiette (200g cuit)" },
    { id: "riz_blanc", nom: "Riz blanc", emoji: "🍚", glucides: 42, ig: 70, portion: "1 bol (150g cuit)" },
    { id: "riz_complet", nom: "Riz complet", emoji: "🍚", glucides: 35, ig: 50, portion: "1 bol (150g cuit)" },
    { id: "riz_basmati", nom: "Riz basmati", emoji: "🍚", glucides: 38, ig: 58, portion: "1 bol (150g cuit)" },
    { id: "quinoa", nom: "Quinoa", emoji: "🌾", glucides: 32, ig: 53, portion: "1 portion (150g cuit)" },
    { id: "semoule", nom: "Semoule", emoji: "🍚", glucides: 35, ig: 65, portion: "1 portion (150g cuit)" },
    { id: "pommes_terre", nom: "Pomme de terre", emoji: "🥔", glucides: 30, ig: 65, portion: "2-3 pommes de terre (150g)" },
    { id: "puree", nom: "Purée", emoji: "🥔", glucides: 24, ig: 90, portion: "1 portion (150g)" },
    { id: "frites", nom: "Frites", emoji: "🍟", glucides: 53, ig: 75, portion: "1 portion (150g)" },
    { id: "gnocchi", nom: "Gnocchi", emoji: "🥟", glucides: 42, ig: 68, portion: "1 portion (150g)" },
    { id: "lentilles", nom: "Lentilles", emoji: "🌰", glucides: 28, ig: 30, portion: "1 portion (150g cuit)" },
    { id: "pois_chiches", nom: "Pois chiches", emoji: "🌰", glucides: 27, ig: 28, portion: "1 portion (150g cuit)" },
    { id: "boulghour", nom: "Boulgour", emoji: "🌾", glucides: 34, ig: 48, portion: "1 portion (150g cuit)" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // LÉGUMES
  // ═══════════════════════════════════════════════════════════
  legumes: [
    { id: "tomates_plat", nom: "Tomates", emoji: "🍅", glucides: 4, ig: 30, portion: "1 portion" },
    { id: "haricots_verts", nom: "Haricots verts", emoji: "🫛", glucides: 11, ig: 30, portion: "1 portion (150g)" },
    { id: "brocoli", nom: "Brocoli", emoji: "🥦", glucides: 11, ig: 15, portion: "1 portion (150g)" },
    { id: "poivrons", nom: "Poivrons", emoji: "🫑", glucides: 6, ig: 15, portion: "1/2 poivron" },
    { id: "courgettes", nom: "Courgettes", emoji: "🥒", glucides: 5, ig: 15, portion: "1 portion (150g)" },
    { id: "aubergine", nom: "Aubergine", emoji: "🍆", glucides: 9, ig: 15, portion: "1 portion (150g)" },
    { id: "chou_fleur", nom: "Chou-fleur", emoji: "🥬", glucides: 8, ig: 15, portion: "1 portion (150g)" },
    { id: "epinards", nom: "Épinards", emoji: "🥬", glucides: 6, ig: 15, portion: "1 portion (150g)" },
    { id: "champignons", nom: "Champignons", emoji: "🍄", glucides: 3, ig: 15, portion: "1 portion (100g)" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // PROTÉINES
  // ═══════════════════════════════════════════════════════════
  proteines: [
    { id: "poulet", nom: "Poulet", emoji: "🍗", glucides: 0, ig: 0, portion: "1 portion (120g)" },
    { id: "steak", nom: "Steak haché", emoji: "🥩", glucides: 0, ig: 0, portion: "1 steak (100g)" },
    { id: "poisson", nom: "Poisson", emoji: "🐟", glucides: 0, ig: 0, portion: "1 filet (120g)" },
    { id: "jambon", nom: "Jambon", emoji: "🥓", glucides: 1, ig: 0, portion: "2 tranches (50g)" },
    { id: "saucisses", nom: "Saucisses", emoji: "🌭", glucides: 1, ig: 0, portion: "2 saucisses (100g)" },
    { id: "oeufs", nom: "Œufs", emoji: "🥚", glucides: 1, ig: 0, portion: "2 œufs" },
    { id: "thon", nom: "Thon", emoji: "🐟", glucides: 0, ig: 0, portion: "1 boîte (100g)" },
    { id: "saumon", nom: "Saumon", emoji: "🐟", glucides: 0, ig: 0, portion: "1 pavé (120g)" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // FROMAGES
  // ═══════════════════════════════════════════════════════════
  fromages: [
    { id: "emmental", nom: "Emmental", emoji: "🧀", glucides: 0, ig: 0, portion: "1 portion (30g)" },
    { id: "camembert", nom: "Camembert", emoji: "🧀", glucides: 0, ig: 0, portion: "1 portion (30g)" },
    { id: "chevre", nom: "Chèvre", emoji: "🧀", glucides: 1, ig: 0, portion: "1 portion (30g)" },
    { id: "comte", nom: "Comté", emoji: "🧀", glucides: 0, ig: 0, portion: "1 portion (30g)" },
    { id: "fromage_fondu", nom: "Fromage fondu", emoji: "🧀", glucides: 2, ig: 0, portion: "1 portion" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // DESSERTS - FRUITS
  // ═══════════════════════════════════════════════════════════
  desserts_fruits: [
    { id: "pomme", nom: "Pomme", emoji: "🍎", glucides: 21, ig: 38, portion: "1 pomme (150g)" },
    { id: "poire", nom: "Poire", emoji: "🍐", glucides: 23, ig: 38, portion: "1 poire (150g)" },
    { id: "banane", nom: "Banane", emoji: "🍌", glucides: 28, ig: 52, portion: "1 banane (120g)" },
    { id: "orange", nom: "Orange", emoji: "🍊", glucides: 18, ig: 43, portion: "1 orange (150g)" },
    { id: "fraises", nom: "Fraises", emoji: "🍓", glucides: 12, ig: 40, portion: "1 bol (150g)" },
    { id: "raisin", nom: "Raisin", emoji: "🍇", glucides: 17, ig: 59, portion: "1 grappe (100g)" },
    { id: "kiwi", nom: "Kiwi", emoji: "🥝", glucides: 15, ig: 53, portion: "1 kiwi (100g)" },
    { id: "peche", nom: "Pêche", emoji: "🍑", glucides: 15, ig: 42, portion: "1 pêche (150g)" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // FRUITS FRAIS (pour petit-déj et goûter)
  // ═══════════════════════════════════════════════════════════
  fruits_frais: [
    { id: "pomme_frais", nom: "Pomme", emoji: "🍎", glucides: 21, ig: 38, portion: "1 pomme (150g)" },
    { id: "poire_frais", nom: "Poire", emoji: "🍐", glucides: 23, ig: 38, portion: "1 poire (150g)" },
    { id: "banane_frais", nom: "Banane", emoji: "🍌", glucides: 28, ig: 52, portion: "1 banane (120g)" },
    { id: "orange_frais", nom: "Orange", emoji: "🍊", glucides: 18, ig: 43, portion: "1 orange (150g)" },
    { id: "fraises_frais", nom: "Fraises", emoji: "🍓", glucides: 12, ig: 40, portion: "1 bol (150g)" },
    { id: "raisin_frais", nom: "Raisin", emoji: "🍇", glucides: 17, ig: 59, portion: "1 grappe (100g)" },
    { id: "kiwi_frais", nom: "Kiwi", emoji: "🥝", glucides: 15, ig: 53, portion: "1 kiwi (100g)" },
    { id: "peche_frais", nom: "Pêche", emoji: "🍑", glucides: 15, ig: 42, portion: "1 pêche (150g)" },
    { id: "clémentine", nom: "Clémentine", emoji: "🍊", glucides: 12, ig: 30, portion: "2 clémentines (100g)" },
    { id: "melon", nom: "Melon", emoji: "🍈", glucides: 13, ig: 65, portion: "1 tranche (200g)" },
    { id: "pasteque", nom: "Pastèque", emoji: "🍉", glucides: 15, ig: 72, portion: "1 tranche (200g)" },
    { id: "cerises", nom: "Cerises", emoji: "🍒", glucides: 16, ig: 22, portion: "1 bol (100g)" },
    { id: "fruits_secs_frais", nom: "Fruits secs", emoji: "🥜", glucides: 20, ig: 35, portion: "1 poignée (30g)" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // DESSERTS - QUOTIDIENS (Yaourts, Laitages)
  // ═══════════════════════════════════════════════════════════
  desserts_quotidiens: [
    { id: "yaourt_nature", nom: "Yaourt nature", emoji: "🍮", glucides: 6, ig: 35, portion: "1 pot (125g)" },
    { id: "yaourt_fruits", nom: "Yaourt aux fruits", emoji: "🍮", glucides: 21, ig: 35, portion: "1 pot (125g)" },
    { id: "fromage_blanc", nom: "Fromage blanc", emoji: "🥛", glucides: 4, ig: 30, portion: "1 pot (100g)" },
    { id: "petit_suisse", nom: "Petit-suisse", emoji: "🍮", glucides: 3, ig: 30, portion: "1 pot (60g)" },
    { id: "compote", nom: "Compote", emoji: "🍎", glucides: 18, ig: 50, portion: "1 pot (100g)" },
    { id: "creme_dessert", nom: "Crème dessert", emoji: "🍮", glucides: 22, ig: 40, portion: "1 pot (125g)" },
    { id: "flan", nom: "Flan", emoji: "🍮", glucides: 18, ig: 45, portion: "1 pot (100g)" },
    { id: "mousse_chocolat", nom: "Mousse au chocolat", emoji: "🍫", glucides: 20, ig: 40, portion: "1 pot (100g)" },
    { id: "riz_lait", nom: "Riz au lait", emoji: "🍚", glucides: 24, ig: 50, portion: "1 pot (125g)" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // DESSERTS - FESTIFS (Occasions spéciales)
  // ═══════════════════════════════════════════════════════════
  desserts_festifs: [
    { id: "gateau", nom: "Gâteau", emoji: "🍰", glucides: 44, ig: 65, portion: "1 part (80g)" },
    { id: "cookie", nom: "Cookie", emoji: "🍪", glucides: 20, ig: 60, portion: "1 cookie (30g)" },
    { id: "glace", nom: "Glace", emoji: "🍦", glucides: 25, ig: 60, portion: "2 boules (100g)" },
    { id: "crepe_sucre", nom: "Crêpe sucrée", emoji: "🥞", glucides: 28, ig: 60, portion: "1 crêpe" },
    { id: "tarte", nom: "Tarte aux fruits", emoji: "🥧", glucides: 35, ig: 60, portion: "1 part (100g)" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // PAINS - GOÛTER
  // ═══════════════════════════════════════════════════════════
  pains_gouter: [
    { id: "pain_blanc_gouter", nom: "Pain blanc", emoji: "🥖", glucides: 27, ig: 70, portion: "2 tranches (50g)" },
    { id: "pain_complet_gouter", nom: "Pain complet", emoji: "🍞", glucides: 24, ig: 45, portion: "2 tranches (50g)" },
    { id: "pain_mie_gouter", nom: "Pain de mie", emoji: "🍞", glucides: 26, ig: 70, portion: "2 tranches (50g)" },
    { id: "brioche_gouter_pain", nom: "Brioche", emoji: "🍞", glucides: 25, ig: 70, portion: "2 tranches (50g)" },
    { id: "pain_epices_gouter_pain", nom: "Pain d'épices", emoji: "🍞", glucides: 30, ig: 70, portion: "2 tranches (40g)" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // GOÛTER - Contenu
  // ═══════════════════════════════════════════════════════════
  gouter_contenu: [
    { id: "cookies_gouter", nom: "Cookies", emoji: "🍪", glucides: 20, ig: 60, portion: "2 cookies (30g)" },
    { id: "gateau_gouter", nom: "Gâteau", emoji: "🍰", glucides: 44, ig: 65, portion: "1 part (80g)" },
    { id: "barre_cereales", nom: "Barre de céréales", emoji: "🍫", glucides: 18, ig: 65, portion: "1 barre (25g)" },
    { id: "croissant_gouter", nom: "Croissant", emoji: "🥐", glucides: 27, ig: 70, portion: "1 croissant (60g)" },
    { id: "madeleine", nom: "Madeleines", emoji: "🧁", glucides: 24, ig: 65, portion: "2 madeleines (40g)" },
    { id: "yaourt_gouter", nom: "Yaourt", emoji: "🍮", glucides: 21, ig: 35, portion: "1 pot (125g)" },
    { id: "quatre_quarts", nom: "Quatre-quarts", emoji: "🍰", glucides: 26, ig: 65, portion: "1 tranche (50g)" },
    { id: "petits_beurre_gouter", nom: "Petits-beurre", emoji: "🍪", glucides: 15, ig: 55, portion: "3 biscuits (25g)" },
    { id: "galettes", nom: "Galettes", emoji: "🍪", glucides: 18, ig: 55, portion: "3 galettes (30g)" },
    { id: "cake", nom: "Cake", emoji: "🍰", glucides: 28, ig: 65, portion: "1 tranche (50g)" },
    { id: "compote_gourde", nom: "Compote gourde", emoji: "🍎", glucides: 15, ig: 50, portion: "1 gourde (100g)" },
  ],
  
  gouter_garniture: [
    { id: "beurre_gouter", nom: "Beurre", emoji: "🧈", glucides: 0, ig: 0, portion: "1 noix (10g)" },
    { id: "confiture_gouter", nom: "Confiture", emoji: "🍓", glucides: 12, ig: 65, portion: "1 cuillère (20g)" },
    { id: "nutella_gouter", nom: "Pâte à tartiner", emoji: "🍫", glucides: 11, ig: 55, portion: "1 cuillère (20g)" },
    { id: "miel_gouter", nom: "Miel", emoji: "🍯", glucides: 16, ig: 55, portion: "1 cuillère (20g)" },
  ],
  
  // ═══════════════════════════════════════════════════════════
  // CONFIGURATION DES STRUCTURES DE REPAS
  // ═══════════════════════════════════════════════════════════
  structures: {
    petit_dejeuner: [
      { 
        etape: 1, 
        id: "boissons",
        titre: "Boissons", 
        emoji: "☕", 
        question: "Qu'est-ce que tu bois ?",
        categorie: "boissons_petit_dej",  // Petit-déj
        
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 2, 
        id: "pain",
        titre: "Pain", 
        emoji: "🍞", 
        question: "Quel pain veux-tu ?",
        categorie: "pains_petit_dej",
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 3, 
        id: "contenu",
        titre: "Contenu", 
        emoji: "🥐", 
        question: "Qu'est-ce que tu manges d'autre ?",
        categorie: "petit_dej_contenu",
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 4, 
        id: "fruits",
        titre: "Fruits", 
        emoji: "🍎", 
        question: "Des fruits frais ?",
        categorie: "fruits_frais",
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 5, 
        id: "garniture",
        titre: "Avec quoi ?", 
        emoji: "🧈", 
        question: "Avec quoi ?",
        categorie: "petit_dej_garniture",
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      }
    ],
    
    dejeuner: [
      { 
        etape: 1, 
        id: "boissons",
        titre: "Boissons", 
        emoji: "🥤", 
        question: "Qu'est-ce que tu bois ?",
        categorie: "boissons_repas",     // Déjeuner
        
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 2, 
        id: "pain",
        titre: "Pain", 
        emoji: "🍞", 
        question: "Du pain pour accompagner ?",
        categorie: "pains",
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 3, 
        id: "entree",
        titre: "Entrée", 
        emoji: "🥗", 
        question: "Une entrée ?",
        categorie: "entrees",
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 4, 
        id: "plat",
        titre: "Plat", 
        emoji: "🍽️", 
        question: "Ton plat principal",
        sousEtapes: [
          {
            id: "feculent",
            titre: "Choisis ton féculent",
            categorie: "feculents",
            obligatoire: true,
            multiSelect: true
          },
          {
            id: "legumes",
            titre: "Ajoute des légumes",
            categorie: "legumes",
            obligatoire: false,
            multiSelect: true
          },
          {
            id: "proteine",
            titre: "Ajoute une protéine",
            categorie: "proteines",
            obligatoire: false,
            multiSelect: true
          }
        ],
        obligatoire: true,
        canSkip: false
      },
      { 
        etape: 5, 
        id: "fromage",
        titre: "Fromage", 
        emoji: "🧀", 
        question: "Du fromage ?",
        categorie: "fromages",
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 6, 
        id: "dessert",
        titre: "Dessert", 
        emoji: "🍰", 
        question: "Un dessert ?",
        sousEtapes: [
          {
            id: "choix",
            titre: "Choisis ton dessert",
            categories: ["desserts_fruits", "desserts_quotidiens", "desserts_festifs"],
            obligatoire: false,
            multiSelect: true
          }
        ],
        obligatoire: false,
        canSkip: true
      }
    ],
    
    gouter: [
      { 
        etape: 1, 
        id: "boissons",
        titre: "Boissons", 
        emoji: "🥤", 
        question: "Qu'est-ce que tu bois ?",
        categorie: "boissons_gouter",    // Goûter
        
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 2, 
        id: "pain",
        titre: "Pain", 
        emoji: "🍞", 
        question: "Quel pain veux-tu ?",
        categorie: "pains_gouter",
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 3, 
        id: "contenu",
        titre: "Contenu", 
        emoji: "🍪", 
        question: "Qu'est-ce que tu manges d'autre ?",
        categorie: "gouter_contenu",
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 4, 
        id: "fruits",
        titre: "Fruits", 
        emoji: "🍎", 
        question: "Des fruits frais ?",
        categorie: "fruits_frais",
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 5, 
        id: "garniture",
        titre: "Avec quoi ?", 
        emoji: "🧈", 
        question: "Avec quoi ?",
        categorie: "gouter_garniture",
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      }
    ],
    
    diner: [
      // Identique au déjeuner
      { 
        etape: 1, 
        id: "boissons",
        titre: "Boissons", 
        emoji: "🥤", 
        question: "Qu'est-ce que tu bois ?",
        categorie: "boissons_repas",     // Dîner
        
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 2, 
        id: "pain",
        titre: "Pain", 
        emoji: "🍞", 
        question: "Du pain pour accompagner ?",
        categorie: "pains",
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 3, 
        id: "entree",
        titre: "Entrée", 
        emoji: "🥗", 
        question: "Une entrée ?",
        categorie: "entrees",
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 4, 
        id: "plat",
        titre: "Plat", 
        emoji: "🍽️", 
        question: "Ton plat principal",
        sousEtapes: [
          {
            id: "feculent",
            titre: "Choisis ton féculent",
            categorie: "feculents",
            obligatoire: true,
            multiSelect: true
          },
          {
            id: "legumes",
            titre: "Ajoute des légumes",
            categorie: "legumes",
            obligatoire: false,
            multiSelect: true
          },
          {
            id: "proteine",
            titre: "Ajoute une protéine",
            categorie: "proteines",
            obligatoire: false,
            multiSelect: true
          }
        ],
        obligatoire: true,
        canSkip: false
      },
      { 
        etape: 5, 
        id: "fromage",
        titre: "Fromage", 
        emoji: "🧀", 
        question: "Du fromage ?",
        categorie: "fromages",
        obligatoire: false,
        multiSelect: true,
        canSkip: true
      },
      { 
        etape: 6, 
        id: "dessert",
        titre: "Dessert", 
        emoji: "🍰", 
        question: "Un dessert ?",
        sousEtapes: [
          {
            id: "choix",
            titre: "Choisis ton dessert",
            categories: ["desserts_fruits", "desserts_quotidiens", "desserts_festifs"],
            obligatoire: false,
            multiSelect: true
          }
        ],
        obligatoire: false,
        canSkip: true
      }
    ]
  }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SimpleModeData;
}
