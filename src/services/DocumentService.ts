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
  onSnapshot
} from 'firebase/firestore';
import { DocumentSubmission } from '../types';
import { AuditService } from './AuditService';

export const DocumentService = {
  async submitDocument(studentId: string, type: DocumentSubmission['type'], fileName: string, fileUrl: string = 'https://picsum.photos/seed/doc/800/1000') {
    const submission: Omit<DocumentSubmission, 'id'> = {
      studentId,
      type,
      fileName,
      fileUrl,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'documents'), submission);
    await AuditService.log(studentId, 'SUBMIT', 'DOCUMENTS', `Submitted ${type}: ${fileName}`);
    return docRef.id;
  },

  async getStudentDocuments(studentId: string) {
    const q = query(
      collection(db, 'documents'), 
      where('studentId', '==', studentId),
      orderBy('submittedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentSubmission));
  },

  async getAllPending() {
    const q = query(collection(db, 'documents'), where('status', '==', 'PENDING'), orderBy('submittedAt', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentSubmission));
  },

  async reviewDocument(docId: string, status: 'APPROVED' | 'REJECTED', adminId: string, reason?: string) {
    const docRef = doc(db, 'documents', docId);
    const updateData: any = { 
      status, 
      verifiedBy: adminId,
      updatedAt: new Date().toISOString()
    };
    if (reason) updateData.rejectionReason = reason;

    await updateDoc(docRef, updateData);
    await AuditService.log(adminId, status, 'DOCUMENTS', `Reviewed doc ${docId}: ${status}${reason ? ` - ${reason}` : ''}`);
  }
};
