import React from 'react';
import { Assignment, User } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, Circle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface TimelineProps {
  assignments: Assignment[];
  onToggleComplete: (id: string) => void;
  currentUser: User;
  onAssignmentDeleted: () => void;
}

export default function Timeline({ assignments, onToggleComplete, currentUser, onAssignmentDeleted }: TimelineProps) {
  const sortedAssignments = [...assignments].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const canDeleteAssignment = (assignment: Assignment) => {
    const isAdmin = currentUser.role === 'admin';
    const isPersonalAssignment = assignment.target_type === 'personal' && 
                                assignment.target_users?.includes(currentUser.id);
    
    console.log({
      assignmentId: assignment.id,
      userRole: currentUser.role,
      userId: currentUser.id,
      targetType: assignment.target_type,
      targetUsers: assignment.target_users,
      isAdmin,
      isPersonalAssignment,
      canDelete: isAdmin || isPersonalAssignment
    });

    return isAdmin || isPersonalAssignment;
  };

  const handleDeleteAssignment = async (assignment: Assignment) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignment.id);

      if (error) throw error;
      
      toast.success('Devoir supprimé avec succès');
      onAssignmentDeleted();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression du devoir');
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Timeline des devoirs</h2>
      <div className="space-y-4">
        {sortedAssignments.map((assignment) => {
          const showDeleteButton = canDeleteAssignment(assignment);
          
          return (
            <div
              key={assignment.id}
              className={`p-4 rounded-lg border ${
                assignment.completed ? 'border-success' : 'border-primary'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{assignment.title}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {assignment.target_type.toUpperCase()}
                      {assignment.target_type === 'personal' && 
                       ` (${assignment.target_users?.join(', ')})`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{assignment.subject}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(assignment.due_date), 'PPP', { locale: fr })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {showDeleteButton && (
                    <button
                      onClick={() => handleDeleteAssignment(assignment)}
                      className="p-1 rounded-full text-danger hover:bg-red-50"
                      title="Supprimer le devoir"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => onToggleComplete(assignment.id)}
                    className={`p-1 rounded-full ${
                      assignment.completed ? 'text-success' : 'text-gray-400'
                    }`}
                  >
                    {assignment.completed ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
              {assignment.description && (
                <p className="mt-2 text-gray-600">{assignment.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}