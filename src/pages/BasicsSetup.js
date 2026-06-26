import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const YEARS = ['freshman', 'sophomore', 'junior', 'senior', 'grad'];

export default function BasicsSetup() {
  const { user, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.editMode === true;

  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [year, setYear] = useState(profile?.year || '');
  const [major, setMajor] = useState(profile?.major || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('add your name'); return; }
    const ageNum = parseInt(age, 10);
    if (!age || ageNum < 17 || ageNum > 35) { setError('age must be 17–35'); return; }
    if (!year) { setError('pick your year'); return; }
    setSaving(true);

    const updates = {
      name: name.trim(),
      age: ageNum,
      year,
      major: major.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (isEditMode) {
      await supabase.from('profiles').update(updates).eq('id', user.id);
      await refreshProfile();
      navigate('/profile');
    } else {
      await supabase.from('profiles').update({
        ...updates,
        onboarding_step: 'housing',
      }).eq('id', user.id);
      await refreshProfile();
      // router routes step='housing' → /setup/housing
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-inner">
        <div className="setup-header">
          <span className="wordmark-sm">lik</span>
          {!isEditMode && <span className="setup-step-label">step 2 of 5</span>}
        </div>

        <h2 className="setup-title">the basics</h2>
        <p className="setup-sub">who are you?</p>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="field-group">
            <label className="label">name</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="what do people call you?"
              maxLength={50}
            />
          </div>

          <div className="field-row">
            <div className="field-group half">
              <label className="label">age</label>
              <input
                className="input"
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="19"
                min={17}
                max={35}
              />
            </div>
            <div className="field-group half">
              <label className="label">year</label>
              <select
                className="input select"
                value={year}
                onChange={e => setYear(e.target.value)}
              >
                <option value="">select</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="field-group">
            <label className="label">
              major <span style={{ color: 'var(--muted)', textTransform: 'none', letterSpacing: 0, fontSize: '0.8rem' }}>— optional</span>
            </label>
            <input
              className="input"
              value={major}
              onChange={e => setMajor(e.target.value)}
              placeholder="computer science"
              maxLength={80}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'saving...' : isEditMode ? 'save changes' : 'continue →'}
          </button>
        </form>
      </div>
    </div>
  );
}
