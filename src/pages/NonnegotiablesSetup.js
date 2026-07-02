import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NONNEGOTIABLES } from '../lib/compatibility';
import StepIndicator from '../components/StepIndicator';
import Wordmark from '../components/Wordmark';

export default function NonnegotiablesSetup() {
  const { user, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.editMode === true;

  const [selected, setSelected] = useState(profile?.nonnegotiables || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = (key) => {
    setSelected(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      // picking one side of a contradiction drops the other side
      const def = NONNEGOTIABLES.find(n => n.key === key);
      const without = prev.filter(k => !def?.conflictsWith?.includes(k));
      return [...without, key];
    });
  };

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    const updates = {
      nonnegotiables: selected,
      updated_at: new Date().toISOString(),
    };
    const { error: err } = await supabase
      .from('profiles')
      .update(isEditMode ? updates : { ...updates, onboarding_step: 'preferences' })
      .eq('id', user.id);
    if (err) {
      setError('save failed · try again');
      setSaving(false);
      return;
    }
    if (isEditMode) {
      await refreshProfile();
      navigate('/profile');
    } else {
      refreshProfile();
      navigate('/setup/preferences');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 18px 8px' }}>
        <Wordmark size={18} />
      </div>

      <StepIndicator currentStep={5} onStepClick={(route) => {
        if (isEditMode) navigate(route, { state: { editMode: true } });
        else navigate(route);
      }} />

      <p style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '20px', color: 'var(--ink)', margin: 0, padding: '10px 18px 3px' }}>
        your nonnegotiables
      </p>
      <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300, fontSize: '11px', color: 'var(--muted)', margin: 0, padding: '0 18px 16px' }}>
        hard lines only · skip anything you can flex on
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '0 18px' }}>
        {NONNEGOTIABLES.map(({ key }) => {
          const on = selected.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: on ? 400 : 300,
                fontSize: '13px',
                minHeight: '44px',
                padding: '12px 18px',
                borderRadius: '20px',
                border: on ? '1px solid var(--teal)' : '1px solid var(--cream-2)',
                background: on ? 'rgba(0,201,177,0.15)' : '#ffffff',
                color: on ? 'var(--teal-dark)' : 'var(--ink)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {key}
            </button>
          );
        })}
      </div>

      <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300, fontSize: '10px', color: 'var(--muted)', padding: '14px 18px 0', margin: 0 }}>
        {selected.length === 0
          ? 'none is a valid answer · easygoing is a vibe too'
          : `${selected.length} set · these weigh heaviest in your matches`}
      </p>

      {error && (
        <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300, fontSize: '11px', color: 'var(--danger)', textAlign: 'center', margin: '12px 0 0' }}>{error}</p>
      )}

      <div style={{ position: 'sticky', bottom: 0, background: 'var(--cream)', display: 'flex', justifyContent: 'flex-end', padding: '12px 18px 28px' }}>
        <button
          onClick={handleContinue}
          disabled={saving}
          style={{
            background: 'var(--teal)',
            color: '#023d35',
            fontFamily: "'Outfit', sans-serif", fontSize: '12px', fontWeight: 600,
            padding: '14px 22px', borderRadius: '14px', border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >{saving ? 'saving...' : isEditMode ? 'save changes' : 'next →'}</button>
      </div>
    </div>
  );
}
