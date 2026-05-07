import React, { useEffect, useState } from 'react';
import { ComplianceService, ComplianceStats } from '../../services/ComplianceService';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, FileCheck, Calendar } from 'lucide-react';

export default function AdminCompliance() {
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [nonCompliant, setNonCompliant] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remindingAll, setRemindingAll] = useState(false);

  useEffect(() => {
    Promise.all([
      ComplianceService.getStats(),
      ComplianceService.getNonCompliantStudents()
    ]).then(([s, nc]) => {
      setStats(s);
      setNonCompliant(nc);
      setLoading(false);
    });
  }, []);

   const handleRemind = async (userId: string, missing: string) => {
    try {
      const { NotificationService } = await import('../../services/NotificationService');
      await NotificationService.sendNotification(
        userId,
        'Requirement Reminder',
        `You have a missing requirement: ${missing}. Please complete it to proceed with your yearbook processing.`,
        'deadline'
      );
      alert('Reminder sent successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to send reminder');
    }
   };

   const handleRemindAll = async () => {
    if (!nonCompliant.length) return;
    if (!confirm(`Send reminders to all ${nonCompliant.length} students with missing requirements?`)) return;
    
    setRemindingAll(true);
    try {
      const { NotificationService } = await import('../../services/NotificationService');
      await Promise.all(nonCompliant.map(s => 
        NotificationService.sendNotification(
          s.id,
          'Urgent: Missing Requirements',
          `This is a collective reminder: You are missing ${s.missing}. Please settle this immediately.`,
          'deadline'
        )
      ));
      alert(`Successfully sent ${nonCompliant.length} reminders.`);
    } catch (e) {
      console.error(e);
      alert('Failed to send some reminders.');
    } finally {
      setRemindingAll(false);
    }
   };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
       <div className="animate-spin h-8 w-8 border-4 border-[#fbbd08] border-t-transparent rounded-full" />
    </div>
  );
  if (!stats) return null;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-black tracking-tighter text-[#0d1b2a]">Compliance Tracking</h2>
        <p className="text-sm text-gray-500 font-medium">Monitor student progress and identify bottlenecks in the requirement process.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
         <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Overall Completion</h4>
            <div className="text-4xl font-black text-[#85b27a]">{stats.completePercent}%</div>
         </div>
         <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Documents Awaiting</h4>
            <div className="text-4xl font-black text-[#fbbd08]">{stats.docsPending}</div>
         </div>
         <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Unbooked Students</h4>
            <div className="text-4xl font-black text-[#ff5a5a]">{stats.noBooking}</div>
         </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-[12px] font-black uppercase tracking-[0.2em]">Non-Compliant Students</h3>
            {nonCompliant.length > 0 && (
              <button 
                onClick={handleRemindAll}
                disabled={remindingAll}
                className="px-6 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {remindingAll ? 'Sending...' : 'Remind All'}
              </button>
            )}
        </div>
        <div className="space-y-4">
           {nonCompliant.length > 0 ? nonCompliant.map(s => (
             <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black">
                      {s.name.substring(0, 2).toUpperCase()}
                   </div>
                   <div>
                      <p className="text-sm font-black">{s.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Missing: {s.missing}</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleRemind(s.id, s.missing)}
                  className="px-6 py-2 bg-[#1a237e] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#1a237e]/90 transition-all"
                >
                  Remind
                </button>
             </div>
           )) : (
             <div className="py-20 text-center text-gray-300 text-[11px] font-black uppercase tracking-widest">
                All students are compliant!
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
