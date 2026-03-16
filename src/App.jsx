import { useState, useCallback, useMemo } from 'react';
import { loadRecipes, saveRecipes, formatGrams, MOLAR_RATIOS, BASE_SERVINGS } from './data.js';
import RecipeModal from './RecipeModal.jsx';

export default function App() {
  const [recipes, setRecipes] = useState(() => loadRecipes());
  const [selectedId, setSelectedId] = useState(() => loadRecipes()[0]?.id);
  const [servings, setServings] = useState(10);
  const [customServings, setCustomServings] = useState('');
  const [overrideIndex, setOverrideIndex] = useState(null);
  const [overrideValue, setOverrideValue] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editText, setEditText] = useState('');
  const [modal, setModal] = useState(null);

  const recipe = useMemo(() => recipes.find(r => r.id === selectedId), [recipes, selectedId]);

  const scale = useMemo(() => {
    if (overrideIndex !== null && overrideValue !== null) {
      const base = recipe.ingredients[overrideIndex].grams40;
      return base === 0 ? servings / BASE_SERVINGS : overrideValue / base;
    }
    return servings / BASE_SERVINGS;
  }, [recipe, servings, overrideIndex, overrideValue]);

  const effectiveServings = useMemo(() => {
    if (overrideIndex !== null && overrideValue !== null) {
      const base = recipe.ingredients[overrideIndex].grams40;
      return base === 0 ? servings : (overrideValue / base) * BASE_SERVINGS;
    }
    return servings;
  }, [recipe, servings, overrideIndex, overrideValue]);

  const computed = useMemo(() =>
    recipe.ingredients.map((ing, i) => ({
      ...ing,
      computed: ing.grams40 * scale,
      isOverridden: i === overrideIndex,
    })),
    [recipe, scale, overrideIndex]
  );

  const totalWeight = useMemo(() => computed.reduce((s, i) => s + i.computed, 0), [computed]);

  const perServing = useMemo(() => {
    const nacl  = (computed[0]?.computed || 0) / effectiveServings;
    const kcl   = (computed[1]?.computed || 0) / effectiveServings;
    const mgmal = (computed[2]?.computed || 0) / effectiveServings;
    return {
      nacl, kcl, mgmal,
      total: totalWeight / effectiveServings,
      naMg:  nacl  * MOLAR_RATIOS.Na * 1000,
      kMg:   kcl   * MOLAR_RATIOS.K  * 1000,
      mgMg:  mgmal * MOLAR_RATIOS.Mg * 1000,
    };
  }, [computed, effectiveServings, totalWeight]);

  const selectRecipe = useCallback((id) => {
    setSelectedId(id);
    setOverrideIndex(null);
    setOverrideValue(null);
    setEditingCell(null);
  }, []);

  const setPreset = useCallback((n) => {
    setServings(n);
    setCustomServings('');
    setOverrideIndex(null);
    setOverrideValue(null);
    setEditingCell(null);
  }, []);

  const handleCustom = useCallback((e) => {
    const val = e.target.value;
    setCustomServings(val);
    const n = parseFloat(val);
    if (n > 0) {
      setServings(n);
      setOverrideIndex(null);
      setOverrideValue(null);
    }
  }, []);

  const startEdit = useCallback((i) => {
    setEditingCell(i);
    setEditText(formatGrams(computed[i].computed));
  }, [computed]);

  const commitEdit = useCallback((i) => {
    const val = parseFloat(editText);
    if (!isNaN(val) && val > 0) {
      setOverrideIndex(i);
      setOverrideValue(val);
    }
    setEditingCell(null);
  }, [editText]);

  const cancelEdit = useCallback(() => setEditingCell(null), []);

  const clearOverride = useCallback(() => {
    setOverrideIndex(null);
    setOverrideValue(null);
  }, []);

  const handleSaveRecipe = useCallback((saved) => {
    setRecipes(prev => {
      const exists = prev.find(r => r.id === saved.id);
      const next = exists
        ? prev.map(r => r.id === saved.id ? saved : r)
        : [...prev, saved];
      saveRecipes(next);
      return next;
    });
    setSelectedId(saved.id);
    setModal(null);
    setOverrideIndex(null);
    setOverrideValue(null);
  }, []);

  const handleDeleteRecipe = useCallback((id) => {
    setRecipes(prev => {
      const next = prev.filter(r => r.id !== id);
      saveRecipes(next);
      return next;
    });
    setSelectedId(recipes.find(r => r.id !== id)?.id);
    setModal(null);
  }, [recipes]);

  const PRESETS = [5, 10, 40];
  const isPresetActive = (n) => overrideIndex === null && servings === n && !customServings;
  const ac = recipe.accent;

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <h1 style={s.wordmark}>LMNOP</h1>
          <span style={s.headerSub}>Electrolyte Calculator</span>
        </div>
        <div style={s.headerRight}>
          <span style={s.headerSubRight}>Active batch</span>
          <div>
            <span style={s.servingBig}>
              {Math.round(effectiveServings * 10) / 10}
            </span>
            {' '}
            <span style={s.servingUnit}>servings</span>
          </div>
        </div>
      </header>

      <div style={s.body}>
        {/* Recipe shelf */}
        <span style={s.sectionLabel}>Recipes</span>
        <div style={s.shelf}>
          {recipes.map(r => (
            <div
              key={r.id}
              onClick={() => selectRecipe(r.id)}
              style={{
                ...s.recipeCard,
                ...(r.id !== selectedId ? s.recipeCardDim : {}),
              }}
            >
              <div style={{ ...s.recipeCardBar, background: r.accent, opacity: r.id === selectedId ? 1 : 0.4 }} />
              <span style={s.rcName}>{r.name}</span>
              <div style={s.rcMeta}>
                <div style={{ ...s.rcDot, background: r.accent }} />
                {r.ingredients.length} ingredients
              </div>
              <button
                style={s.rcEditBtn}
                onClick={(e) => { e.stopPropagation(); setModal({ mode: 'edit', recipe: r }); }}
                title="Edit recipe"
              >
                ✎
              </button>
            </div>
          ))}
          <div style={s.addCard} onClick={() => setModal({ mode: 'new' })}>
            <span style={s.addPlus}>+</span> New recipe
          </div>
        </div>

        {/* Servings */}
        <span style={s.sectionLabel}>Servings</span>
        <div style={s.servRow}>
          {PRESETS.map(n => (
            <button
              key={n}
              onClick={() => setPreset(n)}
              style={{
                ...s.servBtn,
                ...(isPresetActive(n) ? { background: '#2C2518', color: '#F5F0E4', borderColor: '#2C2518' } : {}),
              }}
            >
              {n}
            </button>
          ))}
          <input
            style={s.customInput}
            type="number"
            value={customServings}
            onChange={handleCustom}
            placeholder="Custom"
          />
        </div>

        {/* Override banner */}
        {overrideIndex !== null && (
          <div style={s.overrideBanner}>
            <span style={{ color: ac, fontWeight: 700 }}>⟳</span>
            {' '}Ratio-locked to <strong>{recipe.ingredients[overrideIndex].name}</strong> = {formatGrams(overrideValue)}g
            → {effectiveServings.toFixed(1)} effective servings
            <button style={s.clearBtn} onClick={clearOverride}>Clear</button>
          </div>
        )}

        {/* Ingredient table */}
        <div style={s.table}>
          <div style={s.tableHead}>
            <span style={{ flex: 1 }}>Ingredient</span>
            <span style={{ width: 70, textAlign: 'right' }}>Grams</span>
            <span style={{ width: 46, textAlign: 'right' }}>%</span>
          </div>

          {computed.map((ing, i) => {
            const pct = totalWeight > 0 ? (ing.computed / totalWeight) * 100 : 0;
            const isEditing = editingCell === i;
            return (
              <div
                key={i}
                style={{
                  ...s.tableRow,
                  ...(ing.isOverridden
                    ? { background: accentAlpha(ac, 0.08), borderLeft: `3px solid ${ac}` }
                    : {}),
                }}
              >
                <span style={s.ingName}>
                  {ing.name}
                  {ing.isBase && <span style={s.baseTag}>base</span>}
                </span>

                <div
                  style={{ width: 70, textAlign: 'right', cursor: 'pointer' }}
                  onClick={() => !isEditing && startEdit(i)}
                  title="Click to override — all other ingredients scale proportionally"
                >
                  {isEditing ? (
                    <input
                      autoFocus
                      type="number"
                      step="any"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onBlur={() => commitEdit(i)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitEdit(i);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      style={{ ...s.cellInput, borderColor: ac }}
                    />
                  ) : (
                    <span style={{ ...s.gramVal, ...(ing.isOverridden ? { color: ac } : {}) }}>
                      {formatGrams(ing.computed)}
                    </span>
                  )}
                </div>

                <span style={{ ...s.pctVal, width: 46, textAlign: 'right' }}>
                  {pct.toFixed(1)}%
                </span>

                <div style={s.barTrack}>
                  <div style={{
                    ...s.barFill,
                    width: `${Math.min(pct, 100)}%`,
                    background: ing.isBase ? 'rgba(44,37,24,0.15)' : ac,
                    opacity: ing.isBase ? 1 : 0.35,
                  }} />
                </div>
              </div>
            );
          })}

          <div style={s.totalRow}>
            <span style={{ flex: 1, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(245,240,228,0.45)' }}>
              Total
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#F5F0E4' }}>
              {formatGrams(totalWeight)}g
            </span>
            <span style={{ width: 46 }} />
          </div>
        </div>

        {/* Per-serving panels */}
        <div style={s.twoCols}>
          <div style={s.panel}>
            <span style={s.panelTitle}>Per serving</span>
            <div style={s.pRows}>
              <div style={s.pRow}>
                <span style={s.pLabel}>Sodium Chloride</span>
                <span style={s.pVal}>{perServing.nacl.toFixed(3)}g</span>
              </div>
              <div style={s.pRow}>
                <span style={s.pLabel}>Potassium Chloride</span>
                <span style={s.pVal}>{perServing.kcl.toFixed(3)}g</span>
              </div>
              <div style={s.pRow}>
                <span style={s.pLabel}>Magnesium Malate</span>
                <span style={s.pVal}>{perServing.mgmal.toFixed(3)}g</span>
              </div>
              <div style={{ ...s.pRow, borderTop: '1px solid rgba(60,45,20,0.1)', paddingTop: 7, marginTop: 4 }}>
                <span style={{ ...s.pLabel, color: '#1E1A12', fontSize: 13 }}>Serving total</span>
                <span style={{ ...s.pVal, fontSize: 15 }}>{formatGrams(perServing.total)}g</span>
              </div>
            </div>
          </div>

          <div style={s.panel}>
            <span style={s.panelTitle}>Elemental ions / serving</span>
            <div style={s.eRows}>
              {[
                { label: 'Na⁺ sodium',     val: perServing.naMg, color: ac,        pct: perServing.naMg / 1000 * 100 },
                { label: 'K⁺ potassium',   val: perServing.kMg,  color: '#3A5A3A', pct: perServing.kMg  / 1000 * 100 },
                { label: 'Mg²⁺ magnesium', val: perServing.mgMg, color: '#1A4A5A', pct: perServing.mgMg / 1000 * 100 },
              ].map(({ label, val, color, pct }) => (
                <div key={label} style={s.eRow}>
                  <div style={s.eTop}>
                    <span style={s.eName}>{label}</span>
                    <span style={s.eVal}>{Math.round(val)}<span style={s.eUnit}> mg</span></span>
                  </div>
                  <div style={s.eTrack}>
                    <div style={{ ...s.eFill, width: `${Math.min(pct, 100)}%`, background: color, opacity: 0.6 }} />
                  </div>
                </div>
              ))}
              <div style={{ ...s.eTop, borderTop: '1px solid rgba(60,45,20,0.1)', paddingTop: 7, marginTop: 3 }}>
                <span style={{ ...s.eName, color: '#1E1A12', fontWeight: 700, fontSize: 13 }}>Total</span>
                <span style={{ ...s.eVal, fontSize: 15 }}>
                  {Math.round(perServing.naMg + perServing.kMg + perServing.mgMg)}
                  <span style={s.eUnit}> mg</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={s.footerHint}>
          Tap any gram value to override it — all other ingredients scale proportionally.
        </div>
      </div>

      {modal && (
        <RecipeModal
          mode={modal.mode}
          recipe={modal.recipe}
          onSave={handleSaveRecipe}
          onDelete={handleDeleteRecipe}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function accentAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const s = {
  root: {
    minHeight: '100vh',
    background: '#EEE9DF',
    maxWidth: 640,
    margin: '0 auto',
  },
  header: {
    background: '#2C2518',
    padding: '16px 20px 14px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  wordmark: {
    fontFamily: "'Bungee Shade', sans-serif",
    fontSize: 48,
    color: '#C8853A',
    letterSpacing: 2,
    lineHeight: 1,
    fontWeight: 400,
  },
  headerSub: {
    display: 'block',
    fontFamily: "'DM Mono', monospace",
    fontSize: 8,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: 'rgba(245,240,228,0.3)',
    marginTop: 4,
  },
  headerRight: {
    textAlign: 'right',
  },
  headerSubRight: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 8,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: 'rgba(245,240,228,0.3)',
    display: 'block',
    marginBottom: 3,
  },
  servingBig: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 26,
    fontWeight: 500,
    lineHeight: 1,
    color: '#C8853A',
  },
  servingUnit: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: 'rgba(245,240,228,0.35)',
  },
  body: {
    padding: '16px 18px 32px',
  },
  sectionLabel: {
    display: 'block',
    fontFamily: "'DM Mono', monospace",
    fontSize: 8,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: '#A89E8A',
    marginBottom: 9,
  },
  shelf: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 7,
    marginBottom: 20,
  },
  recipeCard: {
    background: '#FFFCF5',
    border: '1px solid rgba(60,45,20,0.13)',
    borderRadius: 7,
    padding: '10px 10px 8px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none',
  },
  recipeCardDim: {
    background: '#E5DFD3',
  },
  recipeCardBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  rcName: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1E1A12',
    display: 'block',
    marginBottom: 2,
    paddingRight: 18,
  },
  rcMeta: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    color: '#A89E8A',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  rcDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    opacity: 0.7,
    flexShrink: 0,
  },
  rcEditBtn: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 20,
    height: 20,
    background: 'transparent',
    border: 'none',
    color: '#A89E8A',
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    padding: 0,
  },
  addCard: {
    border: '1px dashed rgba(60,45,20,0.25)',
    borderRadius: 7,
    padding: '10px 10px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    color: '#A89E8A',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    userSelect: 'none',
  },
  addPlus: {
    fontSize: 15,
    fontWeight: 400,
    lineHeight: 1,
  },
  servRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  servBtn: {
    height: 36,
    minWidth: 50,
    border: '1px solid rgba(60,45,20,0.22)',
    borderRadius: 5,
    background: '#F5F1E8',
    fontFamily: "'DM Mono', monospace",
    fontSize: 14,
    fontWeight: 500,
    color: '#7A7060',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customInput: {
    height: 36,
    width: 80,
    border: '1px solid rgba(60,45,20,0.22)',
    borderRadius: 5,
    background: '#F5F1E8',
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    color: '#1E1A12',
    textAlign: 'center',
    outline: 'none',
    padding: '0 6px',
  },
  overrideBanner: {
    marginBottom: 12,
    padding: '9px 13px',
    background: '#F5F1E8',
    border: '1px solid rgba(60,45,20,0.18)',
    borderRadius: 7,
    fontSize: 12,
    color: '#7A7060',
    lineHeight: 1.6,
  },
  clearBtn: {
    marginLeft: 10,
    padding: '2px 10px',
    background: 'transparent',
    border: '1px solid rgba(60,45,20,0.3)',
    borderRadius: 4,
    color: '#7A7060',
    cursor: 'pointer',
    fontSize: 11,
  },
  table: {
    background: '#FFFCF5',
    border: '1px solid rgba(60,45,20,0.13)',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 14,
  },
  tableHead: {
    display: 'flex',
    padding: '7px 14px',
    background: '#E5DFD3',
    borderBottom: '1px solid rgba(60,45,20,0.13)',
    fontFamily: "'DM Mono', monospace",
    fontSize: 8,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#A89E8A',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '11px 14px',
    borderTop: '1px solid rgba(60,45,20,0.09)',
    position: 'relative',
    overflow: 'hidden',
    borderLeft: '3px solid transparent',
  },
  ingName: {
    flex: 1,
    fontSize: 13,
    fontWeight: 600,
    color: '#1E1A12',
  },
  baseTag: {
    fontSize: 7,
    fontFamily: "'DM Mono', monospace",
    letterSpacing: '1px',
    background: '#E5DFD3',
    color: '#A89E8A',
    padding: '1px 5px',
    borderRadius: 2,
    marginLeft: 6,
    textTransform: 'uppercase',
    verticalAlign: 'middle',
  },
  gramVal: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 14,
    fontWeight: 500,
    color: '#2C2518',
  },
  pctVal: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: '#A89E8A',
  },
  cellInput: {
    width: 70,
    textAlign: 'right',
    background: '#F5F1E8',
    border: '1.5px solid',
    borderRadius: 4,
    color: '#1E1A12',
    fontSize: 13,
    fontFamily: "'DM Mono', monospace",
    padding: '3px 6px',
    outline: 'none',
  },
  barTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  barFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: 1,
  },
  totalRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    background: '#2C2518',
  },
  twoCols: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 16,
  },
  panel: {
    background: '#FFFCF5',
    border: '1px solid rgba(60,45,20,0.13)',
    borderRadius: 8,
    padding: '12px 14px',
  },
  panelTitle: {
    display: 'block',
    fontFamily: "'DM Mono', monospace",
    fontSize: 8,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: '#A89E8A',
    marginBottom: 10,
  },
  pRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  pRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  pLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#7A7060',
  },
  pVal: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    color: '#2C2518',
  },
  eRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  eRow: {},
  eTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 3,
  },
  eName: {
    fontSize: 11,
    fontWeight: 600,
    color: '#7A7060',
  },
  eVal: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    color: '#2C2518',
  },
  eUnit: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    color: '#A89E8A',
  },
  eTrack: {
    height: 3,
    background: '#E5DFD3',
    borderRadius: 2,
    overflow: 'hidden',
  },
  eFill: {
    height: '100%',
    borderRadius: 2,
  },
  footerHint: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    color: '#A89E8A',
    lineHeight: 1.7,
    textAlign: 'center',
    letterSpacing: '0.5px',
  },
};
