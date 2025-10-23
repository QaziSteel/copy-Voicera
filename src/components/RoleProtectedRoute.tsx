import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: ('owner' | 'admin' | 'member')[];
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  requiredRoles = ['owner', 'admin'] 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { currentUserRole, loading: projectLoading } = useProject();

  if (authLoading || projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (currentUserRole && !requiredRoles.includes(currentUserRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
