import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, query, getDocs, orderBy, limit, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FileText, Search, CreditCard, DollarSign, Download, Plus, X, Upload } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AuditService } from '../../services/AuditService';

interface Receipt {
  id: string;
  studentId: string;
  purpose: string;
  status: 'PAID' | 'PENDING';
  date: string;
  referenceNo: string;
  imageUrl?: string;
}

export default function AdminReceipts() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newReceipt, setNewReceipt] = useState({ studentId: '', purpose: 'YEARBOOK_FEE', referenceNo: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchReceipts = async () => {
    try {
      const q = query(collection(db, 'receipts'), orderBy('date', 'desc'), limit(100));
      const snap = await getDocs(q);
      setReceipts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Receipt)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setUploading(true);
    try {
      let imageUrl = '';
      if (file) {
        const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }

      const receiptData = {
        ...newReceipt,
        status: 'PAID',
        date: new Date().toISOString(),
        imageUrl
      };
      await addDoc(collection(db, 'receipts'), receiptData);
      await AuditService.log(user.uid, 'CREATE', 'RECEIPTS', `Generated receipt for ${newReceipt.studentId}`);
      setIsAdding(false);
      setNewReceipt({ studentId: '', purpose: 'YEARBOOK_FEE', referenceNo: '' });
      setFile(null);
      fetchReceipts();
    } catch (e) {
      console.error(e);
      alert('Failed to generate receipt');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-[#0d1b2a]">Receipts</h2>
          <p className="text-sm text-gray-500 font-medium">Verify and track student receipts for yearbook fees, graduation photos, and additional sets.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#1a237e] text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:shadow-xl transition-all"
        >
          <Plus className="h-4 w-4" /> Add Receipt
        </button>
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
              <th className="px-8 py-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 font-bold">
            {receipts.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                <td className="px-8 py-4 font-mono text-gray-400">{r.referenceNo}</td>
                <td className="px-8 py-4 text-[#0d1b2a]">{r.studentId}</td>
                <td className="px-8 py-4 uppercase text-[11px]">{r.purpose.replace('_', ' ')}</td>
                <td className="px-8 py-4">
                   <span className="bg-[#85b27a]/20 text-[#85b27a] px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest">{r.status}</span>
                </td>
                <td className="px-8 py-4">
                  {r.imageUrl && <a href={r.imageUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 underline text-[10px]">View</a>}
                </td>
                <td className="px-8 py-4 text-right text-gray-400 font-medium">
                   {new Date(r.date).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {receipts.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center text-gray-300 text-[11px] font-black uppercase tracking-widest">
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Receipt Image</label>
                    <div className="relative">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#1a237e] file:text-white hover:file:bg-[#1a237e]/90 cursor-pointer"
                      />
                    </div>
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
