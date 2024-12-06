import React from 'react';
import { BookOpen, LogOut, Github, Calendar, Mail, GraduationCap, Book, Menu } from 'lucide-react';
import { User } from '../../types';
import Cookies from 'js-cookie';
import { useState } from 'react';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    Cookies.remove('user');
    onLogout();
  };

  const links = [
    {
      name: 'Moodle',
      href: 'https://moodle.univ-fcomte.fr/course/index.php?categoryid=3823',
      icon: <img src={`https://www.google.com/s2/favicons?domain=moodle.univ-fcomte.fr`} alt="Moodle" className="h-5 w-5" />,
    },
    {
      name: 'Emploi du temps',
      href: 'https://sedna.univ-fcomte.fr/direct/myplanning.jsp?top=top.self',
      icon: <img src={`https://www.google.com/s2/favicons?domain=sedna.univ-fcomte.fr`} alt="Emploi du temps" className="h-5 w-5" />,
    },
    {
      name: 'Messagerie',
      href: 'https://mail-edu.univ-fcomte.fr/modern/',
      icon: <img src={`https://www.google.com/s2/favicons?domain=mail-edu.univ-fcomte.fr`} alt="Emploi du temps" className="h-5 w-5" />,
    },
    {
      name: 'Notes',
      href: 'https://notes.iut-bm.univ-fcomte.fr/',
      icon: <img src={`https://www.google.com/s2/favicons?domain=notes.iut-bm.univ-fcomte.fr`} alt="Notes" className="h-5 w-5" />,
    },
  ];

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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
              >
                {link.icon}
                <span className="ml-2 hidden lg:inline">{link.name}</span>
              </a>
            ))}

            <div className="ml-auto flex items-center space-x-4">
              <a
                href="https://github.com/gh-Constant/IUT-homework"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-700 transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="ml-2 hidden lg:inline">Contribute</span>
              </a>
              
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-2 hidden lg:inline">Déconnexion</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-2">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors"
              >
                {link.icon}
                <span className="ml-2">{link.name}</span>
              </a>
            ))}
            <a
              href="https://github.com/gh-Constant/IUT-homework"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              <Github className="h-5 w-5" />
              <span className="ml-2">Contribute</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-2">Déconnexion</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}