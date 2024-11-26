import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { User, Assignment } from '../../types';
import { supabase } from '../../lib/supabase';
import Header from './Header';
import Calendar from './Calendar';
import Timeline from './Timeline';
import AdminPanel from './AdminPanel';
import NewAssignmentModal from './NewAssignmentModal';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [view, setView] = useState<'calendar' | 'timeline'>('calendar');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .or(`target_type.eq.global,and(target_type.eq.group,target_groups.cs.{${user.category}}),and(target_type.eq.personal,target_users.cs.{${user.id}})`);

    if (!error && data) {
      setAssignments(data);
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-md ${
                view === 'calendar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              Calendrier
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`px-4 py-2 rounded-md ${
                view === 'timeline'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              Timeline
            </button>
          </div>
          
          <button
            onClick={() => setIsNewAssignmentModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouveau devoir
          </button>
        </div>

        {view === 'calendar' ? (
          <Calendar assignments={assignments} />
        ) : (
          <Timeline
            assignments={assignments}
            onToggleComplete={handleToggleComplete}
          />
        )}

        {user.role === 'admin' && (
          <div className="mt-8">
            <AdminPanel users={users} onUserDeleted={fetchUsers} />
          </div>
        )}

        <NewAssignmentModal
          isOpen={isNewAssignmentModalOpen}
          onClose={() => setIsNewAssignmentModalOpen(false)}
          currentUser={user}
          onAssignmentCreated={fetchAssignments}
        />
      </main>
    </div>
  );
}