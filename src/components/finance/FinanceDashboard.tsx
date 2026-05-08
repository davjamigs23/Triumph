import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  BarChart3, 
  Users, 
  FileCheck, 
  Settings, 
  LogOut, 
  Bell, 
  Menu, 
  X,
  CreditCard,
  History,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import DocumentVerification from '../admin/DocumentVerification';
import AdminAuditLogs from '../admin/AdminAuditLogs';

export default function FinanceDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('receipts');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'receipts', label: 'Receipt Verification', icon: CreditCard },
    { id: 'audit', label: 'Finance Logs', icon: History },
  ];

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#e5e7eb] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#1a237e] rounded-xl flex items-center justify-center text-white shadow-lg">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-[#0d1b2a]">FINANCE</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a237e]">Control Tower</p>
              </div>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                    activeTab === item.id 
                      ? "bg-[#1a237e] text-white shadow-xl shadow-[#1a237e]/20 scale-[1.02]" 
                      : "text-gray-400 hover:text-[#0d1b2a] hover:bg-gray-50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-8 border-t border-gray-50">
            <button 
              onClick={logout}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest text-[#ff5a5a] hover:bg-red-50 transition-all"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-[#0d1b2a]"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Welcome Back</p>
              <h2 className="text-lg font-black text-[#0d1b2a]">{user?.displayName}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-gray-50 rounded-full border border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0d1b2a]">Finance Admin Access</span>
            </div>
            <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#1a237e]/5 text-[#1a237e] hover:bg-[#1a237e]/10 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === 'receipts' && (
            <div className="space-y-6">
              <div className="p-6 bg-[#fbbd08]/10 border border-[#fbbd08]/20 rounded-2xl flex gap-4 items-center">
                <CreditCard className="h-6 w-6 text-[#0d1b2a]" />
                <p className="text-sm font-bold text-[#0d1b2a]">
                  You are viewing the <span className="underline">Receipt Verification</span> module. You are responsible for approving student payment proofs.
                </p>
              </div>
              {/* Reuse DocumentVerification but target only receipts if modified */}
              <DocumentVerification filterType="RECEIPT" />
            </div>
          )}
          {activeTab === 'audit' && <AdminAuditLogs />}
        </div>
      </main>
    </div>
  );
}
