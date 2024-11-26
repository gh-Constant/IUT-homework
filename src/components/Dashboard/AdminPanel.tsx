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

        if (verifyError) {
          console.error('Error verifying user:', verifyError);
          throw new Error(`Erreur lors de la vérification de l'utilisateur: ${verifyError.message}`);
        }

        if (!existingUser) {
          throw new Error('Utilisateur introuvable dans la base de données');
        }

        // Call the delete_user_data function
        console.log('Step 2: Calling delete_user_data function');
        const { data: deleteData, error: deleteError } = await supabase
          .rpc('delete_user_data', {
            user_id: user.id
          });

        if (deleteError) {
          console.error('Error in delete_user_data:', deleteError);
          throw new Error(`Erreur lors de la suppression des données: ${deleteError.message}`);
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
          console.error('User still exists after deletion attempt:', checkData);
          throw new Error('La suppression a échoué - l\'utilisateur existe toujours dans la base de données');
        }

        console.log('=== DELETE USER OPERATION COMPLETE ===');
      } catch (error) {
        console.error('=== DELETE USER ERROR ===');
        console.error('Error details:', error);
        
        let errorMessage = 'Une erreur est survenue lors de la suppression';
        if (error instanceof Error) {
          errorMessage = error.message;
          console.error('Stack trace:', error.stack);
        }
        
        toast.error(errorMessage);
      }
    };

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Gestion des utilisateurs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Groupe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de création
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900 transition-colors"
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