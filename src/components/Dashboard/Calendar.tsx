import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Assignment } from '../../types';

interface CalendarProps {
  assignments: Assignment[];
}

export default function Calendar({ assignments }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAssignmentsForDay = (date: Date) => {
    return assignments.filter(assignment => 
      isSameDay(new Date(assignment.due_date), date)
    );
  };

  const truncateTitle = (title: string) => {
    const words = title.split(' ');
    if (words.length <= 2) return title;
    return words.slice(0, 2).join(' ') + '...';
  };

  const previousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const getDayClasses = (date: Date, hasAssignments: boolean) => {
    const baseClasses = "relative h-24 sm:h-32 border-b border-r dark:border-gray-800 p-1";
    const dayClasses = [baseClasses];

    if (!isSameMonth(date, currentDate)) {
      dayClasses.push("bg-gray-50/50 dark:bg-gray-900/50");
    }

    if (isToday(date)) {
      dayClasses.push("bg-blue-50 dark:bg-blue-900/20");
    }

    if (!hasAssignments) {
      dayClasses.push("opacity-60");
    }

    return dayClasses.join(" ");
  };

  const weekDays = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 text-sm rounded-l-md ${
                view === 'month'
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 text-sm rounded-r-md ${
                view === 'week'
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              Semaine
            </button>
          </div>
          <div className="flex items-center border dark:border-gray-700 rounded-md">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7">
        {weekDays.map(day => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border-b dark:border-gray-800"
          >
            {day}
          </div>
        ))}

        {days.map(day => {
          const dayAssignments = getAssignmentsForDay(day);
          const hasAssignments = dayAssignments.length > 0;

          return (
            <div
              key={day.toString()}
              className={getDayClasses(day, hasAssignments)}
            >
              <div className={`flex items-start justify-between ${!hasAssignments ? 'opacity-60' : ''}`}>
                <span
                  className={`text-sm ${
                    !isSameMonth(day, currentDate)
                      ? 'text-gray-400 dark:text-gray-600'
                      : isToday(day)
                        ? 'text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-gray-900 dark:text-gray-100'
                  } ${!hasAssignments ? 'text-xs' : ''}`}
                >
                  {format(day, 'd')}
                </span>
                {hasAssignments && (
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {dayAssignments.length} devoir{dayAssignments.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {hasAssignments && (
                <div className="mt-1 space-y-1">
                  {dayAssignments.map((assignment, index) => {
                    const isCompleted = false; // À remplacer par la vraie logique de complétion
                    const bgColorClass = assignment.target_type === 'personal' 
                      ? 'bg-emerald-500 dark:bg-emerald-600'
                      : assignment.target_type === 'group'
                        ? 'bg-indigo-500 dark:bg-indigo-600'
                        : 'bg-blue-500 dark:bg-blue-600';

                    return (
                      <div
                        key={assignment.id}
                        className={`text-xs px-1.5 py-0.5 rounded ${bgColorClass} text-white truncate`}
                        title={`${assignment.title} (${assignment.target_type})`}
                      >
                        {truncateTitle(assignment.title)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}