import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';

function timeSince(dateStr) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(ms / 60000);
  const hr = Math.floor(ms / 3600000);
  const day = Math.floor(ms / 86400000);
  if (min < 1) return 'just now';
  if (hr < 1) return `${min}m ago`;
  if (day < 1) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('matches')
        .select(`
          id,
          created_at,
          user1:user1_id(id, name, age, year, photos),
          user2:user2_id(id, name, age, year, photos)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      setMatches(data ?? []);
      setLoading(false);
    }
    load();
  }, [user.id]);

  const getOther = (match) =>
    match.user1?.id === user.id ? match.user2 : match.user1;

  return (
    <div className="app-page">
      <div className="app-header">
        <span className="wordmark">lik</span>
      </div>

      {loading ? (
        <div className="matches-body">
          <p className="muted center-text">loading your liks...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="matches-empty-wrap">
          <div className="empty-state">
            <p className="empty-emoji">💫</p>
            <p className="empty-title">no liks yet</p>
            <p className="muted">go discover some people — your match is out there</p>
          </div>
        </div>
      ) : (
        <div className="matches-body">
          {matches.map((match) => {
            const other = getOther(match);
            if (!other) return null;
            return (
              <button
                key={match.id}
                className="match-row"
                onClick={() => navigate(`/chat/${match.id}`)}
              >
                <div className="match-avatar">
                  {other.photos?.[0] ? (
                    <img src={other.photos[0]} alt={other.name} />
                  ) : (
                    <div className="match-avatar-placeholder">🎓</div>
                  )}
                </div>
                <div className="match-row-info">
                  <p className="match-row-name">{other.name}</p>
                  <p className="match-row-meta">
                    {other.age} · {other.year} · {timeSince(match.created_at)}
                  </p>
                </div>
                <span className="match-row-arrow">→</span>
              </button>
            );
          })}
        </div>
      )}

      <BottomNav active="matches" />
    </div>
  );
}
