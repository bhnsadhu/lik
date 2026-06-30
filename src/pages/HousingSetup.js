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
          onboarding_step: 'quiz',
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
        navigate('/setup/quiz');
      }
    }, 300);
  };

  return (
    <div className="setup-page">
      <div className="setup-inner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 18px 8px' }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#fff' }}>lik</span>
        </div>
        <StepIndicator currentStep={3} onStepClick={(route) => {
          if (isEditMode) navigate(route, { state: { editMode: true } });
          else navigate(route);
        }} />

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
