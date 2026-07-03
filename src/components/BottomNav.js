import { NavLink } from 'react-router-dom'

const Cards = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="7" y="3" width="13" height="17" rx="3" />
    <path d="M4 6.5v12A2.5 2.5 0 0 0 6.5 21H15" />
  </svg>
)

const Spark = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3c.9 4.6 3.4 7.1 8 8-4.6.9-7.1 3.4-8 8-.9-4.6-3.4-7.1-8-8 4.6-.9 7.1-3.4 8-8z" />
  </svg>
)

const Person = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M5 21c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" />
  </svg>
)

export default function BottomNav({ unread }) {
  return (
    <nav className="bottom-nav">
      <NavLink to="/feed">{Cards}<span>feed</span></NavLink>
      <NavLink to="/matches">
        {unread ? <span className="nav-dot" /> : null}
        {Spark}
        <span>matches</span>
      </NavLink>
      <NavLink to="/profile">{Person}<span>you</span></NavLink>
    </nav>
  )
}
