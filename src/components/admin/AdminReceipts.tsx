import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, query, getDocs, orderBy, limit, addDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FileText, Search, CreditCard, DollarSign, Download, Plus, X, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { AuditService } from '../../services/AuditService';
import { ReceiptService, Receipt } from '../../services/ReceiptService';

export default function AdminReceipts() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [newReceipt, setNewReceipt] = useState({ studentId: '', purpose: 'YEARBOOK_FEE', referenceNo: '', status: 'PENDING' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleUpdateStatus = async (id: string, newStatus: 'PAID' | 'PENDING' | 'REJECTED') => {
    if (!user) return;
    try {
      await ReceiptService.updateStatus(id, newStatus, user.uid);
      setReceipts(receipts.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm('Permanently delete this receipt record?')) return;
    try {
      await ReceiptService.deleteReceipt(id, user.uid);
      setReceipts(receipts.filter(r => r.id !== id));
      alert('Receipt deleted.');
    } catch (e) {
      console.error(e);
      alert('Failed to delete receipt');
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'receipts'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Receipt));
      if (filterStatus !== 'ALL') {
        data = data.filter(r => r.status === filterStatus);
      }
      setReceipts(data);
      setLoading(false);
    });
    return () => unsub();
  }, [filterStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setUploading(true);
    setError(null);
    try {
      let imageUrl = '';
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error('File is too large (max 5MB)');
        const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const receiptData = {
        ...newReceipt,
        date: new Date().toISOString(),
        imageUrl
      };
      await addDoc(collection(db, 'receipts'), receiptData);
      await AuditService.log(user.uid, 'CREATE', 'RECEIPTS', `Generated receipt for ${newReceipt.studentId}`);
      setIsAdding(false);
      setNewReceipt({ studentId: '', purpose: 'YEARBOOK_FEE', referenceNo: '', status: 'PENDING' });
      setFile(null);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to generate receipt');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-[#0d1b2a]">Receipts</h2>
          <p className="text-sm text-gray-500 font-medium tracking-tight">Verify and track student receipts for yearbook fees and optional packages.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-white rounded-xl p-1 border border-gray-100 shadow-sm shrink-0">
             {['ALL', 'PENDING', 'PAID', 'REJECTED'].map((s) => (
               <button 
                 key={s}
                 onClick={() => setFilterStatus(s)}
                 className={cn(
                   "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                   filterStatus === s ? "bg-[#1a237e] text-white shadow-md" : "text-gray-400 hover:text-gray-600"
                 )}
               >
                 {s}
               </button>
             ))}
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#fbbd08] text-[#0d1b2a] text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-xl transition-all shadow-md ml-auto"
          >
            <Plus className="h-4 w-4" /> Add Record
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-left">
        <table className="w-full">
          <thead className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <tr>
              <th className="px-8 py-4">Ref No.</th>
              <th className="px-8 py-4">Student</th>
              <th className="px-8 py-4">Purpose</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4">Image</th>
              <th className="px-8 py-4">Date</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 font-bold">
            {receipts.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors text-sm group">
                <td className="px-8 py-4 font-mono text-gray-400">{r.referenceNo}</td>
                <td className="px-8 py-4 text-[#0d1b2a]">{r.studentId}</td>
                <td className="px-8 py-4 uppercase text-[11px]">{r.purpose.replace('_', ' ')}</td>
                <td className="px-8 py-4">
                   <span className={cn(
                     "px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest",
                     r.status === 'PAID' ? "bg-green-100 text-green-700" :
                     r.status === 'REJECTED' ? "bg-red-100 text-red-700" :
                     "bg-[#fbbd08]/20 text-[#fbbd08]"
                   )}>
                     {r.status}
                   </span>
                </td>
                <td className="px-8 py-4">
                  {r.imageUrl && <a href={r.imageUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 underline text-[10px] font-black uppercase tracking-widest">View Doc</a>}
                </td>
                <td className="px-8 py-4 text-gray-400 font-medium">
                   {new Date(r.date).toLocaleDateString()}
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {r.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleUpdateStatus(r.id, 'PAID')}
                          className="px-3 py-1 bg-green-50 text-green-700 text-[9px] font-black uppercase rounded hover:bg-green-100 transition-colors"
                        >
                          Verify
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                          className="px-3 py-1 bg-red-50 text-red-700 text-[9px] font-black uppercase rounded hover:bg-red-100 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleDelete(r.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Receipt"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {receipts.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-8 py-20 text-center text-gray-300 text-[11px] font-black uppercase tracking-widest">
                   No receipts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-8 py-6 bg-[#1a237e] text-white flex justify-between items-center">
                 <h3 className="text-xl font-black uppercase tracking-tight">Add Receipt</h3>
                 <button onClick={() => setIsAdding(false)}><X className="h-6 w-6" /></button>
              </div>
              <form onSubmit={handleCreate} className="p-8 space-y-4">
                 {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-[10px] font-black uppercase rounded-lg border border-red-100">
                      {error}
                    </div>
                 )}
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Student ID / Full Name</label>
                    <input 
                      required
                      value={newReceipt.studentId}
                      onChange={e => setNewReceipt({...newReceipt, studentId: e.target.value})}
                      placeholder="e.g. 2023-0001" 
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a237e]/5"
                    />
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ref #</label>
                        <input 
                          required
                          value={newReceipt.referenceNo}
                          onChange={e => setNewReceipt({...newReceipt, referenceNo: e.target.value})}
                          placeholder="OR-12345" 
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a237e]/5"
                        />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Purpose</label>
                    <select 
                      value={newReceipt.purpose}
                      onChange={e => setNewReceipt({...newReceipt, purpose: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border border-gray-100"
                    >
                       <option value="YEARBOOK_FEE">Yearbook Fee</option>
                       <option value="PHOTO_SESSION">Photo Session Fee</option>
                       <option value="GRAD_PACKAGE">Graduation Package</option>
                       <option value="ADDITIONAL_COPY">Additional Yearbook Copy</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Initial Status</label>
                    <select 
                      value={newReceipt.status}
                      onChange={e => setNewReceipt({...newReceipt, status: e.target.value as any})}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border border-gray-100"
                    >
                       <option value="PENDING">Unverified</option>
                       <option value="PAID">Verified</option>
                       <option value="REJECTED">Rejected</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Receipt Image</label>
                    <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 border border-gray-100 mt-1">
                      <Upload className="h-4 w-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-500 truncate">{file ? file.name : "Select Receipt Image"}</span>
                      <input 
                          type="file"
                          accept="image/*"
                          onChange={e => setFile(e.target.files?.[0] || null)}
                          className="hidden"
                      />
                    </label>
                 </div>
                 <button 
                  type="submit"
                  disabled={uploading}
                  className="w-full py-4 bg-[#fbbd08] text-[#0d1b2a] text-[12px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-[1.02] transition-all mt-4 disabled:opacity-50"
                 >
                   {uploading ? 'Processing...' : 'Save Receipt'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
