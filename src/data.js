import { loadFromGist, getGistId } from './gist.js';

export const PALETTE = [
  '#7A3A0F', '#B86A10', '#8A7A10', '#4A7A20', '#1A5C6B',
  '#2A3A7A', '#4A2A7A', '#7A2A5A', '#7A2A3A', '#6A3020',
  '#5A5040', '#3A5A3A', '#1A4A5A', '#1A2A6A', '#3A1A6A',
  '#6A1A4A', '#6A2A2A', '#4A3A20', '#2A4A2A', '#1A3A4A',
  '#2A1A4A',
];

export const DEFAULT_RECIPES = [
  {
    id: 'sour-grape',
    name: 'Sour Grape',
    accent: '#7A3A0F',
    ingredients: [
      { name: 'Sodium Chloride',   grams40: 100.0, isBase: true },
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
    accent: '#B86A10',
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
    accent: '#8A7A10',
    ingredients: [
      { name: 'Sodium Chloride',    grams40: 100.0, isBase: true },
      { name: 'Potassium Chloride', grams40: 15.32, isBase: true },
      { name: 'Magnesium Malate',   grams40: 15.6,  isBase: true },
      { name: 'Citric Acid',        grams40: 32.0 },
      { name: 'Lemon Flavor Powder', grams40: 56.0 },
      { name: 'Lemon Juice Powder', grams40: 16.0 },
      { name: 'Stevia Powder',      grams40: 2.4 },
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

// On startup: try gist first (if we have a saved gist ID), fall back to localStorage
export async function loadRecipes() {
  const gistId = getGistId();
  if (gistId) {
    try {
      const recipes = await loadFromGist(gistId);
      if (recipes) {
        saveToLocal(recipes); // keep local in sync
        return recipes;
      }
    } catch (_) {}
  }
  return loadFromLocal();
}
