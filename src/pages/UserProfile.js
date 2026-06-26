import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { QUIZ_QUESTIONS } from './Quiz';
import BottomNav from '../components/BottomNav';

export default function UserProfile() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showEditSheet, setShowEditSheet] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setQuiz(data);
    }
    load();
  }, [user.id]);

  if (!profile) return null;

  const photos = profile.photos || [];

  const vibeChips = quiz
    ? QUIZ_QUESTIONS.map(q => {
        const ans = quiz[q.key];
        if (!ans) return null;
        const opt = ans === 'a' ? q.a : q.b;
        return `${opt.emoji} ${opt.label}`;
      }).filter(Boolean)
    : [];

  const areas = Array.isArray(profile.preferred_area)
    ? profile.preferred_area.map(a => a.toLowerCase())
    : [];

  const dorms = Array.isArray(profile.dorm_preference) ? profile.dorm_preference : [];

  const handlePhotoTap = (e) => {
    if (photos.length < 2) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.33) {
      setPhotoIdx(i => Math.max(0, i - 1));
    } else {
      setPhotoIdx(i => Math.min(photos.length - 1, i + 1));
    }
  };

  const editOptions = [
    { label: 'edit photos', action: () => navigate('/setup/photos', { state: { returnTo: '/profile' } }) },
    { label: 'edit basics', action: () => navigate('/setup/basics', { state: { editMode: true } }) },
    { label: 'edit bio', action: () => navigate('/setup/bio', { state: { editMode: true } }) },
    { label: 'retake quiz', action: () => navigate('/setup/quiz', { state: { editMode: true } }) },
    { label: 'edit preferences', action: () => navigate('/setup/preferences', { state: { returnTo: '/profile' } }) },
  ];

  return (
    <div className="profile-page">
      {/* Hero */}
      <div className="profile-hero" onClick={handlePhotoTap}>
        {photos.length > 0 ? (
          <img
            className="profile-hero-img"
            src={photos[photoIdx]}
            alt={profile.name}
          />
        ) : (
          <div className="profile-hero-placeholder">👤</div>
        )}

        {/* Photo bars */}
        {photos.length > 1 && (
          <div className="profile-photo-bars">
            {photos.map((_, i) => (
              <div key={i} className={`profile-photo-bar${i === photoIdx ? ' active' : ''}`} />
            ))}
          </div>
        )}

        {/* Edit button */}
        <button
          className="profile-edit-fab pressable"
          onClick={e => { e.stopPropagation(); setShowEditSheet(true); }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2.5l2.5 2.5L5 15.5H2.5V13L13 2.5z" />
          </svg>
        </button>

        {/* Gradient */}
        <div className="profile-hero-gradient" />

        {/* Name on gradient */}
        <div className="profile-hero-info">
          <h2 className="profile-hero-name">
            {profile.name}, {profile.age}
          </h2>
          <p className="profile-hero-meta">
            {profile.year?.toLowerCase()}
            {profile.major ? ` · ${profile.major}` : ''}
          </p>
          {profile.bio && (
            <p className="profile-hero-bio">"{profile.bio}"</p>
          )}
        </div>
      </div>

      {/* Scrollable sections */}
      <div className="profile-scroll">
        {profile.housing_type && (
          <div className="profile-section">
            <p className="label">looking for</p>
            <span className={`housing-badge ${profile.housing_type}`}>
              {profile.housing_type === 'dorm' ? '🏠 dorm' : '🏢 apartment'}
            </span>
          </div>
        )}

        {vibeChips.length > 0 && (
          <div className="profile-section">
            <p className="label">vibe</p>
            <div className="profile-chips">
              {vibeChips.map((c, i) => (
                <span key={i} className="profile-chip">{c}</span>
              ))}
            </div>
          </div>
        )}

        {profile.move_in_semester && (
          <div className="profile-section">
            <p className="label">move-in</p>
            <p className="profile-detail">{profile.move_in_semester}</p>
          </div>
        )}

        {profile.housing_type === 'apartment' && profile.budget_min != null && (
          <div className="profile-section">
            <p className="label">budget</p>
            <p className="profile-detail">${profile.budget_min} – ${profile.budget_max}/mo</p>
          </div>
        )}

        {profile.housing_type === 'apartment' && areas.length > 0 && (
          <div className="profile-section">
            <p className="label">areas</p>
            <div className="profile-chips">
              {areas.map((a, i) => <span key={i} className="profile-chip">{a}</span>)}
            </div>
          </div>
        )}

        {profile.housing_type === 'dorm' && dorms.length > 0 && (
          <div className="profile-section">
            <p className="label">dorm preference</p>
            <div className="profile-chips">
              {dorms.map((d, i) => <span key={i} className="profile-chip">{d}</span>)}
            </div>
          </div>
        )}
      </div>

      <BottomNav active="profile" />

      {/* Edit bottom sheet */}
      <AnimatePresence>
        {showEditSheet && (
          <>
            <motion.div
              className="edit-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditSheet(false)}
            />
            <motion.div
              className="edit-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <div className="edit-sheet-handle" />
              {editOptions.map(({ label, action }) => (
                <button
                  key={label}
                  className="edit-sheet-btn pressable"
                  onClick={() => { setShowEditSheet(false); action(); }}
                >
                  {label}
                </button>
              ))}
              <button
                className="edit-sheet-cancel pressable"
                onClick={() => setShowEditSheet(false)}
              >
                cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
