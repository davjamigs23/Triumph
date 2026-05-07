import { db } from '../firebase';
import { collection, doc, deleteDoc, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { AuditService } from './AuditService';

export interface Receipt {
  id: string;
  studentId: string;
  purpose: string;
  status: 'PAID' | 'PENDING';
  date: string;
  referenceNo: string;
  imageUrl?: string;
}

export const ReceiptService = {
  async getAllReceipts(limitCount: number = 100): Promise<Receipt[]> {
    const q = query(collection(db, 'receipts'), orderBy('date', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Receipt));
  },

  async deleteReceipt(id: string, adminId: string) {
    const docRef = doc(db, 'receipts', id);
    await deleteDoc(docRef);
    await AuditService.log(adminId, 'DELETE', 'RECEIPTS', `Deleted receipt record ${id}`);
  }
};
