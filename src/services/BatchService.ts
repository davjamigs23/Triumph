import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  getDocs, 
  where
} from 'firebase/firestore';
import { AuditService } from './AuditService';

export interface BatchGroup {
  id: string;
  name: string; // e.g. "BSIT 4-A"
  course: string;
  section: string;
  yearLevel: string;
  studentCount: number;
}

export const BatchService = {
  async createBatch(name: string, course: string, section: string, yearLevel: string, adminId: string) {
    const batch = {
      name,
      course,
      section,
      yearLevel,
      studentCount: 0,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'batches'), batch);
    await AuditService.log(adminId, 'CREATE', 'BATCHES', `Created batch ${name}`);
    return docRef.id;
  },

  async getAllBatches(): Promise<BatchGroup[]> {
    const snapshot = await getDocs(collection(db, 'batches'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BatchGroup));
  }
};
