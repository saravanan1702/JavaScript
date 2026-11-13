import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute() {
  const { admin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }
  if (!admin) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
