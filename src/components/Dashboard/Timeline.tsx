import React, { useState, useEffect } from 'react';
import { Assignment, User } from '../../types';
import { format, isPast, formatDistanceToNow, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, Circle, Trash2, Edit } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import EditAssignmentModal from './EditAssignmentModal';

interface TimelineProps {
  assignments: Assignment[];
  onToggleComplete: (id: string) => void;
  currentUser: User | null;
  onAssignmentDeleted: () => void;
}

const extractLinks = (html: string): string[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = Array.from(doc.getElementsByTagName('a'));
  return links.map(link => link.href);
};

export default function Timeline({ assignments, onToggleComplete, currentUser, onAssignmentDeleted }: TimelineProps) {
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    const fetchUsernames = async () => {
      const userIds = [...new Set([
        ...assignments.flatMap(a => a.target_users || []),
        ...assignments.map(a => a.created_by)
      ])];
      
      if (userIds.length === 0) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .in('id', userIds);

      if (!error && data) {
        const usernameMap = data.reduce((acc, user) => ({
          ...acc,
          [user.id]: user.username
        }), {});
        setUsernames(usernameMap);
      }
    };

    fetchUsernames();
  }, [assignments]);

  const sortedAssignments = [...assignments].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const canDeleteAssignment = (assignment: Assignment): { canDelete: boolean } => {
    if (!currentUser) return { canDelete: false };
    
    // Admins can always delete
    if (currentUser.role === 'admin') return { canDelete: true };
    
    // For personal assignments, check if current user is in target_users
    const isPersonalTarget = assignment.target_type === 'personal' && 
      Array.isArray(assignment.target_users) && 
      assignment.target_users.includes(currentUser.id);
    
    // Check if user is the creator
    const isCreator = assignment.created_by === currentUser.id;
    
    // Allow deletion if:
    // 1. It's a personal message they're targeted in, OR
    // 2. They created it (for any type of assignment)
    return { canDelete: isCreator || isPersonalTarget };
  };

  const handleDeleteAssignment = async (assignment: Assignment) => {
    try {
        console.log('=== DELETE OPERATION START ===');
        
        // Check if user has permission to delete
        const canDelete = currentUser?.role === 'admin' || 
                         assignment.created_by === currentUser?.id ||
                         (assignment.target_type === 'personal' && 
                          assignment.target_users?.includes(currentUser?.id || ''));

        if (!canDelete) {
            toast.error("Vous n'avez pas la permission de supprimer ce devoir");
            return;
        }

        // First verify the assignment exists
        const { data: existingAssignment, error: verifyError } = await supabase
            .from('assignments')
            .select('*')
            .eq('id', assignment.id)
            .single();

        if (verifyError) {
            console.error('Assignment not found:', verifyError);
            toast.error('Devoir introuvable');
            return;
        }

        // Execute delete
        const { error: deleteError } = await supabase
            .from('assignments')
            .delete()
            .eq('id', assignment.id);

        if (deleteError) {
            console.error('Delete error:', deleteError);
            toast.error(`Erreur de suppression: ${deleteError.message}`);
            return;
        }

        // Verify deletion
        const { data: checkData, error: checkError } = await supabase
            .from('assignments')
            .select('*')
            .eq('id', assignment.id)
            .single();

        if (checkError && checkError.code === 'PGRST116') {
            console.log('Delete confirmed - assignment no longer exists');
            toast.success('Devoir supprimé avec succès');
            onAssignmentDeleted();
        } else {
            console.error('Assignment still exists after deletion attempt');
            toast.error('La suppression a échoué, veuillez réessayer');
        }

        console.log('=== DELETE OPERATION COMPLETE ===');
    } catch (error) {
        console.error('=== UNEXPECTED ERROR ===');
        console.error('Caught in try/catch:', error);
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
        }
        toast.error('Erreur inattendue lors de la suppression');
    }
};

  const getTargetDisplay = (assignment: Assignment) => {
    if (assignment.target_type === 'global') return 'Tout le monde';
    if (assignment.target_type === 'group') return assignment.target_groups?.join(', ');
    if (assignment.target_type === 'personal' && assignment.target_users) {
      return assignment.target_users
        .map(userId => usernames[userId] || 'Utilisateur inconnu')
        .join(', ');
    }
    return '';
  };

  const getTimeLeftDisplay = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const daysLeft = differenceInDays(due, now);
    
    if (isPast(due)) {
      return {
        text: 'En retard',
        color: 'text-red-600 font-bold',
        timeAgo: formatDistanceToNow(due, { addSuffix: true, locale: fr })
      };
    }

    // Less than 24 hours
    if (daysLeft < 1) {
      return {
        text: 'Urgent',
        color: 'text-orange-600 font-bold',
        timeAgo: formatDistanceToNow(due, { addSuffix: true, locale: fr })
      };
    }

    // Less than 3 days
    if (daysLeft < 3) {
      return {
        text: 'Bientôt',
        color: 'text-yellow-600 font-bold',
        timeAgo: formatDistanceToNow(due, { addSuffix: true, locale: fr })
      };
    }

    // Less than a week
    if (daysLeft < 7) {
      return {
        text: 'Cette semaine',
        color: 'text-blue-600',
        timeAgo: formatDistanceToNow(due, { addSuffix: true, locale: fr })
      };
    }

    // More than a week
    return {
      text: 'À venir',
      color: 'text-green-600',
      timeAgo: formatDistanceToNow(due, { addSuffix: true, locale: fr })
    };
  };

  const canEditAssignment = (assignment: Assignment): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    
    const isCreator = assignment.created_by === currentUser.id;
    const isPersonalTarget = assignment.target_type === 'personal' && 
      Array.isArray(assignment.target_users) && 
      assignment.target_users.includes(currentUser.id);
    
    return isCreator || isPersonalTarget;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Timeline des devoirs</h2>
      <div className="space-y-4">
        {sortedAssignments.map((assignment) => {
          const timeLeft = getTimeLeftDisplay(assignment.due_date);
          const isPastDue = isPast(new Date(assignment.due_date));

          return (
            <div
              key={assignment.id}
              className={`p-4 rounded-lg border transition-all ${
                assignment.completed 
                  ? 'border-success bg-green-50' 
                  : isPastDue 
                    ? 'border-gray-300 bg-gray-100/50 opacity-60' 
                    : 'border-primary'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{assignment.title}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {assignment.target_type === 'personal' ? (
                        <span className="flex items-center gap-1">
                          Personnel ({getTargetDisplay(assignment)})
                        </span>
                      ) : (
                        <span>
                          {assignment.target_type === 'global' ? 'Tout le monde' : getTargetDisplay(assignment)}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{assignment.subject}</p>
                  <p className="text-sm text-gray-500">
                    Créateur : {usernames[assignment.created_by] || 'Inconnu'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-500">
                      {format(new Date(assignment.due_date), 'PPP', { locale: fr })}
                    </p>
                    <span className={`text-sm ${timeLeft.color}`}>
                      • {timeLeft.text}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({timeLeft.timeAgo})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const { canDelete } = canDeleteAssignment(assignment);
                    if (canDelete) {
                      return (
                        <button
                          onClick={() => handleDeleteAssignment(assignment)}
                          className="p-1 rounded-full hover:bg-red-50"
                          title="Supprimer le devoir"
                        >
                          <Trash2 className="h-5 w-5 text-red-500" />
                        </button>
                      );
                    } else {
                      return (
                        <button
                          className="p-1 rounded-full cursor-not-allowed opacity-50"
                          title="Vous n'êtes pas autorisé à supprimer ce devoir"
                          disabled
                        >
                          <Trash2 className="h-5 w-5 text-gray-400" />
                        </button>
                      );
                    }
                  })()}
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
                  {(() => {
                    const canEdit = canEditAssignment(assignment);
                    return (
                      <button
                        onClick={() => canEdit && setEditingAssignment(assignment)}
                        className={`p-1 rounded-full ${
                          canEdit 
                            ? 'hover:bg-blue-50 text-blue-500' 
                            : 'cursor-not-allowed opacity-50'
                        }`}
                        title={canEdit ? "Modifier le devoir" : "Vous n'êtes pas autorisé à modifier ce devoir"}
                        disabled={!canEdit}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    );
                  })()}
                </div>
              </div>
              {assignment.description && assignment.description.trim() !== '' && (
                <div 
                  className="mt-2 text-gray-600 prose max-w-none prose-strong:font-bold prose-em:italic"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(assignment.description, {
                      ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br'],
                      ALLOWED_ATTR: []
                    })
                  }}
                />
              )}
              {assignment.links && assignment.links.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {assignment.links.map((link, index) => {
                    const domain = new URL(link.url).hostname;
                    return (
                      <a 
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                          alt=""
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-600">{link.title}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {editingAssignment && (
        <EditAssignmentModal
          isOpen={true}
          onClose={() => setEditingAssignment(null)}
          currentUser={currentUser}
          assignment={editingAssignment}
          onAssignmentUpdated={() => {
            setEditingAssignment(null);
            onAssignmentDeleted(); // reuse this prop to refresh the list
          }}
        />
      )}
    </div>
  );
}