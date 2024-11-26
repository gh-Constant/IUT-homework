import React, { useState } from 'react';
import { BookOpen, User, KeyRound, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Category, UserRole } from '../types';

interface AuthFormProps {
  onSuccess: (user: any) => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [category, setCategory] = useState<Category>('B1');
  const [isLoading, setIsLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase
          .from('users')
          .select()
          .eq('username', username)
          .eq('pin', pin)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Identifiants invalides');

        onSuccess(data);
        toast.success('Connexion réussie');
      } else {
        const { data, error } = await supabase
          .from('users')
          .insert([
            {
              username,
              pin,
              category,
              role: 'user' as UserRole,
            },
          ])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            throw new Error('Ce nom d\'utilisateur est déjà pris');
          }
          throw error;
        }

        onSuccess(data);
        toast.success('Compte créé avec succès');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbersOnly = value.replace(/[^0-9]/g, '');
    if (numbersOnly.length <= 6) {
      setPin(numbersOnly);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {isLogin ? 'Bienvenue' : 'Créer un compte'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? (
            <>
              Pas encore de compte ?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition-colors"
              >
                S'inscrire
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition-colors"
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Nom d'utilisateur
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Entrez votre nom d'utilisateur"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
                Code PIN
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  required
                  minLength={6}
                  maxLength={6}
                  placeholder="Entrez votre code PIN à 6 chiffres"
                  className="block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  value={pin}
                  onChange={handlePinChange}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPin ? (
                    <EyeOff className="h-5 w-5" aria-label="Masquer le PIN" />
                  ) : (
                    <Eye className="h-5 w-5" aria-label="Afficher le PIN" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Le code PIN doit contenir exactement 6 chiffres
              </p>
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Groupe
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['C2', 'C1', 'B2', 'B1', 'A2', 'A1'].map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setCategory(group as Category)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        category === group
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? (
                'Se connecter'
              ) : (
                'Créer le compte'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}