import React from 'react';
import { BookOpen, LogOut } from 'lucide-react';
import { User } from '../../types';
import Cookies from 'js-cookie';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const handleLogout = () => {
    Cookies.remove('user');
    onLogout();
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <h1 className="text-xl font-semibold">{user.username}</h1>
              <p className="text-sm text-gray-500">Groupe {user.category}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}