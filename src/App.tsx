import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import TripList from './pages/TripList';
import CreateTrip from './pages/CreateTrip';
import ItineraryBuilder from './pages/ItineraryBuilder';
import ItineraryView from './pages/ItineraryView';
import PublicTrip from './pages/PublicTrip';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import Collections from './pages/Collections';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading Infinity Atlas...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
}

import { AnimatePresence, motion } from 'motion/react';
import { useLocation } from 'react-router-dom';

function AnimatedRoutes() {
  const location = useLocation();
  const { loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center font-serif italic text-2xl animate-pulse">Loading Infinity Atlas...</div>;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full overflow-x-hidden"
      >
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/shared/:tripId" element={<PublicTrip />} />
          <Route path="/explore" element={<Layout><Explore /></Layout>} />
          <Route path="/collections" element={<Layout><Collections /></Layout>} />
          
          <Route path="/*" element={
            <PrivateRoute>
              <Layout>
                <Routes location={location}>
                  <Route index element={<Dashboard />} />
                  <Route path="trips" element={<TripList />} />
                  <Route path="trips/new" element={<CreateTrip />} />
                  <Route path="trips/:tripId" element={<ItineraryView />} />
                  <Route path="trips/:tripId/build" element={<ItineraryBuilder />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="admin" element={
                    <PrivateRoute adminOnly>
                      <AdminDashboard />
                    </PrivateRoute>
                  } />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

// Remove PageTransition component as it's no longer needed with the above structure

import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AnimatedRoutes />
            <Toaster />
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}
