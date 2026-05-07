import { db } from '../firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';

export interface ComplianceStats {
  totalStudents: number;
  completePercent: number;
  docsPending: number;
  noBooking: number;
}

export const ComplianceService = {
  async getStats(): Promise<ComplianceStats> {
    const students = await getDocs(collection(db, 'users'));
    const allDocs = await getDocs(collection(db, 'documents'));
    const pendingDocs = allDocs.docs.filter(d => d.data().status === 'PENDING');
    const appointments = await getDocs(query(collection(db, 'appointments'), where('status', '==', 'CONFIRMED')));

    const total = students.size || 1;
    const bookedIds = new Set(appointments.docs.map(d => d.data().studentId));
    
    // Calculate real completion: sum of individual progress / total students
    const userDocs = allDocs.docs.reduce((acc: any, d) => {
      const data = d.data();
      if (!acc[data.studentId]) acc[data.studentId] = new Set();
      if (data.status === 'APPROVED') acc[data.studentId].add(data.type);
      return acc;
    }, {});

    let totalProgress = 0;
    students.docs.forEach(s => {
      const uid = s.id;
      const approvedTypes = userDocs[uid] || new Set();
      const hasBooking = bookedIds.has(uid);
      
      let studentProgress = 0;
      if (approvedTypes.has('CLEARANCE')) studentProgress += 25;
      if (approvedTypes.has('RECEIPT')) studentProgress += 25;
      if (hasBooking) studentProgress += 25;
      if (s.data().displayName) studentProgress += 25;
      
      totalProgress += studentProgress;
    });

    return {
      totalStudents: students.size,
      completePercent: Math.round(totalProgress / total),
      docsPending: pendingDocs.length,
      noBooking: students.size - bookedIds.size
    };
  },

  async getNonCompliantStudents() {
    const studentsRes = await getDocs(collection(db, 'users'));
    const docsRes = await getDocs(collection(db, 'documents'));
    const appointmentsRes = await getDocs(query(collection(db, 'appointments'), where('status', '==', 'CONFIRMED')));

    const bookedIds = new Set(appointmentsRes.docs.map(d => d.data().studentId));
    const studentDocs = docsRes.docs.reduce((acc: any, d) => {
      const data = d.data();
      if (!acc[data.studentId]) acc[data.studentId] = [];
      acc[data.studentId].push(data);
      return acc;
    }, {});

    return studentsRes.docs
      .map(s => {
        const uid = s.id;
        const data = s.data();
        const approvedDocs = (studentDocs[uid] || []).filter((d: any) => d.status === 'APPROVED').map((d: any) => d.type);
        const missing = [];
        if (!approvedDocs.includes('CLEARANCE')) missing.push('Clearance');
        if (!approvedDocs.includes('RECEIPT')) missing.push('Receipt');
        if (!bookedIds.has(uid)) missing.push('Booking');
        if (!data.displayName) missing.push('Profile');

        return {
          id: uid,
          name: data.displayName || 'Unnamed Student',
          missing: missing.join(', '),
          missingCount: missing.length
        };
      })
      .filter(s => s.missingCount > 0)
      .sort((a, b) => b.missingCount - a.missingCount);
  }
};
