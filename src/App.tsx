import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import { User } from './types';
import Cookies from 'js-cookie';
import { DarkModeProvider } from './contexts/DarkModeContext';

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = Cookies.get('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        Cookies.remove('user');
      }
    }
  }, []);

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    Cookies.set('user', JSON.stringify(userData), { expires: 7 });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <DarkModeProvider>
      <Toaster position="top-right" />
      {!user ? (
        <AuthForm onSuccess={handleAuthSuccess} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </DarkModeProvider>
  );
}

export default App;