import React from 'react';
import { BookOpen, LogOut, Github } from 'lucide-react';
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
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/gh-Constant/IUT-homework"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              <div className="relative mr-2">
                <div className="absolute inset-0 bg-black rounded-full"></div>
                <Github className="h-5 w-5 relative z-10" />
              </div>
              Contribute
            </a>
            
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}