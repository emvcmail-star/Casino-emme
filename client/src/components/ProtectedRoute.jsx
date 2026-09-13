import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function FullscreenLoader() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-base-950">
      <Loader2 size={40} className="animate-spin text-gold-400" strokeWidth={1.75} />
    </div>
  );
}
