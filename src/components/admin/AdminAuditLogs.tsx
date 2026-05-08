import React, { useEffect, useState } from 'react';
import { AuditService } from '../../services/AuditService';
import { Clock, Search, Filter, History } from 'lucide-react';
import { cn } from '../../lib/utils';

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-[#1a237e]/5 rounded-2xl">
            <History className="h-6 w-6 text-[#1a237e]" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-[#0d1b2a]">Audit Trail & Logs</h2>
            <p className="text-sm text-gray-500 font-medium">Complete record of all system actions for transparency and security.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">User</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Action</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Module</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log.id} className="group hover:bg-gray-50/50 transition-all duration-300">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] font-bold text-gray-400">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleDateString() : 'Today'}
                      </span>
                      <span className="font-mono text-[9px] text-gray-300">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#1a237e]/5 flex items-center justify-center text-[10px] font-black text-[#1a237e]">
                        {log.userId?.slice(-2).toUpperCase() || '??'}
                      </div>
                      <span className="text-[11px] font-black text-[#1a237e] uppercase tracking-tighter">
                        {log.userId?.slice(-6) || 'SYSTEM'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      log.action === 'CREATE' ? "bg-green-50 text-green-700 border-green-100" :
                      log.action === 'DELETE' ? "bg-red-50 text-red-700 border-red-100" :
                      "bg-blue-50 text-blue-700 border-blue-100"
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{log.module}</span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-medium text-[#0d1b2a] line-clamp-1 group-hover:line-clamp-none transition-all duration-500">
                      {log.details}
                    </p>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <History className="h-10 w-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No activities found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
