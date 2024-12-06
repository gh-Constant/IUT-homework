import { LocalNotifications } from '@capacitor/local-notifications';
import { Assignment } from '../types';
import { addDays, subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function scheduleAssignmentReminder(assignment: Assignment) {
  try {
    // Request permission
    const permissionStatus = await LocalNotifications.requestPermissions();
    
    if (permissionStatus.display !== 'granted') {
      console.warn('Notification permissions not granted');
      return;
    }

    // Calculate notification time (1 day before due date)
    const dueDate = new Date(assignment.due_date);
    const notificationDate = subDays(dueDate, 1);
    
    // Don't schedule if the due date is in the past or today
    if (notificationDate <= new Date()) {
      return;
    }

    // Schedule the notification
    await LocalNotifications.schedule({
      notifications: [
        {
          id: parseInt(assignment.id), // Convert string ID to number
          title: '📚 Rappel de devoir',
          body: `"${assignment.title}" est à rendre ${format(dueDate, 'EEEE d MMMM', { locale: fr })}`,
          schedule: { at: notificationDate },
          sound: 'beep.wav',
          actionTypeId: 'OPEN_ASSIGNMENT',
          extra: {
            assignmentId: assignment.id
          }
        }
      ]
    });

    console.log(`Reminder scheduled for ${assignment.title}`);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

export async function cancelAssignmentReminder(assignmentId: string) {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: parseInt(assignmentId) }]
    });
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}