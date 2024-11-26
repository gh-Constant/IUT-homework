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
  const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  console.log('Dashboard user:', user);

  const fetchAssignments = async () => {
    console.log('Fetching assignments for user:', {
      id: user.id,
      category: user.category
    });

    try {
      // Get all assignments and log the raw data
      const { data: allData, error } = await supabase
        .from('assignments')
        .select('*');

      if (error) throw error;

      // Log raw data before filtering
      console.log('Raw data from database:', allData.map(a => ({
        id: a.id,
        title: a.title,
        type: a.target_type,
        groups: a.target_groups,
        users: a.target_users
      })));

      // Filter assignments based on type and targets
      const assignments = allData.filter(assignment => {
        // Log each assignment being checked
        console.log('Checking assignment:', {
          id: assignment.id,
          title: assignment.title,
          type: assignment.target_type,
          groups: assignment.target_groups,
          users: assignment.target_users,
          matchesGroup: assignment.target_type === 'group' ? assignment.target_groups.includes(user.category) : 'N/A',
          matchesPersonal: assignment.target_type === 'personal' ? assignment.target_users.includes(user.id) : 'N/A'
        });

        // Global assignments are always included
        if (assignment.target_type === 'global') return true;

        // Group assignments - check if user's category is in target_groups
        if (assignment.target_type === 'group') {
          const isIncluded = assignment.target_groups.includes(user.category);
          console.log(`Group assignment check: ${assignment.title} - Category ${user.category} included: ${isIncluded}`);
          return isIncluded;
        }

        // Personal assignments - check if user's ID is in target_users
        if (assignment.target_type === 'personal') {
          const isIncluded = assignment.target_users.includes(user.id);
          console.log(`Personal assignment check: ${assignment.title} - User ${user.id} included: ${isIncluded}`);
          return isIncluded;
        }

        return false;
      });

      console.log('Assignment filtering results:', {
        total: allData.length,
        filtered: assignments.length,
        breakdown: {
          global: assignments.filter(a => a.target_type === 'global').length,
          group: assignments.filter(a => a.target_type === 'group').length,
          personal: assignments.filter(a => a.target_type === 'personal').length
        },
        allAssignments: assignments
      });

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

  const handleAssignmentDeleted = () => {
    fetchAssignments();
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
            currentUser={user}
            onAssignmentDeleted={handleAssignmentDeleted}
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