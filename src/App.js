import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './pages/Auth';
import ProfileSetup from './pages/ProfileSetup';
import Quiz from './pages/Quiz';
import BudgetSetup from './pages/BudgetSetup';
import SwipeFeed from './pages/SwipeFeed';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import './App.css';

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

  if (!step || step === 'profile') {
    return (
      <Routes>
        <Route path="/setup/profile" element={<ProfileSetup />} />
        <Route path="*" element={<Navigate to="/setup/profile" replace />} />
      </Routes>
    );
  }

  if (step === 'quiz') {
    return (
      <Routes>
        <Route path="/setup/quiz" element={<Quiz />} />
        <Route path="*" element={<Navigate to="/setup/quiz" replace />} />
      </Routes>
    );
  }

  if (step === 'budget') {
    return (
      <Routes>
        <Route path="/setup/budget" element={<BudgetSetup />} />
        <Route path="*" element={<Navigate to="/setup/budget" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/feed" element={<SwipeFeed />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/chat/:matchId" element={<Chat />} />
      <Route path="*" element={<Navigate to="/feed" replace />} />
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
