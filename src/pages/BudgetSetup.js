import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const SEMESTERS = ['fall 2026', 'spring 2027', 'fall 2027', 'spring 2028'];

const AREAS = [
  'campustown',
  'green street area',
  'downtown champaign',
  'north champaign',
  'south champaign',
  'urbana',
  'savoy',
  'anywhere works',
];

export default function BudgetSetup() {
  const { user, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.returnTo != null;
  const [budgetMin, setBudgetMin] = useState(profile?.budget_min != null ? String(profile.budget_min) : '');
  const [budgetMax, setBudgetMax] = useState(profile?.budget_max != null ? String(profile.budget_max) : '');
  const [semester, setSemester] = useState(profile?.move_in_semester || '');
  const [areas, setAreas] = useState(profile?.preferred_area || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleArea = (a) => {
    if (a === 'anywhere works') {
      // mutually exclusive — selecting it clears specific picks, and vice versa
      setAreas((prev) => (prev.includes('anywhere works') ? [] : ['anywhere works']));
    } else {
      setAreas((prev) => {
        const withoutAnywhere = prev.filter((x) => x !== 'anywhere works');
        return withoutAnywhere.includes(a)
          ? withoutAnywhere.filter((x) => x !== a)
          : [...withoutAnywhere, a];
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!budgetMin || !budgetMax) { setError('set your budget range'); return; }
    if (!semester) { setError('pick a move-in semester'); return; }
    if (areas.length === 0) { setError('pick at least one area'); return; }

    const min = parseInt(budgetMin, 10);
    const max = parseInt(budgetMax, 10);

    if (min < 0 || max < 0) { setError('budget must be positive'); return; }
    if (min > max) { setError('max budget should be ≥ min'); return; }

    setSaving(true);

    const { error: err } = await supabase
      .from('profiles')
      .update({
        budget_min: min,
        budget_max: max,
        move_in_semester: semester,
        preferred_area: areas,
        onboarding_step: 'done',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (err) {
      const msg =
        err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('network')
          ? "couldn't reach the server · check your connection"
          : err.status >= 500
          ? 'server hiccup · try again in a moment'
          : 'save failed · try again';
      setError(msg);
      setSaving(false);
      return;
    }

    await refreshProfile();
    const returnTo = location.state?.returnTo;
    if (returnTo) {
      navigate(returnTo);
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-inner">
        <div className="setup-header">
          <span className="wordmark-sm">lik</span>
          {!isEditMode && (
            <div className="step-dots">
              <span className="dot done" />
              <span className="dot done" />
              <span className="dot active" />
            </div>
          )}
        </div>

        <h2 className="setup-title">almost there</h2>
        <p className="setup-sub">budget & move-in details</p>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="field-group">
            <label className="label">monthly budget (your share)</label>
            <div className="budget-row">
              <div className="budget-input">
                <span className="budget-symbol">$</span>
                <input
                  className="input"
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="min"
                  min={0}
                  max={5000}
                />
              </div>
              <span className="budget-to">to</span>
              <div className="budget-input">
                <span className="budget-symbol">$</span>
                <input
                  className="input"
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="max"
                  min={0}
                  max={5000}
                />
              </div>
            </div>
            <p className="hint">per month, your share of rent</p>
          </div>

          <div className="field-group">
            <label className="label">move-in semester</label>
            <div className="chip-group">
              {SEMESTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip ${semester === s ? 'active' : ''}`}
                  onClick={() => setSemester(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label className="label">preferred area</label>
            <div className="chip-group">
              {AREAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`chip ${areas.includes(a) ? 'active' : ''}`}
                  onClick={() => toggleArea(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'saving...' : isEditMode ? 'save changes' : "let's find your people →"}
          </button>
        </form>
      </div>
    </div>
  );
}
