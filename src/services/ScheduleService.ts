import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { BookingSession } from '../types';
import { AuditService } from './AuditService';

const AVAILABLE_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', 
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
];

export const ScheduleService = {
  getAvailableTimeSlots: () => AVAILABLE_SLOTS,

  subscribeToStudentBooking(studentId: string, callback: (booking: BookingSession | null) => void) {
    const q = query(
      collection(db, 'appointments'),
      where('studentId', '==', studentId),
      where('status', '==', 'CONFIRMED')
    );
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null);
      } else {
        callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BookingSession);
      }
    });
  },

  async getBookedSlots(date: string) {
    const q = query(collection(db, 'appointments'), where('date', '==', date), where('status', '==', 'CONFIRMED'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookingSession));
  },

  async bookSession(studentId: string, date: string, timeSlot: string) {
    // Conflict Check
    const q = query(
      collection(db, 'appointments'), 
      where('date', '==', date), 
      where('timeSlot', '==', timeSlot),
      where('status', '==', 'CONFIRMED')
    );
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      throw new Error('This time slot has just been taken. Please select another slot.');
    }

    // User conflict check (one active booking at a time?)
    const userQ = query(
      collection(db, 'appointments'),
      where('studentId', '==', studentId),
      where('status', '==', 'CONFIRMED')
    );
    const userExisting = await getDocs(userQ);
    if (!userExisting.empty) {
      throw new Error('You already have an active booking. Please reschedule your existing one.');
    }

    const booking: Omit<BookingSession, 'id'> = {
      studentId,
      date,
      timeSlot,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'appointments'), booking);
    await AuditService.log(studentId, 'BOOK', 'SCHEDULE', `Booked session for ${date} at ${timeSlot}`);
    return docRef.id;
  },

  async cancelSession(bookingId: string, studentId: string, bookingDate: string) {
    const sessionDate = new Date(bookingDate);
    const now = new Date();
    const diffHours = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24 && sessionDate > now) {
      throw new Error('Cancellation window expired. Appointments must be cancelled at least 24 hours before your session.');
    }

    const docRef = doc(db, 'appointments', bookingId);
    await updateDoc(docRef, { status: 'CANCELLED', updatedAt: new Date().toISOString() });
    await AuditService.log(studentId, 'CANCEL', 'SCHEDULE', `Cancelled session ${bookingId}`);
  },

  async getStudentBooking(studentId: string) {
    const q = query(
      collection(db, 'appointments'),
      where('studentId', '==', studentId),
      where('status', '==', 'CONFIRMED')
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as BookingSession;
  }
};
