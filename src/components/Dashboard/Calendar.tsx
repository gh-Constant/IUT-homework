import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Assignment } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

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
    classNames: ['text-sm', 'rounded-lg', 'font-medium', 'cursor-pointer'],
    extendedProps: {
      description: assignment.description,
    }
  }));

  const handleEventClick = (info: any) => {
    toast(info.event.title, {
      duration: 3000,
      position: 'bottom-center',
      style: {
        background: '#f8fafc',
        color: '#1f2937',
        border: '1px solid #e2e8f0',
        padding: '1rem',
        borderRadius: '0.5rem',
        maxWidth: '90vw',
        wordBreak: 'break-word'
      },
    });
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="fullcalendar-custom">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="fr"
          headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          events={events}
          height="auto"
          buttonText={{
            today: 'Aujourd\'hui',
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
          }}
          dayMaxEvents={2}
          moreLinkText={count => `+${count} autres`}
          eventDisplay="block"
          eventClick={handleEventClick}
          views={{
            dayGridMonth: {
              titleFormat: { year: 'numeric', month: 'long' },
              dayHeaderFormat: { weekday: 'short' },
            },
            timeGridWeek: {
              titleFormat: { year: 'numeric', month: 'long' },
              dayHeaderFormat: { weekday: 'short', day: 'numeric' },
            },
          }}
        />
      </div>

      <style jsx global>{`
        .fullcalendar-custom .fc {
          max-width: 100%;
          font-family: inherit;
        }

        /* Header Styling */
        .fullcalendar-custom .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 600;
          color: #1f2937;
        }

        .fullcalendar-custom .fc-button {
          background: #f3f4f6 !important;
          border: 1px solid #e5e7eb !important;
          color: #4b5563 !important;
          font-weight: 500 !important;
          padding: 0.5rem 1rem !important;
          height: auto !important;
          box-shadow: none !important;
        }

        .fullcalendar-custom .fc-button-active {
          background: #4f46e5 !important;
          color: white !important;
          border-color: #4f46e5 !important;
        }

        /* Calendar Grid */
        .fullcalendar-custom .fc-day {
          background: white;
        }

        .fullcalendar-custom .fc-day-today {
          background: #f8fafc !important;
        }

        .fullcalendar-custom .fc-day-header {
          padding: 0.5rem 0 !important;
          font-weight: 500;
        }

        .fullcalendar-custom .fc-daygrid-day-number {
          padding: 0.5rem;
          color: #64748b;
        }

        /* Events */
        .fullcalendar-custom .fc-event {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
          border-radius: 0.375rem;
          margin: 1px 2px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          cursor: pointer;
        }

        .fullcalendar-custom .fc-event-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .fullcalendar-custom .fc-more-link {
          color: #6b7280;
          font-weight: 500;
        }

        /* Mobile Optimizations */
        @media (max-width: 640px) {
          .fullcalendar-custom .fc-toolbar {
            flex-direction: column;
            gap: 1rem;
          }

          .fullcalendar-custom .fc-toolbar-title {
            font-size: 1.125rem !important;
          }

          .fullcalendar-custom .fc-button {
            padding: 0.375rem 0.75rem !important;
            font-size: 0.875rem !important;
          }

          .fullcalendar-custom .fc-col-header-cell-cushion {
            font-size: 0.875rem;
          }

          .fullcalendar-custom .fc-daygrid-day-number {
            font-size: 0.875rem;
          }

          .fullcalendar-custom .fc-event {
            padding: 0.125rem 0.25rem;
            font-size: 0.75rem;
          }
          
          .fullcalendar-custom .fc-event-title {
            font-size: 0.75rem;
            line-height: 1.2;
          }
        }

        /* Hide unnecessary elements on mobile */
        @media (max-width: 480px) {
          .fullcalendar-custom .fc-timeGridWeek-button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}