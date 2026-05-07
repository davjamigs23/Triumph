import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { AuditLogEntry } from '../types';

export class AuditService {
  private static COLLECTION = 'audit_logs';

  static async log(userId: string, action: string, module: string, details: string) {
    try {
      await addDoc(collection(db, this.COLLECTION), {
        userId,
        action,
        module,
        details,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Logging failed:', error);
    }
  }

  static async getLogs(max = 100): Promise<any[]> {
    const q = query(
      collection(db, this.COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(max)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}
