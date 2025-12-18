import React, { useState, useEffect } from 'react';
import { AuthState, User } from './types';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { StorageService } from './services/storageService';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const user = StorageService.getCurrentUser();
    if (user) {
      setAuthState({
        isAuthenticated: true,
        user: user
      });
    }
    setLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setAuthState({
      isAuthenticated: true,
      user: user
    });
  };

  const handleUserUpdate = (updatedUser: User) => {
    setAuthState({
      isAuthenticated: true,
      user: updatedUser
    });
  };

  const handleLogout = () => {
    StorageService.logout();
    setAuthState({
      isAuthenticated: false,
      user: null
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {authState.isAuthenticated && authState.user ? (
        <Dashboard 
            user={authState.user} 
            onLogout={handleLogout} 
            onUserUpdate={handleUserUpdate}
        />
      ) : (
        <Auth onLogin={handleLogin} />
      )}
    </>
  );
};

export default App;