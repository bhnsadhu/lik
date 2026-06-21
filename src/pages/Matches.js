import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';

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
        <h1 className="page-title">liks</h1>
      </div>

      <div className="matches-body">
        {loading ? (
          <p className="muted center-text">loading your liks...</p>
        ) : matches.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <p className="empty-emoji">💫</p>
            <p className="empty-title">no liks yet</p>
            <p className="muted">go discover some people — your match is out there</p>
          </div>
        ) : (
          matches.map((match) => {
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
                    {other.age} · {other.year}
                  </p>
                </div>
                <span className="match-row-arrow">→</span>
              </button>
            );
          })
        )}
      </div>

      <BottomNav active="matches" />
    </div>
  );
}
