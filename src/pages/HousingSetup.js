import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import StepIndicator from '../components/StepIndicator';


export default function HousingSetup() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.editMode === true;

  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSelect = (type) => {
    if (saving) return;
    setSelected(type);
    setTimeout(async () => {
      setSaving(true);
      if (isEditMode) {
        await supabase.from('profiles').update({
          housing_type: type,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
        await refreshProfile();
        navigate('/setup/preferences', { state: { returnTo: '/profile' } });
      } else {
        await supabase.from('profiles').update({
          housing_type: type,
          onboarding_step: 'bio',
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
        await refreshProfile();
        navigate('/setup/quiz');
      }
    }, 300);
  };

  return (
    <div className="setup-page">
      <div className="setup-inner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px' }}>
          <span onClick={() => navigate('/setup/basics')} style={{ fontSize: '18px', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 300, width: '24px' }}>←</span>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#fff' }}>lik</span>
          <span style={{ width: '24px' }} />
        </div>
        {!isEditMode && <StepIndicator currentStep={3} onStepClick={(route) => navigate(route)} />}

        <h2 className="setup-title">where are you living?</h2>
        <p className="setup-sub">tap to continue (you can change this later)</p>

        <div className="housing-cards">
          <button
            className={`housing-card${selected === 'dorm' ? ' selected' : ''}`}
            onClick={() => handleSelect('dorm')}
            disabled={saving}
          >
            <span className="housing-card-label">dorm</span>
            <span className="housing-card-sub">university housing</span>
          </button>
          <button
            className={`housing-card${selected === 'apartment' ? ' selected' : ''}`}
            onClick={() => handleSelect('apartment')}
            disabled={saving}
          >
            <span className="housing-card-label">apartment</span>
            <span className="housing-card-sub">off-campus housing</span>
          </button>
        </div>
      </div>
    </div>
  );
}
