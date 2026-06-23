import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { QUIZ_QUESTIONS } from './Quiz';
import BottomNav from '../components/BottomNav';

export default function UserProfile() {
  const { user, profile } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const navigate = useNavigate();

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

  const quizChips = quiz
    ? QUIZ_QUESTIONS.map((q) => {
        const answer = quiz[q.key];
        if (!answer) return null;
        return answer === 'a' ? q.a.label : q.b.label;
      }).filter(Boolean)
    : [];

  const areas = (
    Array.isArray(profile.preferred_area)
      ? profile.preferred_area
      : profile.preferred_area
      ? [profile.preferred_area]
      : []
  ).map((a) => a.toLowerCase());

  const year = profile.year?.toLowerCase();
  const semester = profile.move_in_semester?.toLowerCase();

  return (
    <div className="app-page">
      <div className="app-header">
        <span className="wordmark">lik</span>
      </div>

      <div className="profile-body">
        {photos.length > 0 && (
          <div className="profile-photos">
            <div className="profile-hero">
              <img src={photos[0]} alt={profile.name} className="profile-hero-img" />
            </div>
            {photos.length > 1 && (
              <div className="profile-photo-strip">
                {photos.slice(1).map((url, i) => (
                  <div key={i} className="profile-photo-slot">
                    <img src={url} alt="" className="profile-photo-thumb" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="profile-identity">
          <h2 className="profile-name">
            {profile.name}, {profile.age}
            {year && <span className="profile-year"> · {year}</span>}
          </h2>
        </div>

        {quizChips.length > 0 && (
          <div className="profile-section">
            <p className="label">vibe</p>
            <div className="profile-chips">
              {quizChips.map((label, i) => (
                <span key={i} className="profile-chip">{label}</span>
              ))}
            </div>
          </div>
        )}

        {(profile.budget_min != null || semester) && (
          <div className="profile-section">
            <p className="label">budget</p>
            {profile.budget_min != null && (
              <p className="profile-detail">${profile.budget_min} – ${profile.budget_max} / mo</p>
            )}
            {semester && (
              <p className="profile-detail">{semester}</p>
            )}
          </div>
        )}

        {areas.length > 0 && (
          <div className="profile-section">
            <p className="label">areas</p>
            <div className="profile-chips">
              {areas.map((a, i) => (
                <span key={i} className="profile-chip">{a}</span>
              ))}
            </div>
          </div>
        )}

        <div className="profile-actions">
          <button className="profile-edit-btn" onClick={() => navigate('/setup/profile')}>
            edit profile
          </button>
          <span className="profile-edit-sep">·</span>
          <button
            className="profile-edit-btn"
            onClick={() => navigate('/setup/quiz', { state: { editMode: true } })}
          >
            retake quiz
          </button>
          <span className="profile-edit-sep">·</span>
          <button
            className="profile-edit-btn"
            onClick={() => navigate('/setup/budget', { state: { returnTo: '/profile' } })}
          >
            edit preferences
          </button>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
