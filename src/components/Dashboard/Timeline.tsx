import React from 'react';
import { Assignment } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, Circle } from 'lucide-react';

interface TimelineProps {
  assignments: Assignment[];
  onToggleComplete: (id: string) => void;
}

export default function Timeline({ assignments, onToggleComplete }: TimelineProps) {
  const sortedAssignments = [...assignments].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Timeline des devoirs</h2>
      <div className="space-y-4">
        {sortedAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className={`p-4 rounded-lg border ${
              assignment.completed ? 'border-success' : 'border-primary'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{assignment.title}</h3>
                <p className="text-sm text-gray-500">{assignment.subject}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(assignment.due_date), 'PPP', { locale: fr })}
                </p>
              </div>
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
            {assignment.description && (
              <p className="mt-2 text-gray-600">{assignment.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}