import React, { useState, useRef, useEffect } from 'react';
import { format, isPast } from 'date-fns';
import {
  Calendar,
  Users,
  Edit,
  Circle,
  CheckCircle,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { Assignment, User } from '../../types';
import EditAssignmentModal from './EditAssignmentModal';

interface AssignmentCardProps {
  assignment: Assignment;
  onToggleComplete: (assignmentId: string) => void;
  currentUser: User;
  onAssignmentDeleted: () => void;
  showArchived?: boolean;
}

// Simulation des données pour le développement local
const mockData = {
  completions: new Map<string, boolean>(),
  usernames: new Map<string, string>([
    ['1', 'John Doe'],
    ['2', 'Jane Smith'],
    ['3', 'Alice Johnson']
  ]),
  votes: new Map<string, number>(),
  hasVoted: new Map<string, boolean>()
};

export default function AssignmentCard({
  assignment,
  onToggleComplete,
  currentUser,
  onAssignmentDeleted,
  showArchived = false
}: AssignmentCardProps) {
  const [isCompleted, setIsCompleted] = useState(mockData.completions.get(assignment.id) || false);
  const [showWarning, setShowWarning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const descriptionRef = useRef<HTMLDivElement | null>(null);

  const votes = mockData.votes.get(assignment.id) || 0;
  const hasVoted = mockData.hasVoted.get(assignment.id) || false;
  const requiredVotes = Math.ceil((assignment.target_type === 'global' ? 10 : 5) * 0.3); // 30% des utilisateurs

  useEffect(() => {
    if (descriptionRef.current) {
      setHasOverflow(descriptionRef.current.scrollHeight > 80);
    }
  }, [assignment.description]);

  const handleToggleComplete = () => {
    setIsCompleted(!isCompleted);
    mockData.completions.set(assignment.id, !isCompleted);
    onToggleComplete(assignment.id);
  };

  const handleVoteForDeletion = () => {
    if (hasVoted) return;

    if (showWarning) {
      const newVotes = votes + 1;
      mockData.votes.set(assignment.id, newVotes);
      mockData.hasVoted.set(assignment.id, true);

      if (newVotes >= requiredVotes) {
        onAssignmentDeleted();
      }
      setShowWarning(false);
    } else {
      setShowWarning(true);
    }
  };

  const canEdit = currentUser.role === 'admin' || assignment.created_by === currentUser.id;
  const canDelete = currentUser.role === 'admin' || assignment.created_by === currentUser.id;
  const isLate = isPast(new Date(assignment.due_date)) && !isCompleted;

  const getTargetDisplay = () => {
    if (assignment.target_type === 'global') return 'Tout le monde';
    if (assignment.target_type === 'group') return assignment.target_groups?.join(', ') || '';
    if (assignment.target_type === 'personal') {
      return assignment.target_users
        ?.map(id => mockData.usernames.get(id) || 'Utilisateur inconnu')
        .join(', ') || '';
    }
    return '';
  };

  return (
    <>
      <div
        className={`bg-white dark:bg-gray-900 rounded-xl border ${
          isLate && !showArchived
            ? 'border-red-300 dark:border-red-700 shadow-red-100 dark:shadow-red-900/30'
            : 'border-gray-200 dark:border-gray-700'
        } shadow-sm overflow-hidden`}
      >
        {showWarning && (
          <div className="px-6 py-3 bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Êtes-vous sûr de vouloir voter pour la suppression ? Il faut {requiredVotes} votes pour supprimer ce devoir.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWarning(false)}
                  className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleVoteForDeletion}
                  className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`px-6 py-4 ${
          isLate && !showArchived
            ? 'bg-red-50 dark:bg-red-900/20'
            : showArchived
              ? 'bg-gray-100 dark:bg-gray-800/50'
              : 'bg-gray-50 dark:bg-gray-800'
        } border-b border-gray-200 dark:border-gray-700`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${
              isLate && !showArchived
                ? 'text-red-900 dark:text-red-300'
                : 'text-gray-900 dark:text-white'
            }`}>
              {assignment.title}
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>0/0</span>
              </div>
              {!showArchived && (
                <div className="flex items-center gap-1.5">
                  {canEdit && (
                    <button
                      onClick={() => setEditingAssignment(assignment)}
                      className="p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 transition-colors"
                      title="Modifier le devoir"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={handleToggleComplete}
                    className={`p-1.5 rounded-full transition-colors ${
                      isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                        : isLate
                          ? 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900'
                          : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  {canDelete && (
                    <button
                      onClick={onAssignmentDeleted}
                      className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors"
                      title="Supprimer le devoir"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                  {!canDelete && !showArchived && (
                    <div className="relative">
                      <button
                        onClick={handleVoteForDeletion}
                        className={`p-1.5 rounded-full transition-colors relative ${
                          votes >= requiredVotes
                            ? 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900'
                            : votes > 0
                              ? 'text-orange-500 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900'
                              : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        title={`${votes}/${requiredVotes} votes pour la suppression`}
                      >
                        <AlertTriangle className="h-5 w-5" />
                        {!hasVoted && votes > 0 && (
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400">
                            {votes}/{requiredVotes}
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-4">
            <span className={`text-sm flex items-center ${
              isLate && !showArchived
                ? 'text-red-700 dark:text-red-300 font-medium'
                : 'text-gray-600 dark:text-gray-300'
            }`}>
              <Calendar className="w-4 h-4 mr-1.5" />
              Pour le {format(new Date(assignment.due_date), 'dd/MM/yyyy')}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              • Par {mockData.usernames.get(assignment.created_by) || 'Utilisateur inconnu'}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              • Pour {assignment.target_type === 'personal'
                ? `Personnel (${getTargetDisplay()})`
                : assignment.target_type === 'global'
                  ? 'Tout le monde'
                  : getTargetDisplay()}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div
            ref={descriptionRef}
            className={`overflow-hidden transition-all duration-200 ${
              isExpanded ? 'max-h-[1000px]' : 'max-h-20'
            }`}
          >
            <div
              className="text-gray-700 dark:text-gray-200 prose dark:prose-invert max-w-none prose-strong:font-bold prose-em:italic prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(assignment.description, {
                  ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'a'],
                  ALLOWED_ATTR: ['href']
                })
              }}
            />
          </div>

          {hasOverflow && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              {isExpanded ? (
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
          )}
        </div>
      </div>

      {editingAssignment && (
        <EditAssignmentModal
          isOpen={!!editingAssignment}
          onClose={() => setEditingAssignment(null)}
          currentUser={currentUser}
          assignment={editingAssignment}
          onAssignmentUpdated={() => {
            setEditingAssignment(null);
            onAssignmentDeleted();
          }}
        />
      )}
    </>
  );
} 