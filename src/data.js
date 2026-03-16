import { loadFromGist, getGistId } from './gist.js';

export const PALETTE = [
  '#D46E72', // Watermelon
  '#C85468', // Strawberry
  '#B85070', // Raspberry
  '#D98B50', // Peach
  '#DC7048', // Grapefruit
  '#D46030', // Blood Orange
  '#C8B84A', // Yuzu
  '#BEA83C', // Lemon
  '#A89030', // Turmeric
  '#85BA68', // Kiwi
  '#6AAA50', // Honeydew
  '#5A9860', // Cucumber
  '#62A8A8', // Coconut
  '#4A9898', // Spearmint
  '#5888B8', // Blueberry
  '#6E88C4', // Acai
  '#8870B8', // Lavender
  '#B07EAC', // Blackberry
  '#C088A0', // Lychee
  '#B87888', // Hibiscus
];

export const DEFAULT_RECIPES = [
  {
    id: 'sour-grape',
    name: 'Sour Grape',
    accent: '#B07EAC', // Blackberry
    ingredients: [
      { name: 'Sodium Chloride',    grams40: 100.0, isBase: true },
      { name: 'Potassium Chloride', grams40: 15.4,  isBase: true },
      { name: 'Magnesium Malate',   grams40: 15.6,  isBase: true },
      { name: 'Malic Acid',         grams40: 19.2 },
      { name: 'Tartaric Acid',      grams40: 12.8 },
      { name: 'OOO Grape Flavor',   grams40: 12.0 },
      { name: 'Stevia',             grams40: 14.6 },
    ],
  },
  {
    id: 'grapefruit',
    name: 'Grapefruit',
    accent: '#DC7048', // Grapefruit
    ingredients: [
      { name: 'Sodium Chloride',    grams40: 100.0, isBase: true },
      { name: 'Potassium Chloride', grams40: 15.32, isBase: true },
      { name: 'Magnesium Malate',   grams40: 15.6,  isBase: true },
      { name: 'Grapefruit Powder',  grams40: 160.0 },
      { name: 'Citric Acid',        grams40: 60.0 },
      { name: 'Stevia',             grams40: 3.84 },
    ],
  },
  {
    id: 'lemon',
    name: 'Lemon',
    accent: '#BEA83C', // Lemon
    ingredients: [
      { name: 'Sodium Chloride',     grams40: 100.0, isBase: true },
      { name: 'Potassium Chloride',  grams40: 15.32, isBase: true },
      { name: 'Magnesium Malate',    grams40: 15.6,  isBase: true },
      { name: 'Citric Acid',         grams40: 32.0 },
      { name: 'Lemon Flavor Powder', grams40: 56.0 },
      { name: 'Lemon Juice Powder',  grams40: 16.0 },
      { name: 'Stevia Powder',       grams40: 2.4 },
    ],
  },
];

export const MOLAR_RATIOS = { Na: 0.3934, K: 0.5245, Mg: 0.1554 };
export const BASE_SERVINGS = 40;

export function formatGrams(val) {
  if (val >= 100) return val.toFixed(1);
  if (val >= 1)   return val.toFixed(2);
  return val.toFixed(3);
}

export function generateId(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
}

const LS_RECIPES_KEY = 'lmnop_recipes';

export function loadFromLocal() {
  try {
    const raw = localStorage.getItem(LS_RECIPES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return DEFAULT_RECIPES;
}

export function saveToLocal(recipes) {
  try {
    localStorage.setItem(LS_RECIPES_KEY, JSON.stringify(recipes));
  } catch (_) {}
}

export async function loadRecipes() {
  const gistId = getGistId();
  if (gistId) {
    try {
      const recipes = await loadFromGist(gistId);
      if (recipes) {
        saveToLocal(recipes);
        return recipes;
      }
    } catch (_) {}
  }
  return loadFromLocal();
}
