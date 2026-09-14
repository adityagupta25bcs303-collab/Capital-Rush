import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AnnouncementBanner from './components/AnnouncementBanner';

import LandingPage from './pages/LandingPage';
import ParticipantLogin from './pages/ParticipantLogin';
import AdminLogin from './pages/AdminLogin';
import ParticipantDashboard from './pages/ParticipantDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LeaderboardPage from './pages/LeaderboardPage';
import FinalResultsPage from './pages/FinalResultsPage';
import { getGameSettings } from './services/api';

// Route Guard for Participants
function ParticipantRoute({ children }) {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user || role !== 'PARTICIPANT') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Route Guard for Admins
function AdminRoute({ children }) {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user || role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function MainApp() {
  const [gameSettings, setGameSettings] = useState(null);
  const { lastRoundUpdate, lastGameStatusUpdate } = useSocket();

  const fetchSettings = async () => {
    try {
      const res = await getGameSettings();
      if (res.success) {
        setGameSettings(res.settings);
      }
    } catch (e) {
      console.warn('Could not fetch game settings:', e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (lastRoundUpdate || lastGameStatusUpdate) {
      fetchSettings();
    }
  }, [lastRoundUpdate, lastGameStatusUpdate]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0f1d] text-slate-100">
      <Navbar gameSettings={gameSettings} />
      <AnnouncementBanner announcement={gameSettings?.announcement} />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage gameSettings={gameSettings} />} />
          <Route path="/login" element={<ParticipantLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/results" element={<FinalResultsPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ParticipantRoute>
                <ParticipantDashboard gameSettings={gameSettings} />
              </ParticipantRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <MainApp />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
