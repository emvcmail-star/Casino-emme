import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import GamesList from './pages/GamesList.jsx';
import GamePage from './pages/GamePage.jsx';
import Bonuses from './pages/Bonuses.jsx';
import PromoCodes from './pages/PromoCodes.jsx';
import History from './pages/History.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminCredits from './pages/admin/AdminCredits.jsx';
import AdminGames from './pages/admin/AdminGames.jsx';
import AdminGameConfiguration from './pages/admin/AdminGameConfiguration.jsx';
import AdminPromoCodes from './pages/admin/AdminPromoCodes.jsx';
import AdminTransactions from './pages/admin/AdminTransactions.jsx';
import AdminActivityLog from './pages/admin/AdminActivityLog.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/games" element={<ProtectedRoute><GamesList /></ProtectedRoute>} />
      <Route path="/games/:key" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
      <Route path="/bonuses" element={<ProtectedRoute><Bonuses /></ProtectedRoute>} />
      <Route path="/promo-codes" element={<ProtectedRoute><PromoCodes /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />

      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/credits" element={<AdminRoute><AdminCredits /></AdminRoute>} />
      <Route path="/admin/games" element={<AdminRoute><AdminGames /></AdminRoute>} />
      <Route path="/admin/game-configuration" element={<AdminRoute><AdminGameConfiguration /></AdminRoute>} />
      <Route path="/admin/promo-codes" element={<AdminRoute><AdminPromoCodes /></AdminRoute>} />
      <Route path="/admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
      <Route path="/admin/activity-log" element={<AdminRoute><AdminActivityLog /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
