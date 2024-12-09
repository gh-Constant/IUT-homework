import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { User, Assignment } from '../../types';
import { supabase } from '../../lib/supabase';
import Header from './Header';
import Calendar from './Calendar';
import Timeline from './Timeline';
import AdminPanel from './AdminPanel';
import NewAssignmentModal from './NewAssignmentModal';
import ContributePopup from '../ContributePopup';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);
  const [isContributePopupOpen, setIsContributePopupOpen] = useState(
    !localStorage.getItem('hideContributePopup')
  );
  const [view, setView] = useState<'timeline' | 'archive'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .order('due_date', { ascending: true });

    if (!error && data) {
      // Archiver automatiquement les devoirs passés
      const now = new Date();
      const updatedAssignments = await Promise.all(
        data.map(async (assignment) => {
          const dueDate = new Date(assignment.due_date);
          if (!assignment.is_archived && dueDate < now) {
            const { error: updateError } = await supabase
              .from('assignments')
              .update({ is_archived: true })
              .eq('id', assignment.id);

            if (!updateError) {
              return { ...assignment, is_archived: true };
            }
          }
          return assignment;
        })
      );

      setAssignments(updatedAssignments);
    }
  };

  const filteredAssignments = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 jour en millisecondes

    return assignments.filter(assignment => {
      const dueDate = new Date(assignment.due_date);
      const isArchived = dueDate < oneDayAgo;
      
      if (view === 'archive') {
        // Dans la vue archive, montrer les devoirs passés depuis plus d'un jour
        return isArchived;
      } else {
        // Dans la vue timeline, montrer les devoirs à venir et ceux passés depuis moins d'un jour
        return !isArchived;
      }
    });
  }, [assignments, view]);

  const fetchUsers = async () => {
    if (user.role === 'admin') {
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (!error && data) {
        setUsers(data);
      }
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchUsers();
  }, [user]);

  const handleToggleComplete = async (id: string) => {
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;

    const { error } = await supabase
      .from('assignments')
      .update({ completed: !assignment.completed })
      .eq('id', id);

    if (!error) {
      fetchAssignments();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header user={user} onLogout={onLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="w-full sm:w-auto flex space-x-2 sm:space-x-4">
            <button
              onClick={() => setView('timeline')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base transition-colors ${
                view === 'timeline'
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setView('archive')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base transition-colors ${
                view === 'archive'
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Archive
            </button>
          </div>

          <button
            onClick={() => setIsNewAssignmentModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 text-sm sm:text-base transition-colors"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Nouveau devoir
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            {view === 'archive' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <input
                  type="text"
                  placeholder="Rechercher dans les archives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
              </div>
            )}
            <Timeline
              assignments={filteredAssignments}
              onToggleComplete={handleToggleComplete}
              currentUser={user}
              onAssignmentDeleted={fetchAssignments}
              showArchived={view === 'archive'}
            />
          </div>

          <div className="lg:w-80 xl:w-96 space-y-6">
            <Calendar assignments={assignments} />
            {user.role === 'admin' && (
              <AdminPanel 
                users={users} 
                onUserDeleted={fetchUsers} 
                currentUser={user}
              />
            )}
          </div>
        </div>

        <NewAssignmentModal
          isOpen={isNewAssignmentModalOpen}
          onClose={() => setIsNewAssignmentModalOpen(false)}
          currentUser={user}
          onAssignmentCreated={fetchAssignments}
        />

        <ContributePopup 
          isOpen={isContributePopupOpen}
          onClose={() => setIsContributePopupOpen(false)}
        />
      </main>
    </div>
  );
}