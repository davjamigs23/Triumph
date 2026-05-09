import { db } from '../firebase';
import { collection, doc, deleteDoc, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { AuditService } from './AuditService';

export interface Receipt {
  id: string;
  studentId: string;
  purpose: string;
  status: 'PAID' | 'PENDING' | 'REJECTED';
  date: string;
  referenceNo: string;
  imageUrl?: string;
}

export const ReceiptService = {
  async getAllReceipts(limitCount: number = 100, status?: string): Promise<Receipt[]> {
    let q;
    if (status && status !== 'ALL') {
      q = query(
        collection(db, 'receipts'), 
        where('status', '==', status),
        orderBy('date', 'desc'), 
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, 'receipts'), 
        orderBy('date', 'desc'), 
        limit(limitCount)
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Receipt));
  },

  async updateStatus(id: string, status: 'PAID' | 'PENDING' | 'REJECTED', adminId: string) {
    const { doc, updateDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'receipts', id);
    await updateDoc(docRef, { 
      status,
      updatedAt: new Date().toISOString()
    });
    await AuditService.log(adminId, 'UPDATE', 'RECEIPTS', `Updated receipt ${id} status to ${status}`);
  },

  async deleteReceipt(id: string, adminId: string) {
    const docRef = doc(db, 'receipts', id);
    await deleteDoc(docRef);
    await AuditService.log(adminId, 'DELETE', 'RECEIPTS', `Deleted receipt record ${id}`);
  }
};
