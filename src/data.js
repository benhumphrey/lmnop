// Muted earthy palette for recipe color selection
export const PALETTE = [
  '#7A3A0F', // burnt sienna
  '#B86A10', // amber
  '#8A7A10', // ochre
  '#4A7A20', // olive
  '#1A5C6B', // teal
  '#2A3A7A', // navy
  '#4A2A7A', // plum
  '#7A2A5A', // mulberry
  '#7A2A3A', // burgundy
  '#6A3020', // dark brick
  '#5A5040', // warm slate
  '#3A5A3A', // forest
  '#1A4A5A', // dark teal
  '#1A2A6A', // dark navy
  '#3A1A6A', // deep violet
  '#6A1A4A', // dark rose
  '#6A2A2A', // dark red
  '#4A3A20', // dark tan
  '#2A4A2A', // dark green
  '#1A3A4A', // dark slate
  '#2A1A4A', // dark indigo
];

// Default recipes — stored normalized to 40 servings, NaCl = 100g
export const DEFAULT_RECIPES = [
  {
    id: 'sour-grape',
    name: 'Sour Grape',
    accent: '#7A3A0F',
    ingredients: [
      { name: 'Sodium Chloride', grams40: 100.0, isBase: true },
      { name: 'Potassium Chloride', grams40: 15.4, isBase: true },
      { name: 'Magnesium Malate', grams40: 15.6, isBase: true },
      { name: 'Malic Acid', grams40: 19.2 },
      { name: 'Tartaric Acid', grams40: 12.8 },
      { name: 'OOO Grape Flavor', grams40: 12.0 },
      { name: 'Stevia', grams40: 14.6 },
    ],
  },
  {
    id: 'grapefruit',
    name: 'Grapefruit',
    accent: '#B86A10',
    ingredients: [
      { name: 'Sodium Chloride', grams40: 100.0, isBase: true },
      { name: 'Potassium Chloride', grams40: 15.32, isBase: true },
      { name: 'Magnesium Malate', grams40: 15.6, isBase: true },
      { name: 'Grapefruit Powder', grams40: 160.0 },
      { name: 'Citric Acid', grams40: 60.0 },
      { name: 'Stevia', grams40: 3.84 },
    ],
  },
  {
    id: 'lemon',
    name: 'Lemon',
    accent: '#8A7A10',
    ingredients: [
      { name: 'Sodium Chloride', grams40: 100.0, isBase: true },
      { name: 'Potassium Chloride', grams40: 15.32, isBase: true },
      { name: 'Magnesium Malate', grams40: 15.6, isBase: true },
      { name: 'Citric Acid', grams40: 32.0 },
      { name: 'Lemon Flavor Powder', grams40: 56.0 },
      { name: 'Lemon Juice Powder', grams40: 16.0 },
      { name: 'Stevia Powder', grams40: 2.4 },
    ],
  },
];

// Electrolyte molar ratios (elemental / compound)
// NaCl: Na fraction = 22.990 / 58.440 = 0.3934
// KCl:  K fraction  = 39.098 / 74.548 = 0.5245
// MgMalate anhydrous (C4H4MgO5, MW=156.376): Mg fraction = 24.305 / 156.376 = 0.1554
export const MOLAR_RATIOS = {
  Na: 0.3934,
  K:  0.5245,
  Mg: 0.1554,
};

export const BASE_SERVINGS = 40;

// Normalize a recipe entered at arbitrary serving count to the 40-serving base
export function normalizeIngredients(ingredients, testedServings) {
  const scale = BASE_SERVINGS / testedServings;
  return ingredients.map(ing => ({
    ...ing,
    grams40: ing.gramsRaw != null ? ing.gramsRaw * scale : ing.grams40,
  }));
}

export function formatGrams(val) {
  if (val >= 100) return val.toFixed(1);
  if (val >= 1)   return val.toFixed(2);
  return val.toFixed(3);
}

export function generateId(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
}

const STORAGE_KEY = 'lmnop_recipes';

export function loadRecipes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return DEFAULT_RECIPES;
}

export function saveRecipes(recipes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  } catch (_) {}
}
