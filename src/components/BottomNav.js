import { useNavigate } from 'react-router-dom';

export default function BottomNav({ active }) {
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${active === 'feed' ? 'active' : ''}`}
        onClick={() => navigate('/feed')}
      >
        <span className="nav-icon">⚡</span>
        <span className="nav-label">discover</span>
      </button>
      <button
        className={`nav-item ${active === 'matches' ? 'active' : ''}`}
        onClick={() => navigate('/matches')}
      >
        <span className="nav-icon">♡</span>
        <span className="nav-label">liks</span>
      </button>
      <button
        className={`nav-item ${active === 'profile' ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
      >
        <span className="nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </span>
        <span className="nav-label">profile</span>
      </button>
    </nav>
  );
}
