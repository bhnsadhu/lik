import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function HousingSetup() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.editMode === true;

  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (type) => {
    if (saving) return;
    setSelected(type);
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
      // router routes step='bio' → /setup/bio
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-inner">
        <div className="setup-header">
          <span className="wordmark-sm">lik</span>
          {!isEditMode && <span className="setup-step-label">step 3 of 5</span>}
        </div>

        <h2 className="setup-title">where are you living?</h2>
        <p className="setup-sub">tap to continue — you can change this later</p>

        <div className="housing-cards">
          <button
            className={`housing-card${selected === 'dorm' ? ' selected' : ''}`}
            onClick={() => handleSelect('dorm')}
            disabled={saving}
          >
            <span className="housing-card-emoji">🏠</span>
            <span className="housing-card-label">dorm</span>
            <span className="housing-card-sub">university housing</span>
          </button>
          <button
            className={`housing-card${selected === 'apartment' ? ' selected' : ''}`}
            onClick={() => handleSelect('apartment')}
            disabled={saving}
          >
            <span className="housing-card-emoji">🏢</span>
            <span className="housing-card-label">apartment</span>
            <span className="housing-card-sub">off-campus housing</span>
          </button>
        </div>
      </div>
    </div>
  );
}
