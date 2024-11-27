import React, { useState, useEffect } from 'react';
import { Assignment, User } from '../../types';
import { format, isPast, formatDistanceToNow, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, Circle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';

interface TimelineProps {
  assignments: Assignment[];
  onToggleComplete: (id: string) => void;
  currentUser: User | null;
  onAssignmentDeleted: () => void;
}

export default function Timeline({ assignments, onToggleComplete, currentUser, onAssignmentDeleted }: TimelineProps) {
  const [usernames, setUsernames] = useState<Record<string, string>>({});

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

  const canDeleteAssignment = (assignment: Assignment): { canDelete: boolean; timeLeft?: number } => {
    if (!currentUser) return { canDelete: false };
    
    // Admins can delete any assignment
    if (currentUser.role === 'admin') return { canDelete: true };
    
    // Check if user is the owner of the assignment
    const isOwner = assignment.created_by === currentUser.id;
    
    // For personal assignments, check if the current user is a target
    const isPersonalTarget = assignment.target_type === 'personal' && 
      assignment.target_users?.includes(currentUser.id);
    
    // Only allow deletion if:
    // 1. User is the owner, OR
    // 2. Assignment is personal type AND user is a target
    // Note: Global and group assignments can only be deleted by owner or admin
    if (!isOwner && !isPersonalTarget) return { canDelete: false };
    
    // For non-admins, check if assignment is older than 10 minutes
    const creationTime = new Date(assignment.created_at).getTime();
    const currentTime = new Date().getTime();
    const tenMinutesInMs = 10 * 60 * 1000;
    const timeDiff = currentTime - creationTime;
    
    if (timeDiff > tenMinutesInMs) {
      return { canDelete: true };
    }
    
    // Calculate time left in minutes
    const timeLeft = Math.ceil((tenMinutesInMs - timeDiff) / 60000);
    return { canDelete: false, timeLeft };
  };

  const handleDeleteAssignment = async (assignment: Assignment) => {
    try {
        console.log('=== DELETE OPERATION START ===');
        console.log('Step 1: Delete attempt initiated');
        
        // Check for 10-minute delay for non-admins
        if (currentUser?.role !== 'admin') {
            const creationTime = new Date(assignment.created_at).getTime();
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - creationTime;
            const timeLeft = Math.ceil((600000 - timeDiff) / 60000); // Convert to minutes

            if (timeDiff < 600000) { // 10 minutes in milliseconds
                toast.error(`Vous devez attendre encore ${timeLeft} minute(s) avant de pouvoir supprimer ce devoir`);
                return;
            }
        }

        console.log('Assignment details:', {
            id: assignment.id,
            title: assignment.title,
            created_at: assignment.created_at,
            timeSinceCreation: Math.floor((new Date().getTime() - new Date(assignment.created_at).getTime()) / 60000) + ' minutes'
        });

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
                    ? 'border-red-300 bg-red-50/50' 
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
                    const { canDelete, timeLeft } = canDeleteAssignment(assignment);
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
                      const tooltipText = timeLeft !== undefined
                        ? `Vous pourrez supprimer dans ${timeLeft} minute${timeLeft > 1 ? 's' : ''}`
                        : assignment.target_type === 'personal'
                          ? "Vous n'êtes pas concerné par ce devoir"
                          : "Seul l'administrateur ou le créateur peut supprimer ce devoir";

                      return (
                        <button
                          className="p-1 rounded-full cursor-not-allowed opacity-50"
                          title={tooltipText}
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
                </div>
              </div>
              {assignment.description && (
                <div 
                  className="mt-2 text-gray-600"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(assignment.description)
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}