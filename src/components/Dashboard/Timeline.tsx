import React from 'react';
import { Assignment, User } from '../../types';
import AssignmentCard from './AssignmentCard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimelineProps {
  assignments: Assignment[];
  onToggleComplete: (assignmentId: string) => void;
  currentUser: User;
  onAssignmentDeleted: () => void;
  showArchived?: boolean;
}

export default function Timeline({ 
  assignments, 
  onToggleComplete, 
  currentUser, 
  onAssignmentDeleted,
  showArchived = false 
}: TimelineProps) {
  // Grouper les devoirs par mois
  const groupedAssignments: [string, Assignment[]][] = assignments.reduce((groups, assignment) => {
    const date = new Date(assignment.due_date);
    const monthKey = format(date, 'MMMM yyyy', { locale: fr });
    
    const existingGroup = groups.find(([month]) => month === monthKey);
    if (existingGroup) {
      existingGroup[1].push(assignment);
    } else {
      groups.push([monthKey, [assignment]]);
    }
    
    return groups;
  }, [] as [string, Assignment[]][]);

  // Trier les groupes par date
  groupedAssignments.sort(([monthA], [monthB]) => {
    const dateA = new Date(monthA);
    const dateB = new Date(monthB);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="space-y-6">
      {groupedAssignments.map(([month, monthAssignments]) => (
        <div key={month} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {month}
            {showArchived && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                ({monthAssignments.length} devoir{monthAssignments.length > 1 ? 's' : ''})
              </span>
            )}
          </h2>
          <div className="space-y-4">
            {monthAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onToggleComplete={onToggleComplete}
                currentUser={currentUser}
                onAssignmentDeleted={onAssignmentDeleted}
                showArchived={showArchived}
              />
            ))}
          </div>
        </div>
      ))}
      {assignments.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {showArchived 
              ? "Aucun devoir archivé trouvé"
              : "Aucun devoir à venir"
            }
          </p>
        </div>
      )}
    </div>
  );
}