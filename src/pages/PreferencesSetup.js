import { useState, useEffect } from 'react';
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

const LABEL_STYLE = {
  fontFamily: "'Outfit', sans-serif",
  fontWeight: 300,
  fontSize: '9px',
  color: 'rgba(255,255,255,0.28)',
  letterSpacing: '0.05em',
};

export default function PreferencesSetup() {
  const { user, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo;
  const isEditMode = !!(returnTo || location.state?.editMode);

  const housingType = profile?.housing_type;

  useEffect(() => {
    if (profile && !profile.housing_type) {
      navigate('/setup/housing');
    }
  }, [profile, navigate]);

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

  if (!profile || housingType === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0E12' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 18px 8px' }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#fff' }}>lik</span>
        </div>
        {!isEditMode && <StepIndicator currentStep={5} onStepClick={(route) => navigate(route)} />}
      </div>
    );
  }

  const isApartment = housingType === 'apartment';
  const isDorm = housingType === 'dorm';

  const budgetValid = isApartment ? (!!budgetMin && !!budgetMax) : true;
  const areaValid = isApartment ? areas.length > 0 : true;
  const isValid = !!semester && budgetValid && areaValid && !saving;

  const handleSubmit = async () => {
    setError('');
    if (!semester) { setError('pick a move-in semester'); return; }

    if (isApartment) {
      if (!budgetMin || !budgetMax) { setError('set your budget range'); return; }
      if (areas.length === 0) { setError('pick at least one area'); return; }
      const min = parseInt(budgetMin, 10);
      const max = parseInt(budgetMax, 10);
      if (min > max) { setError('max budget must be higher than min'); return; }
    }

    setSaving(true);

    const updates = {
      move_in_semester: semester,
      onboarding_step: 'done',
      updated_at: new Date().toISOString(),
    };

    if (isDorm) {
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
    <div style={{ minHeight: '100vh', background: '#0A0E12', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 18px 8px' }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#fff' }}>lik</span>
      </div>

      {!isEditMode && <StepIndicator currentStep={5} onStepClick={(route) => navigate(route)} />}

      {/* Title */}
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#fff', margin: 0, padding: '10px 18px 3px' }}>
        your preferences
      </p>
      <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300, fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0, padding: '0 18px 16px' }}>
        budget &amp; location
      </p>

      {/* Budget */}
      {isApartment && (
        <>
          <p style={{ ...LABEL_STYLE, margin: 0, padding: '0 18px', marginBottom: '8px' }}>
            monthly budget · your share
          </p>
          <div style={{ display: 'flex', gap: '16px', padding: '0 18px', marginBottom: '18px' }}>
            <input
              type="number"
              placeholder="$ min"
              value={budgetMin}
              onChange={e => setBudgetMin(e.target.value)}
              min={0}
              max={5000}
              style={{
                flex: 1, border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', padding: '8px 0', fontSize: '12px',
                color: '#fff', fontFamily: "'Outfit', sans-serif", fontWeight: 300, outline: 'none',
              }}
            />
            <input
              type="number"
              placeholder="$ max"
              value={budgetMax}
              onChange={e => setBudgetMax(e.target.value)}
              min={0}
              max={5000}
              style={{
                flex: 1, border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', padding: '8px 0', fontSize: '12px',
                color: '#fff', fontFamily: "'Outfit', sans-serif", fontWeight: 300, outline: 'none',
              }}
            />
          </div>
        </>
      )}

      {/* Move-in semester */}
      <p style={{ ...LABEL_STYLE, margin: 0, padding: '0 18px', marginBottom: '8px' }}>
        move-in semester
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '0 18px', marginBottom: '18px' }}>
        {SEMESTERS.map(sem => (
          <div
            key={sem}
            onClick={() => setSemester(sem)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0', cursor: 'pointer' }}
          >
            <div style={{
              width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
              background: semester === sem ? '#3DDCFF' : 'rgba(255,255,255,0.15)',
            }} />
            <span style={{
              fontSize: '11px', fontWeight: 300, fontFamily: "'Outfit', sans-serif",
              color: semester === sem ? '#3DDCFF' : 'rgba(255,255,255,0.3)',
            }}>{sem}</span>
          </div>
        ))}
      </div>

      {/* Preferred dorm (dorm path) */}
      {isDorm && (
        <>
          <p style={{ ...LABEL_STYLE, margin: 0, padding: '0 18px', marginBottom: '8px' }}>
            preferred dorm
          </p>
          <div>
            {DORMS.map(d => (
              <div
                key={d}
                onClick={() => toggleDorm(d)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
                }}
              >
                <span style={{
                  fontSize: '12px',
                  fontWeight: dormPrefs.includes(d) ? 400 : 300,
                  fontFamily: "'Outfit', sans-serif",
                  color: dormPrefs.includes(d) ? '#3DDCFF' : 'rgba(255,255,255,0.35)',
                }}>{d}</span>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0,
                  border: dormPrefs.includes(d) ? '1px solid #3DDCFF' : '1px solid rgba(255,255,255,0.15)',
                  background: dormPrefs.includes(d) ? '#3DDCFF' : 'transparent',
                }} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Preferred area (apartment path) */}
      {isApartment && (
        <>
          <p style={{ ...LABEL_STYLE, margin: 0, padding: '0 18px', marginBottom: '8px' }}>
            preferred area
          </p>
          <div>
            {AREAS.map(area => (
              <div
                key={area}
                onClick={() => toggleArea(area)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
                }}
              >
                <span style={{
                  fontSize: '12px',
                  fontWeight: areas.includes(area) ? 400 : 300,
                  fontFamily: "'Outfit', sans-serif",
                  color: areas.includes(area) ? '#3DDCFF' : 'rgba(255,255,255,0.35)',
                }}>{area}</span>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0,
                  border: areas.includes(area) ? '1px solid #3DDCFF' : '1px solid rgba(255,255,255,0.15)',
                  background: areas.includes(area) ? '#3DDCFF' : 'transparent',
                }} />
              </div>
            ))}
          </div>
        </>
      )}

      {error && (
        <p style={{
          fontFamily: "'Outfit', sans-serif", fontWeight: 300, fontSize: '11px',
          color: '#FF6B6B', textAlign: 'center', margin: '12px 0 0',
        }}>{error}</p>
      )}

      {/* Bottom bar */}
      <div style={{ position: 'sticky', bottom: 0, background: '#0A0E12', display: 'flex', justifyContent: 'flex-end', padding: '12px 18px 28px' }}>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          style={{
            background: isValid ? '#3DDCFF' : 'rgba(61,220,255,0.15)',
            color: isValid ? '#0A0E12' : 'rgba(61,220,255,0.35)',
            fontFamily: "'Outfit', sans-serif", fontSize: '12px', fontWeight: 600,
            padding: '9px 20px', borderRadius: '20px', border: 'none',
            cursor: isValid ? 'pointer' : 'not-allowed',
          }}
        >{saving ? 'saving...' : isEditMode ? 'save changes' : "let's find your people →"}</button>
      </div>
    </div>
  );
}
