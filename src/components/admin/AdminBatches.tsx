import React, { useEffect, useState } from 'react';
import { BatchService, BatchGroup } from '../../services/BatchService';
import { Layers, Plus, Users, Search, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminBatches() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<BatchGroup[]>([]);
  const [batchCounts, setBatchCounts] = useState<Record<string, number>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newBatch, setNewBatch] = useState({ name: '', course: '', section: '', yearLevel: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [batchData, counts] = await Promise.all([
        BatchService.getAllBatches(),
        BatchService.getBatchStudentCounts()
      ]);
      setBatches(batchData);
      setBatchCounts(counts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await BatchService.createBatch(
        newBatch.name,
        newBatch.course,
        newBatch.section,
        newBatch.yearLevel,
        user.uid
      );
      setIsAdding(false);
      setNewBatch({ name: '', course: '', section: '', yearLevel: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to create batch');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm('Delete this batch? Students will remain but won\'t be in a batch.')) return;
    try {
      await BatchService.deleteBatch(id, user.uid);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to delete batch');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-[#0d1b2a]">Batch Management</h2>
          <p className="text-sm text-gray-500 font-medium">Organize students into groups for efficient processing and layout.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#1a237e] text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:shadow-xl transition-all"
        >
          <Plus className="h-4 w-4" /> Create New Batch
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((batch) => (
          <div key={batch.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-[#1a237e]/20 transition-all group relative">
             <button 
                onClick={() => handleDelete(batch.id)}
                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
             >
                <Trash2 className="h-4 w-4" />
             </button>
             <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-gray-50 rounded-2xl text-[#1a237e] group-hover:bg-[#1a237e] group-hover:text-white transition-all">
                   <Layers className="h-6 w-6" />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#85b27a] px-3 py-1 bg-[#85b27a]/10 rounded-full">Active</div>
             </div>
             <h3 className="text-xl font-black text-[#0d1b2a] tracking-tight mb-1">{batch.name}</h3>
             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">{batch.course} — Section {batch.section}</p>
             
             <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex items-center gap-2">
                   <Users className="h-4 w-4 text-gray-300" />
                   <span className="text-[12px] font-black text-[#0d1b2a]">{batchCounts[batch.name] || 0} Students</span>
                </div>
             </div>
          </div>
        ))}
        {batches.length === 0 && !loading && (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
             <Layers className="h-10 w-10 mb-4 opacity-20" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">No batches defined yet</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-8 py-6 bg-[#1a237e] text-white flex justify-between items-center">
                 <h3 className="text-xl font-black uppercase tracking-tight">Create Batch</h3>
                 <button onClick={() => setIsAdding(false)}><X className="h-6 w-6" /></button>
              </div>
              <form onSubmit={handleCreate} className="p-8 space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Batch Name</label>
                    <input 
                      required
                      value={newBatch.name}
                      onChange={e => setNewBatch({...newBatch, name: e.target.value})}
                      placeholder="e.g. BATCH 2026A" 
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a237e]/5"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Course</label>
                        <input 
                          required
                          value={newBatch.course}
                          onChange={e => setNewBatch({...newBatch, course: e.target.value})}
                          placeholder="BSIT" 
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a237e]/5"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Section</label>
                        <input 
                          required
                          value={newBatch.section}
                          onChange={e => setNewBatch({...newBatch, section: e.target.value})}
                          placeholder="4-A" 
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a237e]/5"
                        />
                    </div>
                 </div>
                 <button 
                  type="submit"
                  className="w-full py-4 bg-[#fbbd08] text-[#0d1b2a] text-[12px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-[1.02] transition-all mt-4"
                 >
                   Initialize Batch
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
