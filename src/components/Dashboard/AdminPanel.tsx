  import React from 'react';
  import { User } from '../../types';
  import { Trash2 } from 'lucide-react';
  import { supabase } from '../../lib/supabase';
  import toast from 'react-hot-toast';

  interface AdminPanelProps {
    users: User[];
    onUserDeleted: () => void;
    currentUser: User;
  }

  export default function AdminPanel({ users, onUserDeleted, currentUser }: AdminPanelProps) {
    const handleDeleteUser = async (user: User) => {
      try {
        console.log('=== DELETE USER OPERATION START ===');
        console.log('User to delete:', user);

        if (user.id === currentUser.id) {
          toast.error('Vous ne pouvez pas supprimer votre propre compte');
          return;
        }

        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" ? Tous ses devoirs seront également supprimés.`)) {
          return;
        }

        // First verify if user exists
        console.log('Step 1: Verifying user exists');
        const { data: existingUser, error: verifyError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (verifyError || !existingUser) {
          console.error('User not found:', verifyError);
          throw new Error('Utilisateur introuvable');
        }

        // Call the delete_user_data function
        console.log('Step 2: Calling delete_user_data function');
        const { error: deleteError } = await supabase
          .rpc('delete_user_data', {
            user_id: user.id
          });

        if (deleteError) {
          console.error('Error in delete_user_data:', deleteError);
          throw new Error('Erreur lors de la suppression des données');
        }

        // Verify deletion
        console.log('Step 3: Verifying deletion');
        const { data: checkData, error: checkError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (checkError?.code === 'PGRST116') {
          console.log('Deletion confirmed - user no longer exists');
          toast.success(`L'utilisateur ${user.username} et tous ses devoirs ont été supprimés`);
          onUserDeleted();
        } else {
          console.error('User still exists after deletion attempt');
          throw new Error('La suppression a échoué, veuillez réessayer');
        }

        console.log('=== DELETE USER OPERATION COMPLETE ===');
      } catch (error) {
        console.error('=== UNEXPECTED ERROR ===');
        console.error('Caught in try/catch:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack
          });
        }
        toast.error(error instanceof Error ? error.message : 'Une erreur est survenue lors de la suppression');
      }
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gestion des utilisateurs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nom d'utilisateur
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rôle
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Catégorie
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date de création
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300' 
                        : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                        title="Supprimer l'utilisateur"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }