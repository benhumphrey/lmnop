import { useState, useCallback } from 'react';
import { PALETTE } from './data.js';

function makeBlankRow() {
  return { id: Math.random().toString(36).slice(2), name: '', gramsRaw: '', isBase: false };
}

export default function RecipeModal({ mode, recipe, onSave, onDelete, onClose }) {
  const isEdit = mode === 'edit';

  const [name, setName] = useState(isEdit ? recipe.name : '');
  const [accent, setAccent] = useState(isEdit ? recipe.accent : '');
  const [testedServings, setTestedServings] = useState('40');

  const buildRows = () => {
    if (isEdit) {
      return recipe.ingredients.map((ing, i) => ({
        id: i.toString(),
        name: ing.name,
        gramsRaw: formatForInput(ing.grams40),
        isBase: !!ing.isBase,
      }));
    }
    return [
      { id: '0', name: 'Sodium Chloride', gramsRaw: '', isBase: true },
      { id: '1', name: 'Potassium Chloride', gramsRaw: '', isBase: true },
      { id: '2', name: 'Magnesium Malate', gramsRaw: '', isBase: true },
      makeBlankRow(),
    ];
  };

  const [rows, setRows] = useState(buildRows);

  function formatForInput(val) {
    if (val >= 100) return val.toFixed(1);
    if (val >= 1)   return val.toFixed(3);
    return val.toFixed(4);
  }

  const updateRow = useCallback((id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const removeRow = useCallback((id) => {
    setRows(prev => prev.filter(r => r.id !== id));
  }, []);

  const addRow = useCallback(() => {
    setRows(prev => [...prev, makeBlankRow()]);
  }, []);

  const handleSave = () => {
    if (!name.trim() || !accent) return;

    const srv = parseFloat(testedServings) || 40;
    // Edit mode: rows are already at 40-serving base (pre-filled from grams40)
    // Create mode: normalize from testedServings → 40
    const scale = isEdit ? 1 : (40 / srv);

    const ingredients = rows
      .filter(r => r.name.trim() && r.gramsRaw !== '')
      .map(r => ({
        name: r.name.trim(),
        grams40: parseFloat(r.gramsRaw) * scale,
        isBase: !!r.isBase,
      }));

    if (ingredients.length < 3) return;

    const saved = {
      id: isEdit ? recipe.id : (name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()),
      name: name.trim(),
      accent,
      ingredients,
    };

    onSave(saved);
  };

  const s = styles;

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <span style={s.title}>{isEdit ? 'Edit Recipe' : 'New Recipe'}</span>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={s.body}>
          {/* Name */}
          <div style={s.section}>
            <span style={s.fieldLabel}>Recipe Name</span>
            <input
              style={s.input}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Watermelon Mint"
            />
          </div>

          {/* Color */}
          <div style={s.section}>
            <span style={s.fieldLabel}>Color</span>
            <div style={s.colorRow}>
              <div style={{
                ...s.swatchPreview,
                background: accent || '#E5DFD3',
                borderStyle: accent ? 'solid' : 'dashed',
              }} />
              <div style={s.palette}>
                {PALETTE.map(color => (
                  <div
                    key={color}
                    onClick={() => setAccent(color)}
                    style={{
                      ...s.colorDot,
                      background: color,
                      outline: accent === color ? '2px solid #2C2518' : '2px solid transparent',
                      outlineOffset: '1px',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Serving count (new recipe only) */}
          {!isEdit && (
            <div style={s.section}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={s.fieldLabel}>As-tested servings</span>
                <input
                  style={{ ...s.input, width: 72, textAlign: 'center' }}
                  type="number"
                  value={testedServings}
                  onChange={e => setTestedServings(e.target.value)}
                  placeholder="e.g. 5"
                />
              </div>
              <div style={s.hint}>
                Enter gram amounts from your test batch. The app normalizes to the 40-serving base on save.
              </div>
            </div>
          )}

          {/* Ingredients */}
          <div style={s.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={s.fieldLabel}>Ingredients</span>
              {isEdit && <span style={s.hint}>Amounts shown at 40-serving base.</span>}
            </div>

            <div style={s.ingTable}>
              <div style={s.ingHead}>
                <span style={{ flex: 1 }}>Ingredient</span>
                <span style={{ width: 72, textAlign: 'right' }}>Grams</span>
                <span style={{ width: 26 }} />
              </div>
              {rows.map(row => (
                <div key={row.id} style={s.ingRow}>
                  <input
                    style={{ ...s.ingNameInput, ...(row.isBase ? s.ingNameInputLocked : {}) }}
                    type="text"
                    value={row.name}
                    disabled={row.isBase}
                    onChange={e => updateRow(row.id, 'name', e.target.value)}
                    placeholder="Ingredient name…"
                  />
                  <input
                    style={s.ingGInput}
                    type="number"
                    step="any"
                    value={row.gramsRaw}
                    onChange={e => updateRow(row.id, 'gramsRaw', e.target.value)}
                    placeholder="g"
                  />
                  {row.isBase
                    ? <div style={s.lockIcon} title="Base electrolyte — cannot remove">⊘</div>
                    : <button style={s.removeBtn} onClick={() => removeRow(row.id)}>×</button>
                  }
                </div>
              ))}
            </div>

            <button style={s.addIngBtn} onClick={addRow}>+ Add ingredient</button>

            {!isEdit && (
              <div style={s.noteBox}>
                NaCl, KCl, and MgMal are pre-set as base electrolytes and cannot be removed.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <div>
            {isEdit && (
              <button style={s.dangerBtn} onClick={() => onDelete(recipe.id)}>Delete recipe</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={s.ghostBtn} onClick={onClose}>Cancel</button>
            <button
              style={{ ...s.primaryBtn, opacity: (!name.trim() || !accent) ? 0.5 : 1 }}
              onClick={handleSave}
              disabled={!name.trim() || !accent}
            >
              {isEdit ? 'Save changes' : 'Create recipe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28,22,14,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '16px',
  },
  modal: {
    background: '#F5F1E8',
    borderRadius: 10,
    border: '1px solid rgba(60,45,20,0.2)',
    width: '100%',
    maxWidth: 440,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    background: '#2C2518',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20,
    color: '#F5F0E4',
    letterSpacing: 1,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(245,240,228,0.45)',
    fontSize: 22,
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 4px',
  },
  body: {
    padding: '14px 16px',
    overflowY: 'auto',
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  fieldLabel: {
    display: 'block',
    fontFamily: "'DM Mono', monospace",
    fontSize: 8,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: '#A89E8A',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 36,
    border: '1px solid rgba(60,45,20,0.22)',
    borderRadius: 5,
    background: '#FFFCF5',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: '#1E1A12',
    padding: '0 10px',
    outline: 'none',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  swatchPreview: {
    width: 36,
    height: 36,
    borderRadius: 5,
    border: '1px solid rgba(60,45,20,0.22)',
    flexShrink: 0,
  },
  palette: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 5,
    background: '#FFFCF5',
    border: '1px solid rgba(60,45,20,0.15)',
    borderRadius: 6,
    padding: 7,
    flex: 1,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 4,
    cursor: 'pointer',
  },
  ingTable: {
    border: '1px solid rgba(60,45,20,0.13)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  ingHead: {
    display: 'flex',
    padding: '5px 10px',
    background: '#E5DFD3',
    fontFamily: "'DM Mono', monospace",
    fontSize: 8,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: '#A89E8A',
    gap: 6,
  },
  ingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderTop: '1px solid rgba(60,45,20,0.1)',
    background: '#FFFCF5',
  },
  ingNameInput: {
    flex: 1,
    height: 30,
    border: '1px solid rgba(60,45,20,0.18)',
    borderRadius: 4,
    background: '#F5F1E8',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: '#1E1A12',
    padding: '0 8px',
    outline: 'none',
  },
  ingNameInputLocked: {
    color: '#7A7060',
    background: '#EDE9DF',
  },
  ingGInput: {
    width: 72,
    height: 30,
    border: '1px solid rgba(60,45,20,0.18)',
    borderRadius: 4,
    background: '#F5F1E8',
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: '#1E1A12',
    textAlign: 'right',
    padding: '0 6px',
    outline: 'none',
  },
  lockIcon: {
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#E5DFD3',
    borderRadius: 3,
    fontSize: 11,
    color: '#7A7060',
    flexShrink: 0,
    fontFamily: "'DM Mono', monospace",
  },
  removeBtn: {
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    color: '#A89E8A',
    fontSize: 16,
    cursor: 'pointer',
    flexShrink: 0,
    borderRadius: 3,
  },
  addIngBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    padding: '7px 0',
    background: 'transparent',
    border: '1px dashed rgba(60,45,20,0.25)',
    borderRadius: 5,
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: '#7A7060',
    cursor: 'pointer',
    marginBottom: 8,
  },
  noteBox: {
    background: '#EDE9DF',
    borderRadius: 5,
    padding: '8px 10px',
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    color: '#A89E8A',
    lineHeight: 1.6,
  },
  hint: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    color: '#A89E8A',
    lineHeight: 1.6,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px 14px',
    borderTop: '1px solid rgba(60,45,20,0.1)',
    flexShrink: 0,
    gap: 8,
  },
  dangerBtn: {
    height: 34,
    padding: '0 14px',
    border: '1px solid rgba(120,30,20,0.3)',
    borderRadius: 5,
    background: 'transparent',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: '#7A3020',
    cursor: 'pointer',
  },
  ghostBtn: {
    height: 34,
    padding: '0 14px',
    border: '1px solid rgba(60,45,20,0.25)',
    borderRadius: 5,
    background: 'transparent',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: '#7A7060',
    cursor: 'pointer',
  },
  primaryBtn: {
    height: 34,
    padding: '0 18px',
    borderRadius: 5,
    background: '#2C2518',
    border: 'none',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: '#F5F0E4',
    cursor: 'pointer',
    letterSpacing: '0.5px',
  },
};
