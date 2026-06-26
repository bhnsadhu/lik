import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const PLACEHOLDERS = [
  'early bird who keeps things clean',
  'night owl, chill, loves cooking',
  'focused student, quiet after 10pm',
  'social but respectful of quiet time',
  'i make coffee for two if you want',
];

const BIO_LIMIT = 150;

export default function BioSetup() {
  const { user, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.editMode === true;

  const [bio, setBio] = useState(profile?.bio || '');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  const save = async (value) => {
    if (saving) return;
    setSaving(true);
    const trimmed = value?.trim() || null;

    if (isEditMode) {
      await supabase.from('profiles').update({
        bio: trimmed,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      await refreshProfile();
      navigate('/profile');
    } else {
      await supabase.from('profiles').update({
        bio: trimmed,
        onboarding_step: 'quiz',
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      await refreshProfile();
      // router routes step='quiz' → /setup/quiz
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-inner">
        <div className="setup-header">
          <span className="wordmark-sm">lik</span>
          {!isEditMode && <span className="setup-step-label">step 4 of 5</span>}
        </div>

        <h2 className="setup-title">say something</h2>
        <p className="setup-sub">a line about you — totally optional</p>

        <div className="bio-wrap">
          <textarea
            className="bio-input"
            value={bio}
            onChange={e => setBio(e.target.value.slice(0, BIO_LIMIT))}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            rows={4}
          />
          <span className="bio-count">{bio.length}/{BIO_LIMIT}</span>
        </div>

        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn-primary" onClick={() => save(bio)} disabled={saving}>
            {saving ? 'saving...' : 'continue →'}
          </button>
          {!saving && (
            <button className="btn-ghost" onClick={() => save('')}>
              skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
