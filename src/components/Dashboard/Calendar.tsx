import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Assignment } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarProps {
  assignments: Assignment[];
}

export default function Calendar({ assignments }: CalendarProps) {
  const events = assignments.map(assignment => ({
    id: assignment.id,
    title: assignment.title,
    start: assignment.due_date,
    backgroundColor: assignment.completed ? '#10B981' : '#4F46E5',
    borderColor: assignment.completed ? '#10B981' : '#4F46E5',
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        locale="fr"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        height="auto"
        buttonText={{
          today: 'Aujourd\'hui',
          month: 'Mois',
          week: 'Semaine',
          day: 'Jour',
        }}
      />
    </div>
  );
}