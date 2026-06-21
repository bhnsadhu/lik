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
    </nav>
  );
}
