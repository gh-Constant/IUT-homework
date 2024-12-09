import React from 'react';
import { LogOut, Github, Menu, Moon, Sun } from 'lucide-react';
import { User } from '../../types/index';
import Cookies from 'js-cookie';
import { useState } from 'react';
import { useDarkMode } from '../../contexts/DarkModeContext';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleLogout = () => {
    Cookies.remove('user');
    onLogout();
  };

  const links = [
    {
      name: 'Moodle',
      href: 'https://moodle.univ-fcomte.fr/course/index.php?categoryid=3823',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
    },
    {
      name: 'Emploi du temps',
      href: 'https://sedna.univ-fcomte.fr/direct/myplanning.jsp?top=top.self',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
    },
    {
      name: 'Messagerie',
      href: 'https://mail-edu.univ-fcomte.fr/modern/',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
    },
    {
      name: 'Notes',
      href: 'https://notes.iut-bm.univ-fcomte.fr/',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      ),
    },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <svg className="h-9 w-9 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <div className="ml-4">
              <h1 className="text-xl font-semibold dark:text-white">{user.username}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Groupe {user.category}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-5">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 rounded-lg bg-gray-800/90 text-white hover:bg-gray-700 dark:bg-gray-700/90 dark:hover:bg-gray-600 transition-all hover:scale-105 hover:shadow-lg"
              >
                {link.icon}
                <span className="ml-2.5 hidden lg:inline font-medium">{link.name}</span>
              </a>
            ))}

            <div className="ml-auto flex items-center space-x-5">
              <a
                href="https://github.com/gh-Constant/IUT-homework"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-all hover:scale-105 hover:shadow-lg"
              >
                <Github className="h-5 w-5" />
                <span className="ml-2.5 hidden lg:inline font-medium">Contribute</span>
              </a>
              
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 rounded-lg bg-red-600/90 text-white hover:bg-red-500 dark:bg-red-500/90 dark:hover:bg-red-400 transition-all hover:scale-105 hover:shadow-lg"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-2.5 hidden lg:inline font-medium">Déconnexion</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-800/90 text-white hover:bg-gray-700 dark:bg-gray-700/90 dark:hover:bg-gray-600 transition-all hover:scale-105"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg bg-gray-800/90 text-white hover:bg-gray-700 dark:bg-gray-700/90 dark:hover:bg-gray-600 transition-all hover:scale-105"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-800/90 text-white hover:bg-gray-700 dark:bg-gray-700/90 dark:hover:bg-gray-600 transition-all hover:scale-105"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-3 pb-5">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2.5 rounded-lg bg-gray-800/90 text-white hover:bg-gray-700 dark:bg-gray-700/90 dark:hover:bg-gray-600 transition-all"
              >
                {link.icon}
                <span className="ml-3 font-medium">{link.name}</span>
              </a>
            ))}
            <a
              href="https://github.com/gh-Constant/IUT-homework"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-all"
            >
              <Github className="h-5 w-5" />
              <span className="ml-3 font-medium">Contribute</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2.5 rounded-lg bg-red-600/90 text-white hover:bg-red-500 dark:bg-red-500/90 dark:hover:bg-red-400 transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3 font-medium">Déconnexion</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}