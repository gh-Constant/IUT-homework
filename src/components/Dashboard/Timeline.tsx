import React, { useState, useEffect, useRef } from 'react';
import { Assignment, User } from '../../types';
import { format, isPast, formatDistanceToNow, differenceInDays, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, Circle, Trash2, Edit, ChevronUp, ChevronDown, Calendar, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import EditAssignmentModal from './EditAssignmentModal';
import Cookies from 'js-cookie';
import { scheduleAssignmentReminder, cancelAssignmentReminder } from '../../utils/notifications';

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

const getTimeRemainingDisplay = (dueDate: string, isCompleted: boolean) => {
  if (isCompleted) return { 
    text: "TERMINÉ", 
    class: "bg-success/10 text-success border-success/20" 
  };

  const now = new Date();
  const due = new Date(dueDate);
  const daysLeft = differenceInDays(due, now);
  const hoursLeft = differenceInHours(due, now);

  if (isPast(due)) return { 
    text: "EN RETARD", 
    class: "bg-red-950/5 text-red-950/50 border-red-950/10" 
  };
  
  if (daysLeft === 0) {
    if (hoursLeft <= 1) return { 
      text: "MOINS D'UNE HEURE", 
      class: "bg-red-100 text-red-800 border-red-200"
    };
    return { 
      text: `${hoursLeft} HEURES RESTANTES`, 
      class: "bg-red-100 text-red-800 border-red-200"
    };
  }
  if (daysLeft === 1) return { 
    text: "1 JOUR RESTANT", 
    class: "bg-orange-100 text-orange-800 border-orange-200"
  };
  if (daysLeft <= 3) return { 
    text: `${daysLeft} JOURS RESTANTS`, 
    class: "bg-orange-100 text-orange-800 border-orange-200"
  };
  if (daysLeft <= 7) return { 
    text: `${daysLeft} JOURS RESTANTS`, 
    class: "bg-blue-100 text-blue-800 border-blue-200"
  };
  return { 
    text: `${daysLeft} JOURS RESTANTS`, 
    class: "bg-gray-100 text-gray-800 border-gray-200"
  };
};

const getWebsiteLogo = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return ''; // Return empty if URL is invalid
  }
};

export default function Timeline({ assignments, onToggleComplete, currentUser, onAssignmentDeleted }: TimelineProps) {
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [completions, setCompletions] = useState<Record<string, boolean>>(() => {
    if (!currentUser) return {};
    // Load initial state from user-specific cookie
    const cookieKey = `assignment_completions_${currentUser.id}`;
    const savedCompletions = Cookies.get(cookieKey);
    return savedCompletions ? JSON.parse(savedCompletions) : {};
  });
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [shouldShowButton, setShouldShowButton] = useState<Record<string, boolean>>({});
  const descriptionRefs = useRef<Record<string, HTMLDivElement>>({});

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

  useEffect(() => {
    assignments.forEach(assignment => {
      const element = descriptionRefs.current[assignment.id];
      if (element) {
        setShouldShowButton(prev => ({
          ...prev,
          [assignment.id]: element.scrollHeight > 80 // 5 lines approximately
        }));
      }
    });
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

  const handleToggleComplete = async (assignmentId: string) => {
    if (!currentUser) {
      toast.error('Vous devez être connecté pour marquer un devoir comme terminé');
      return;
    }

    try {
      const cookieKey = `assignment_completions_${currentUser.id}`;
      const isCompleted = completions[assignmentId];
      
      // Update local state first for immediate feedback
      const newCompletions = { ...completions };
      if (isCompleted) {
        delete newCompletions[assignmentId];
        await scheduleAssignmentReminder(assignments.find(a => a.id === assignmentId)!);
      } else {
        newCompletions[assignmentId] = true;
        await cancelAssignmentReminder(assignmentId);
        // Show completion animation
        toast.success('🎉 Devoir terminé !', {
          icon: '✨',
          style: {
            border: '1px solid #10B981',
            padding: '16px',
            color: '#059669',
            backgroundColor: '#ECFDF5',
          },
          duration: 2000,
        });
      }
      
      // Save to user-specific cookie
      Cookies.set(cookieKey, JSON.stringify(newCompletions), {
        expires: 365,
        secure: true,
        sameSite: 'strict'
      });
      
      // Update state
      setCompletions(newCompletions);

    } catch (error) {
      console.error('Error toggling completion:', error);
      toast.error('Une erreur est survenue lors de la modification');
    }
  };

  // Update effect to use user-specific 
  useEffect(() => {
    if (!currentUser) return;
    
    const cookieKey = `assignment_completions_${currentUser.id}`;
    const savedCompletions = Cookies.get(cookieKey);
    
    if (savedCompletions) {
      try {
        setCompletions(JSON.parse(savedCompletions));
      } catch (error) {
        console.error('Error parsing saved completions:', error);
        // If parsing fails, reset the cookie
        Cookies.remove(cookieKey);
      }
    }
  }, [currentUser]); // Re-run when user changes

  const toggleDescription = (assignmentId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [assignmentId]: !prev[assignmentId]
    }));
  };

  const getUrgencyStatus = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysLeft = differenceInDays(due, now);
    
    if (isPast(due)) return { text: "En retard", class: "bg-red-100 text-red-800" };
    if (daysLeft <= 1) return { text: "Urgent", class: "bg-red-100 text-red-800" };
    if (daysLeft <= 3) return { text: "Bientôt", class: "bg-orange-100 text-orange-800" };
    if (daysLeft <= 7) return { text: "Cette semaine", class: "bg-blue-100 text-blue-800" };
    return { text: "À venir", class: "bg-gray-100 text-gray-800" };
  };

  return (
    <div className="px-4 md:px-6 pb-[calc(env(safe-area-inset-bottom,_1rem)_+_5rem)] max-w-4xl mx-auto space-y-4">
      {sortedAssignments.map((assignment) => {
        const timeRemaining = getTimeRemainingDisplay(assignment.due_date, completions[assignment.id]);
        const formattedDate = format(new Date(assignment.due_date), 'dd/MM/yyyy');
        const canEdit = canEditAssignment(assignment);
        const { canDelete } = canDeleteAssignment(assignment);

        return (
          <div
            key={assignment.id}
            className={`rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
              completions[assignment.id] 
                ? 'border-success/20 bg-success/5' 
                : isPast(new Date(assignment.due_date)) 
                  ? 'border-red-950/10 bg-red-950/5' 
                  : 'border-primary/20 hover:border-primary/30'
            }`}
          >
            {/* Time remaining banner - now showing completion status */}
            <div 
              className={`w-full px-4 py-3 ${
                getTimeRemainingDisplay(assignment.due_date, completions[assignment.id]).class
              } border-b font-bold text-center text-lg md:text-xl tracking-wide ${
                isPast(new Date(assignment.due_date)) && !completions[assignment.id] 
                  ? 'opacity-50' 
                  : ''
              }`}
            >
              {getTimeRemainingDisplay(assignment.due_date, completions[assignment.id]).text}
            </div>

            {/* Main card content */}
            <div className={`p-4 ${
              isPast(new Date(assignment.due_date)) && !completions[assignment.id] 
                ? 'opacity-50' 
                : ''
            }`}>
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg">{assignment.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-sm text-gray-600 flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        Pour le {formattedDate}
                      </span>
                      <span className="text-sm text-gray-600">
                        • Par {usernames[assignment.created_by] || 'Chargement...'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {canEdit && (
                      <button
                        onClick={() => setEditingAssignment(assignment)}
                        className="p-1.5 rounded-full hover:bg-blue-50 text-blue-500 transition-colors"
                        title="Modifier le devoir"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleComplete(assignment.id)}
                      className={`p-1.5 rounded-full transition-colors ${
                        completions[assignment.id] 
                          ? 'text-success hover:bg-success/10' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {completions[assignment.id] ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteAssignment(assignment)}
                        className="p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                        title="Supprimer le devoir"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Add links section here, before the expandable content */}
            {assignment.links && assignment.links.length > 0 && (
              <div className="px-4 py-2 flex flex-wrap gap-2">
                {assignment.links.map((link: { url: string; title: string }, index: number) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm transition-colors"
                  >
                    {getWebsiteLogo(link.url) ? (
                      <img src={getWebsiteLogo(link.url)} alt="" className="w-4 h-4" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                    {link.title || 'Voir le lien'}
                  </a>
                ))}
              </div>
            )}

            {/* Expandable content */}
            {assignment.description && (
              <>
                <div 
                  ref={el => {
                    if (el) descriptionRefs.current[assignment.id] = el;
                  }}
                  className={`px-4 overflow-hidden transition-all duration-200 ${
                    !expandedDescriptions[assignment.id] ? 'max-h-0' : 'max-h-[1000px] pb-4'
                  }`}
                >
                  <div className="pt-4 border-t">
                    {/* Target groups/users info */}
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Pour : </span>
                      <span className="text-sm text-gray-600">
                        {assignment.target_type === 'personal' 
                          ? `Personnel (${getTargetDisplay(assignment)})` 
                          : assignment.target_type === 'global' 
                            ? 'Tout le monde' 
                            : getTargetDisplay(assignment)}
                      </span>
                    </div>

                    {/* Description */}
                    <div 
                      className="text-gray-600 prose max-w-none prose-strong:font-bold prose-em:italic"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(assignment.description, {
                          ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br'],
                          ALLOWED_ATTR: []
                        })
                      }}
                    />

                    {/* Delete button */}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteAssignment(assignment)}
                        className="mt-4 w-full py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer le devoir
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => toggleDescription(assignment.id)}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-b-xl text-gray-700 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {expandedDescriptions[assignment.id] ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Voir moins
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Voir plus
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        );
      })}
      {editingAssignment && (
        <EditAssignmentModal
          isOpen={!!editingAssignment}
          onClose={() => setEditingAssignment(null)}
          currentUser={currentUser!}
          assignment={editingAssignment}
          onAssignmentUpdated={() => {
            setEditingAssignment(null);
            onAssignmentDeleted(); // Using the existing prop to refresh the list
          }}
        />
      )}
    </div>
  );
}