import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './pages/Auth';
import PhotosSetup from './pages/PhotosSetup';
import BasicsSetup from './pages/BasicsSetup';
import HousingSetup from './pages/HousingSetup';
import BioSetup from './pages/BioSetup';
import Quiz from './pages/Quiz';
import PreferencesSetup from './pages/PreferencesSetup';
import SwipeFeed from './pages/SwipeFeed';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import UserProfile from './pages/UserProfile';
import './App.css';

const STEP_ROUTES = {
  basics: '/setup/basics',
  housing: '/setup/housing',
  bio: '/setup/bio',
  quiz: '/setup/quiz',
  budget: '/setup/preferences',
  preferences: '/setup/preferences',
};

function AppRouter() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="splash">
        <span className="wordmark">lik</span>
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
        <Route path="/setup/bio" element={<BioSetup />} />
        <Route path="/setup/quiz" element={<Quiz />} />
        <Route path="/setup/preferences" element={<PreferencesSetup />} />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    );
  }

  const redirectTo = STEP_ROUTES[step];
  if (redirectTo) {
    return (
      <Routes>
        <Route path={redirectTo} element={
          step === 'basics' ? <BasicsSetup /> :
          step === 'housing' ? <HousingSetup /> :
          step === 'bio' ? <BioSetup /> :
          step === 'quiz' ? <Quiz /> :
          <PreferencesSetup />
        } />
        <Route path="*" element={<Navigate to={redirectTo} replace />} />
      </Routes>
    );
  }

  // null / 'profile' / unknown → start new onboarding
  return (
    <Routes>
      <Route path="/setup/photos" element={<PhotosSetup />} />
      <Route path="*" element={<Navigate to="/setup/photos" replace />} />
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
