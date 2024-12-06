import React, { useState, useEffect } from 'react';
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
  const [view, setView] = useState<'timeline' | 'calendar'>('timeline');

  const fetchAssignments = async () => {
    console.log('Fetching assignments for user:', {
      id: user.id,
      category: user.category,
      role: user.role
    });

    try {
      // Get all assignments
      const { data: allData, error } = await supabase
        .from('assignments')
        .select('*');

      if (error) throw error;

      // Log raw data before filtering
      console.log('Raw data from database:', allData);

      // Filter assignments based on user role and targets
      const assignments = user.role === 'admin' 
        ? allData // Admin sees all assignments
        : allData.filter(assignment => {
            // Regular users only see assignments targeted to them
            if (assignment.target_type === 'global') return true;
            if (assignment.target_type === 'group') {
              return assignment.target_groups.includes(user.category);
            }
            if (assignment.target_type === 'personal') {
              return assignment.target_users.includes(user.id);
            }
            return false;
          });

      console.log('Filtered assignments:', assignments);
      setAssignments(assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

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
    <div className="min-h-screen bg-gray-100">
      <Header user={user} onLogout={onLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="w-full sm:w-auto flex space-x-2 sm:space-x-4">
            <button
              onClick={() => setView('timeline')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base transition-colors ${
                view === 'timeline'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base transition-colors ${
                view === 'calendar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Calendrier
            </button>
          </div>
          
          <button
            onClick={() => setIsNewAssignmentModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm sm:text-base transition-colors"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Nouveau devoir
          </button>
        </div>

        <div className="space-y-6">
          {view === 'timeline' ? (
            <Timeline
              assignments={assignments}
              onToggleComplete={handleToggleComplete}
              currentUser={user}
              onAssignmentDeleted={fetchAssignments}
            />
          ) : (
            <Calendar assignments={assignments} />
          )}

          {user.role === 'admin' && (
            <AdminPanel 
              users={users} 
              onUserDeleted={fetchUsers} 
              currentUser={user}
            />
          )}
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