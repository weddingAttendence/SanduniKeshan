import { AttendanceSubmission, WeddingDayAttendee } from '../types/attendance';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'submissions';
const WEDDING_DAY_COLLECTION = 'wedding-day-attendees';

export const saveSubmission = async (submission: AttendanceSubmission): Promise<void> => {
  try {
    await addDoc(collection(db, COLLECTION_NAME), submission);
  } catch (error) {
    console.error('Error saving submission:', error);
    throw new Error('Failed to save submission');
  }
};

export const getSubmissions = async (): Promise<AttendanceSubmission[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('submittedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const submissions: AttendanceSubmission[] = [];
    querySnapshot.forEach((doc) => {
      submissions.push(doc.data() as AttendanceSubmission);
    });
    return submissions;
  } catch (error) {
    console.error('Error retrieving submissions:', error);
    return [];
  }
};

// Wedding Day Attendance Functions
export const addWeddingDayAttendee = async (attendee: Omit<WeddingDayAttendee, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, WEDDING_DAY_COLLECTION), attendee);
    return docRef.id;
  } catch (error) {
    console.error('Error adding wedding day attendee:', error);
    throw new Error('Failed to add attendee');
  }
};

export const getWeddingDayAttendees = async (): Promise<WeddingDayAttendee[]> => {
  try {
    const q = query(collection(db, WEDDING_DAY_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const attendees: WeddingDayAttendee[] = [];
    querySnapshot.forEach((doc) => {
      attendees.push({ ...doc.data() as WeddingDayAttendee, id: doc.id });
    });
    return attendees;
  } catch (error) {
    console.error('Error retrieving wedding day attendees:', error);
    return [];
  }
};

export const updateWeddingDayAttendee = async (attendeeId: string, updates: Partial<WeddingDayAttendee>): Promise<void> => {
  try {
    const attendeeRef = doc(db, WEDDING_DAY_COLLECTION, attendeeId);
    await updateDoc(attendeeRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating wedding day attendee:', error);
    throw new Error('Failed to update attendee');
  }
};

export const deleteWeddingDayAttendee = async (attendeeId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, WEDDING_DAY_COLLECTION, attendeeId));
  } catch (error) {
    console.error('Error deleting wedding day attendee:', error);
    throw new Error('Failed to delete attendee');
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};