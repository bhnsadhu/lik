import { useNavigate } from 'react-router-dom'
import Wordmark from '../components/Wordmark'

const S = {
  h: { fontSize: 17, marginTop: 26, marginBottom: 8 },
  p: { color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.6, marginBottom: 10 },
  li: { color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.6, marginBottom: 6, marginLeft: 18 },
}

// Plain-English privacy policy, reachable at /privacy with or without a
// session. This page is the app's privacy policy URL for App Store review.
export default function Privacy() {
  const navigate = useNavigate()
  return (
    <div className="screen screen--bare">
      <Wordmark />
      <h2 className="screen-title">Privacy, in plain English</h2>
      <p className="screen-sub">Effective July 8, 2026 · lik is a roommate-matching app for UIUC students.</p>

      <h3 style={S.h}>What we collect</h3>
      <p style={S.p}>Everything below is something you type or upload yourself. There is nothing collected behind your back.</p>
      <ul style={{ listStyle: 'disc' }}>
        <li style={S.li}>Your illinois.edu email address, used only to sign you in and prove you're a UIUC student.</li>
        <li style={S.li}>Your profile: name, age, gender, year, major, bio, and the photos you upload.</li>
        <li style={S.li}>Your living-style quiz answers and your hard limits (nonnegotiables).</li>
        <li style={S.li}>Your housing preferences: dorm or apartment, dorms or areas you're considering, budget range, and move-in timing.</li>
        <li style={S.li}>Your swipes, your matches, and the messages you send to people you've matched with.</li>
        <li style={S.li}>If you joined through a friend's invite link, the connection between your account and theirs.</li>
      </ul>

      <h3 style={S.h}>How it's used</h3>
      <p style={S.p}>
        To show your profile to other UIUC students in your housing pool, to score compatibility, and to let you chat
        with your matches. That's the whole list.
      </p>

      <h3 style={S.h}>Who can see what</h3>
      <ul style={{ listStyle: 'disc' }}>
        <li style={S.li}>Other signed-in students see your profile, photos, quiz overlap, hard limits, and housing preferences.</li>
        <li style={S.li}>Messages are visible only to you and the person you matched with.</li>
        <li style={S.li}>Your email address is never shown to other users.</li>
      </ul>

      <h3 style={S.h}>What we don't do</h3>
      <ul style={{ listStyle: 'disc' }}>
        <li style={S.li}>No ads and no ad tracking.</li>
        <li style={S.li}>No selling or sharing your data with anyone.</li>
        <li style={S.li}>No tracking you across other apps or websites.</li>
        <li style={S.li}>No third-party analytics. Data lives in Supabase, the infrastructure that runs our database, sign-in, and photo storage.</li>
      </ul>

      <h3 style={S.h}>Deleting your data</h3>
      <p style={S.p}>
        Open your profile tab and tap "Delete My Account". That permanently removes your profile, photos, swipes,
        matches, messages, and your account itself. It takes effect immediately and can't be undone.
      </p>

      <h3 style={S.h}>Questions</h3>
      <p style={S.p}>Email sadhubhanu07@gmail.com and a human will answer.</p>

      <div style={{ flex: 1, minHeight: 20 }} />
      <button className="btn btn-ghost" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}>
        Back
      </button>
    </div>
  )
}
