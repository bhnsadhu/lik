import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import StepIndicator from '../components/StepIndicator';

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

const DORMS = [
  'ISR', 'PAR', 'FAR', 'Allen', 'iHotel', 'LAR',
  'Wardall', 'Snyder', 'Lundgren', 'Barton', 'no preference',
];

export default function PreferencesSetup() {
  const { user, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo;
  const isEditMode = !!(returnTo || location.state?.editMode);

  const housingType = profile?.housing_type;

  const [semester, setSemester] = useState(profile?.move_in_semester || '');
  const [areas, setAreas] = useState(profile?.preferred_area || []);
  const [dormPrefs, setDormPrefs] = useState(profile?.dorm_preference || []);
  const [budgetMin, setBudgetMin] = useState(
    profile?.budget_min != null ? String(profile.budget_min) : ''
  );
  const [budgetMax, setBudgetMax] = useState(
    profile?.budget_max != null ? String(profile.budget_max) : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleArea = (a) => {
    if (a === 'anywhere works') {
      setAreas(prev => prev.includes('anywhere works') ? [] : ['anywhere works']);
    } else {
      setAreas(prev => {
        const without = prev.filter(x => x !== 'anywhere works');
        return without.includes(a) ? without.filter(x => x !== a) : [...without, a];
      });
    }
  };

  const toggleDorm = (d) => {
    if (d === 'no preference') {
      setDormPrefs(prev => prev.includes('no preference') ? [] : ['no preference']);
    } else {
      setDormPrefs(prev => {
        const without = prev.filter(x => x !== 'no preference');
        return without.includes(d) ? without.filter(x => x !== d) : [...without, d];
      });
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!semester) { setError('pick a move-in semester'); return; }

    if (housingType === 'apartment' || !housingType) {
      if (!budgetMin || !budgetMax) { setError('set your budget range'); return; }
      if (areas.length === 0) { setError('pick at least one area'); return; }
      const min = parseInt(budgetMin, 10);
      const max = parseInt(budgetMax, 10);
      if (min > max) { setError('max budget ≥ min'); return; }
    }

    setSaving(true);

    const updates = {
      move_in_semester: semester,
      onboarding_step: 'done',
      updated_at: new Date().toISOString(),
    };

    if (housingType === 'dorm') {
      updates.dorm_preference = dormPrefs;
    } else {
      updates.budget_min = parseInt(budgetMin, 10);
      updates.budget_max = parseInt(budgetMax, 10);
      updates.preferred_area = areas;
    }

    const { error: err } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (err) {
      setError('save failed · try again');
      setSaving(false);
      return;
    }

    await refreshProfile();
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate('/feed', { replace: true });
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-inner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px' }}>
          <span onClick={() => navigate('/setup/quiz')} style={{ fontSize: '18px', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 300, padding: '8px', margin: '-8px' }}>←</span>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#fff' }}>lik</span>
          <span style={{ width: '24px' }} />
        </div>
        {!isEditMode && <StepIndicator currentStep={5} onStepClick={(route) => navigate(route)} />}

        <h2 className="setup-title">
          {housingType === 'dorm' ? 'dorm details' : 'your preferences'}
        </h2>
        <p className="setup-sub">
          {housingType === 'dorm' ? 'when & where?' : 'budget & location'}
        </p>

        <div className="setup-form">
          {(housingType === 'apartment' || !housingType) && (
            <div className="field-group">
              <label className="label">monthly budget (your share)</label>
              <div className="budget-row">
                <div className="budget-input">
                  <span className="budget-symbol">$</span>
                  <input
                    className="input"
                    type="number"
                    value={budgetMin}
                    onChange={e => setBudgetMin(e.target.value)}
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
                    onChange={e => setBudgetMax(e.target.value)}
                    placeholder="max"
                    min={0}
                    max={5000}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="field-group">
            <label className="label">move-in semester</label>
            <div className="chip-group">
              {SEMESTERS.map(s => (
                <button
                  key={s}
                  type="button"
                  className={`chip${semester === s ? ' active' : ''}`}
                  onClick={() => setSemester(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {housingType === 'dorm' && (
            <div className="field-group">
              <label className="label">preferred dorm</label>
              <div className="chip-group">
                {DORMS.map(d => (
                  <button
                    key={d}
                    type="button"
                    className={`chip${dormPrefs.includes(d) ? ' active' : ''}`}
                    onClick={() => toggleDorm(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(housingType === 'apartment' || !housingType) && (
            <div className="field-group">
              <label className="label">preferred area</label>
              <div className="chip-group">
                {AREAS.map(a => (
                  <button
                    key={a}
                    type="button"
                    className={`chip${areas.includes(a) ? ' active' : ''}`}
                    onClick={() => toggleArea(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="error-text">{error}</p>}
        </div>
      </div>

      <div style={{ position: 'sticky', bottom: 0, background: '#0A0E12', padding: '12px 18px 28px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSubmit} style={{
          fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600,
          background: '#3DDCFF', color: '#0A0E12',
          borderRadius: 20, padding: '9px 20px', border: 'none',
          cursor: saving ? 'default' : 'pointer',
          pointerEvents: saving ? 'none' : 'auto',
        }}>
          {saving ? 'saving...' : isEditMode ? 'save changes' : "let's find your people →"}
        </button>
      </div>
    </div>
  );
}
