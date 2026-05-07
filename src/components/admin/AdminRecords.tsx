import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { AppUser } from '../../types';
import { Search, UserCheck, UserX, MoreHorizontal, User, Mail, Hash, BookOpen, Layers, X, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BatchService, BatchGroup } from '../../services/BatchService';

export default function AdminRecords() {
  const [students, setStudents] = useState<AppUser[]>([]);
  const [batches, setBatches] = useState<BatchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<AppUser | null>(null);
  const [editFormData, setEditFormData] = useState({
    displayName: '',
    studentId: '',
    batch: '',
    isActive: true
  });

  const fetchStudents = () => {
    setLoading(true);
    const q = query(collection(db, 'users'), where('role', '==', 'STUDENT'));
    
    return onSnapshot(q, async (snap) => {
      const studentsData = snap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
      setStudents(studentsData);
      
      const bData = await BatchService.getAllBatches();
      setBatches(bData);
      setLoading(false);
    });
  };

  useEffect(() => {
    const unsub = fetchStudents();
    return () => unsub();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleDeactivate = async (uid: string, currentStatus: boolean = true) => {
    const action = currentStatus ? 'deactivate' : 'reactivate';
    if (confirm(`Are you sure you want to ${action} this student account?`)) {
      try {
        await updateDoc(doc(db, 'users', uid), { isActive: !currentStatus });
        alert(`Student account ${currentStatus ? 'deactivated' : 'reactivated'}.`);
      } catch (error) {
        console.error('Error updating student status:', error);
        alert('Failed to update student record.');
      }
    }
  };

  const startEdit = (student: AppUser) => {
    setEditingStudent(student);
    setEditFormData({
      displayName: student.displayName || '',
      studentId: student.studentId || '',
      batch: student.batch || '',
      isActive: student.isActive !== false
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      await updateDoc(doc(db, 'users', editingStudent.uid), {
        ...editFormData,
        updatedAt: new Date().toISOString()
      });
      setEditingStudent(null);
      fetchStudents();
      alert('Student record updated successfully.');
    } catch (e) {
      console.error(e);
      alert('Failed to update student.');
    }
  };

  return (
    <div className="space-y-6 pb-20">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
           <h2 className="text-3xl font-black tracking-tighter text-[#0d1b2a]">Student Records</h2>
           <p className="text-sm text-gray-500 font-medium">View and manage all registered student profiles.</p>
         </div>
         <div className="relative w-full md:w-80">
           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
           <input 
             type="text" 
             placeholder="Search by name, ID, or email..." 
             className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1a237e]/10 shadow-sm"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
         </div>
       </div>

       <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="px-8 py-4">Student</th>
                  <th className="px-8 py-4">ID / Email</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Batch</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold">
                {filteredStudents.map((s) => (
                  <tr key={s.uid} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#1a237e]/5 border-2 border-white shadow-sm flex items-center justify-center text-[#1a237e] font-black text-xs uppercase overflow-hidden">
                            {s.photoURL ? <img src={s.photoURL} alt="" referrerPolicy="no-referrer" /> : s.displayName?.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-[13px] text-[#0d1b2a] font-black uppercase tracking-tight">{s.displayName}</p>
                          <p className="text-[10px] text-gray-400 font-bold">MEMBER SINCE {new Date(s.createdAt).getFullYear()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                        <p className="text-[11px] text-[#0d1b2a] leading-none mb-1 uppercase tracking-tight font-black">{s.studentId || 'NO ID'}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{s.email}</p>
                    </td>
                    <td className="px-8 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                          s.isActive !== false ? "bg-[#85b27a]/20 text-[#85b27a]" : "bg-red-50 text-red-500"
                        )}>
                          {s.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td className="px-8 py-4 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                        {s.batch || 'Unassigned'}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => startEdit(s)}
                          className="p-2 hover:bg-[#1a237e]/5 text-[#1a237e] rounded-lg transition-colors" 
                          title="Edit Student"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeactivate(s.uid, s.isActive !== false)} 
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            s.isActive !== false ? "hover:bg-red-50 text-red-400" : "hover:bg-green-50 text-green-500"
                          )} 
                          title={s.isActive !== false ? "Deactivate Account" : "Reactivate Account"}
                        >
                          {s.isActive !== false ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-gray-300 text-[11px] font-black uppercase tracking-widest">
                       No student records match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
         </div>
       </div>

       {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 bg-[#1a237e] text-white flex justify-between items-center">
                   <div>
                     <h3 className="text-xl font-black uppercase tracking-tight">Edit Student Record</h3>
                     <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{editingStudent.email}</p>
                   </div>
                   <button onClick={() => setEditingStudent(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleUpdate} className="p-8 space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                           <User className="h-3 w-3" /> Full Name
                         </label>
                         <input 
                           required
                           value={editFormData.displayName}
                           onChange={e => setEditFormData({...editFormData, displayName: e.target.value})}
                           className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a237e]/5"
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                           <Hash className="h-3 w-3" /> Student ID
                         </label>
                         <input 
                           required
                           value={editFormData.studentId}
                           onChange={e => setEditFormData({...editFormData, studentId: e.target.value})}
                           className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a237e]/5"
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                           <Layers className="h-3 w-3" /> Batch Assignment
                         </label>
                         <select 
                           value={editFormData.batch}
                           onChange={e => setEditFormData({...editFormData, batch: e.target.value})}
                           className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border border-gray-100"
                         >
                            <option value="">Unassigned</option>
                            {batches.map(b => (
                              <option key={b.id} value={b.name}>{b.name}</option>
                            ))}
                         </select>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                           Status
                         </label>
                         <select 
                           value={editFormData.isActive ? 'true' : 'false'}
                           onChange={e => setEditFormData({...editFormData, isActive: e.target.value === 'true'})}
                           className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border border-gray-100"
                         >
                            <option value="true">Active Account</option>
                            <option value="false">Deactivated</option>
                         </select>
                      </div>
                   </div>

                   <button 
                    type="submit"
                    className="w-full py-4 bg-[#fbbd08] text-[#0d1b2a] text-[12px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:shadow-[#fbbd08]/20 flex items-center justify-center gap-2 transition-all mt-4"
                   >
                     <Save className="h-4 w-4" /> Save Changes
                   </button>
                </form>
             </div>
          </div>
       )}
    </div>
  );
}
