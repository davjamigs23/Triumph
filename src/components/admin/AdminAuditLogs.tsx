import React, { useEffect, useState } from 'react';
import { AuditService } from '../../services/AuditService';
import { Clock, Search, Filter } from 'lucide-react';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await AuditService.getLogs(200);
      setLogs(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tighter text-[#0d1b2a]">Audit Trail & Logs</h2>
        <p className="text-sm text-gray-500 font-medium">Complete record of all system actions for transparency and security.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50">
            <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              <th className="px-8 py-4">Timestamp</th>
              <th className="px-8 py-4">User</th>
              <th className="px-8 py-4">Action</th>
              <th className="px-8 py-4">Module</th>
              <th className="px-8 py-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map((log) => (
              <tr key={log.id} className="text-[12px] font-bold hover:bg-gray-50/20 transition-colors">
                <td className="px-8 py-4 font-mono text-[10px] text-gray-400">
                   {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                </td>
                <td className="px-8 py-4 text-[#1a237e] uppercase">{log.userId.slice(-6)}</td>
                <td className="px-8 py-4 uppercase tracking-tighter">{log.action}</td>
                <td className="px-8 py-4 text-gray-400 uppercase tracking-widest text-[9px]">{log.module}</td>
                <td className="px-8 py-4 text-[#0d1b2a] max-w-xs truncate">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
