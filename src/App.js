import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import Wordmark from './components/Wordmark';
import Auth from './pages/Auth';
import PhotosSetup from './pages/PhotosSetup';
import BasicsSetup from './pages/BasicsSetup';
import HousingSetup from './pages/HousingSetup';
import Quiz from './pages/Quiz';
import NonnegotiablesSetup from './pages/NonnegotiablesSetup';
import PreferencesSetup from './pages/PreferencesSetup';
import SwipeFeed from './pages/SwipeFeed';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import UserProfile from './pages/UserProfile';
import './App.css';

const STEP_ROUTES = {
  basics: '/setup/basics',
  housing: '/setup/housing',
  bio: '/setup/quiz',
  quiz: '/setup/quiz',
  nonnegotiables: '/setup/nonnegotiables',
  budget: '/setup/preferences',
  preferences: '/setup/preferences',
};

// referral links look like getlik.com?ref=<userId>. we stash the ref before
// auth so it survives the OTP round trip, then log it once the user exists.
const REF_KEY = 'lik-ref';
const params = new URLSearchParams(window.location.search);
if (params.get('ref')) localStorage.setItem(REF_KEY, params.get('ref'));

function AppRouter() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!user) return;
    const ref = localStorage.getItem(REF_KEY);
    if (!ref) return;
    if (ref === user.id) {
      localStorage.removeItem(REF_KEY);
      return;
    }
    supabase
      .from('referrals')
      .insert({ referrer_id: ref, referred_id: user.id })
      .then(() => localStorage.removeItem(REF_KEY));
  }, [user]);

  if (loading) {
    return (
      <div className="splash">
        <Wordmark size={64} />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  const step = profile?.onboarding_step;

  if (step === 'done') {
    return (
      <Routes>
        <Route path="/feed" element={<SwipeFeed />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/chat/:matchId" element={<Chat />} />
        <Route path="/setup/photos" element={<PhotosSetup />} />
        <Route path="/setup/basics" element={<BasicsSetup />} />
        <Route path="/setup/housing" element={<HousingSetup />} />
        <Route path="/setup/quiz" element={<Quiz />} />
        <Route path="/setup/nonnegotiables" element={<NonnegotiablesSetup />} />
        <Route path="/setup/preferences" element={<PreferencesSetup />} />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    );
  }

  const redirectTo = STEP_ROUTES[step] || '/setup/photos';
  return (
    <Routes>
      <Route path="/setup/photos" element={<PhotosSetup />} />
      <Route path="/setup/basics" element={<BasicsSetup />} />
      <Route path="/setup/housing" element={<HousingSetup />} />
      <Route path="/setup/quiz" element={<Quiz />} />
      <Route path="/setup/nonnegotiables" element={<NonnegotiablesSetup />} />
      <Route path="/setup/preferences" element={<PreferencesSetup />} />
      <Route path="*" element={<Navigate to={redirectTo} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
