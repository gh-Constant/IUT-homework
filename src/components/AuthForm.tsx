import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Category } from '../types';

interface AuthFormProps {
  onSuccess: (user: any) => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [category, setCategory] = useState<Category>('A1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .eq('pin', pin)
          .single();

        if (error) throw error;
        if (user) {
          toast.success('Connexion réussie !');
          onSuccess(user);
        }
      } else {
        const { data: user, error } = await supabase
          .from('users')
          .insert([{ username, pin, category }])
          .select()
          .single();

        if (error) throw error;
        if (user) {
          toast.success('Inscription réussie !');
          onSuccess(user);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(isLogin ? 'Identifiants invalides' : 'Erreur lors de l\'inscription');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <BookOpen className="w-12 h-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
                Code PIN (6 chiffres)
              </label>
              <input
                id="pin"
                type="password"
                required
                pattern="[0-9]{6}"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Groupe
                </label>
                <select
                  id="category"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                >
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLogin ? 'Se connecter' : 'S\'inscrire'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500"
            >
              {isLogin ? 'Créer un compte' : 'Déjà inscrit ? Se connecter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}