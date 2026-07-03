import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Auth from './pages/Auth'
import Photos from './pages/setup/Photos'
import Basics from './pages/setup/Basics'
import Housing from './pages/setup/Housing'
import Quiz from './pages/setup/Quiz'
import Limits from './pages/setup/Limits'
import Logistics from './pages/setup/Logistics'
import Feed from './pages/Feed'
import Matches from './pages/Matches'
import Chat from './pages/Chat'
import Profile from './pages/Profile'

// capture ?ref=code before anything else so it survives the auth redirect
function useReferralCapture() {
  const location = useLocation()
  useEffect(() => {
    const ref = new URLSearchParams(location.search).get('ref')
    if (ref) localStorage.setItem('lik-ref', ref)
  }, [location.search])
}

function Gate({ children }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="center-load"><div className="spin" /></div>
  if (!session) return <Navigate to="/" replace />
  if (!profile) return <div className="center-load"><div className="spin" /></div>

  const step = profile.onboarding_step
  const setupPath = `/setup/${step}`
  const inSetup = location.pathname.startsWith('/setup')
  const editing = new URLSearchParams(location.search).get('edit') === '1'

  if (step !== 'done' && !inSetup) return <Navigate to={setupPath} replace />
  if (step === 'done' && inSetup && !editing) return <Navigate to="/feed" replace />

  return children
}

export default function App() {
  useReferralCapture()
  const { session, profile, loading } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={
          loading ? (
            <div className="center-load"><div className="spin" /></div>
          ) : session && profile ? (
            <Navigate to={profile.onboarding_step === 'done' ? '/feed' : `/setup/${profile.onboarding_step}`} replace />
          ) : (
            <Auth />
          )
        }
      />
      <Route path="/setup/photos" element={<Gate><Photos /></Gate>} />
      <Route path="/setup/basics" element={<Gate><Basics /></Gate>} />
      <Route path="/setup/housing" element={<Gate><Housing /></Gate>} />
      <Route path="/setup/quiz" element={<Gate><Quiz /></Gate>} />
      <Route path="/setup/limits" element={<Gate><Limits /></Gate>} />
      <Route path="/setup/logistics" element={<Gate><Logistics /></Gate>} />
      <Route path="/feed" element={<Gate><Feed /></Gate>} />
      <Route path="/matches" element={<Gate><Matches /></Gate>} />
      <Route path="/chat/:matchId" element={<Gate><Chat /></Gate>} />
      <Route path="/profile" element={<Gate><Profile /></Gate>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
