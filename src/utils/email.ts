import emailjs from '@emailjs/browser';
import { AttendanceSubmission } from '../types/attendance';

// Initialize EmailJS
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

export const sendEmailNotification = async (submission: AttendanceSubmission): Promise<void> => {
  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      {
        to_email: import.meta.env.VITE_GMAIL_RECIPIENT,
        from_name: submission.name,
        attending: submission.participating ? 'Yes' : 'No',
        attendee_count: submission.attendeeCount,
        non_attendee_count: submission.nonAttendeeCount ?? 0,
        note: submission.note || 'No notes',
        submitted_at: new Date(submission.submittedAt).toLocaleString()
      }
    );
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Failed to send email:', error);
    // Don't throw error for email failures - submission should still succeed
  }
};