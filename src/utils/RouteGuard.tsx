// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

interface RouteProps {
    children: React.ReactNode;
} 

export const AdminRoute: React.FC<RouteProps> = ({ children }) => {
    const { state } = useAppContext();
    
    if (state.isLoading) {
      // Show a loading indicator while checking authentication
      return <div>Loading...</div>;
    }
  
    if (!state.user || !state.user.isAdmin) {
      // Redirect to home page if user is not an admin
      return <Navigate to="/" replace />;
    }
  
    return <>{children}</>;
  };