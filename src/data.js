import { loadFromGist, getGistId } from './gist.js';

export const PALETTE = [
  '#b47e64', // Terra
  '#b88347', // Amber
  '#b69e3e', // Ochre
  '#7ca456', // Olive
  '#45927c', // Teal
  '#567cb8', // Slate blue
  '#7f6ab9', // Lavender
  '#a85d95', // Plum
  '#b85670', // Rose
  '#b95b5b', // Brick
  '#7c9268', // Sage
  '#458796', // Cerulean
  '#8a769e', // Grape
  '#a07946', // Caramel
  '#c96e54', // Grapefruit
  '#86a046', // Citrus
  '#427065', // Spearmint
  '#76809e', // Steel
  '#8e677a', // Berry
  '#777f66', // Fern
  '#9e6357', // Salmon
];

export const DEFAULT_RECIPES = [
  {
    id: 'sour-grape',
    name: 'Sour Grape',
    accent: '#8a769e',
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
    accent: '#c96e54',
    ingredients: [
      { name: 'Sodium Chloride',    grams40: 100.0,  isBase: true },
      { name: 'Potassium Chloride', grams40: 15.32,  isBase: true },
      { name: 'Magnesium Malate',   grams40: 15.6,   isBase: true },
      { name: 'Grapefruit Powder',  grams40: 160.0 },
      { name: 'Citric Acid',        grams40: 60.0 },
      { name: 'Stevia',             grams40: 3.84 },
    ],
  },
  {
    id: 'lemon',
    name: 'Lemon',
    accent: '#b69e3e',
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
