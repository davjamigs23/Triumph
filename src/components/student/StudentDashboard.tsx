import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Camera, 
  PlusCircle, 
  Calendar, 
  Upload, 
  Layers, 
  User as UserIcon,
  Bell
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DocumentService } from '../../services/DocumentService';
import { ScheduleService } from '../../services/ScheduleService';
import { NotificationService, Notification } from '../../services/NotificationService';
import { AnnouncementService } from '../../services/AnnouncementService';
import { DocumentSubmission, BookingSession, Announcement } from '../../types';

interface RequirementItemProps {
  label: string;
  status: 'complete' | 'pending' | 'action';
}

const RequirementItem = ({ label, status }: RequirementItemProps) => {
  const isComplete = status === 'complete';
  const isAction = status === 'action';
  
  return (
    <div className="flex items-center justify-between py-5 px-8 border-b border-gray-50 last:border-0 hover:bg-gray-50/20 transition-all cursor-pointer group">
      <div className="flex items-center gap-5">
        <div className={cn(
          "h-6 w-6 rounded-full flex items-center justify-center transition-all",
          isComplete ? "bg-[#85b27a]/15 text-[#85b27a]" : isAction ? "bg-[#ff5a5a]/15 text-[#ff5a5a]" : "bg-[#fbbd08]/15 text-[#fbbd08]"
        )}>
          {isComplete ? <CheckCircle2 className="h-4 w-4" /> : isAction ? <span className="text-[14px] font-black leading-none translate-y-[-1px]">+</span> : <div className="h-2 w-2 rounded-full border-2 border-current bg-transparent" />}
        </div>
        <span className={cn("text-[14px]", isComplete ? "text-[#0d1b2a]/40 font-bold" : "text-[#0d1b2a] font-black tracking-tight")}>{label}</span>
      </div>
      <div className={cn(
        "text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm",
        isComplete ? "bg-[#85b27a]/15 text-[#85b27a]" : isAction ? "bg-[#ff5a5a]/15 text-[#ff5a5a]" : "bg-[#fbbd08]/15 text-[#fbbd08]"
      )}>
        {status === 'action' ? 'Action Required' : status}
      </div>
    </div>
  );
};

export default function StudentDashboard({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocumentSubmission[]>([]);
  const [booking, setBooking] = useState<BookingSession | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [userDocs, userBooking, systemAnnouncements] = await Promise.all([
          DocumentService.getStudentDocuments(user.uid),
          ScheduleService.getStudentBooking(user.uid),
          AnnouncementService.getAll()
        ]);
        setDocs(userDocs);
        setBooking(userBooking);
        setAnnouncements(systemAnnouncements.slice(0, 3));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const unsubscribeNotifs = NotificationService.subscribeToNotifications(user.uid, (notifs) => {
      setNotifications(notifs.slice(0, 3));
    });

    return () => unsubscribeNotifs();
  }, [user]);

  const getDocStatus = (type: DocumentSubmission['type']) => {
    const doc = docs.find(d => d.type === type);
    if (!doc) return 'action';
    if (doc.status === 'APPROVED') return 'complete';
    if (doc.status === 'REJECTED') return 'action';
    return 'pending';
  };

  const calculateProgress = () => {
    const requirements = [
      getDocStatus('CLEARANCE'),
      getDocStatus('RECEIPT'),
      booking ? 'complete' : 'action',
      user?.displayName ? 'complete' : 'action', // Simplified profile check
    ];
    const completeCount = requirements.filter(r => r === 'complete').length;
    return Math.round((completeCount / requirements.length) * 100);
  };

  if (activeTab !== 'dashboard') {
    return null; // Shell content switching handles this
  }

  const progress = calculateProgress();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-[#0d1b2a] tracking-tight">Dashboard</h1>
          <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest mt-1">Track your yearbook requirements and upcoming sessions.</p>
        </div>
      </div>

      {/* Welcome & Progress */}
      <div className="bg-white border border-gray-100 rounded-3xl p-10 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 h-full w-2 bg-[#fbbd08]/10 group-hover:w-4 transition-all" />
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
          <div className="text-xl font-bold text-[#0d1b2a]">
            Welcome back, <span className="font-black text-[#1a237e] uppercase tracking-tight">{user?.displayName || 'Student'}!</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-[#0d1b2a]">
            <span>Profile Progress: {progress}%</span>
            <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#fbbd08]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        </div>
      </div>

        {/* Main Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Checklist */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/20">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#0d1b2a]">Requirements Checklist</h3>
          </div>
          <div className="flex-1 divide-y divide-gray-50">
            <RequirementItem label="Personal Details" status={user?.displayName ? 'complete' : 'action'} />
            <RequirementItem label="Clearance Form" status={getDocStatus('CLEARANCE')} />
            <RequirementItem label="Payment Receipt" status={getDocStatus('RECEIPT')} />
            <RequirementItem label="Photo Session" status={booking ? 'complete' : 'action'} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Booking Card */}
          <div className={cn(
            "rounded-2xl p-6 shadow-sm transition-all cursor-pointer h-[180px] flex flex-col justify-between",
            booking ? "bg-[#85b27a] text-white" : "bg-[#1a237e] text-white"
          )} onClick={() => setActiveTab('schedule')}>
            <div className="flex justify-between items-start">
               <div className="text-[10px] font-black uppercase tracking-widest opacity-70">PHOTO SESSION</div>
               <div className={cn("text-[9px] font-black uppercase px-3 py-1 rounded-full", booking ? "bg-white/20" : "bg-[#fbbd08] text-[#0d1b2a]")}>
                  {booking ? 'Booked' : 'Pending'}
               </div>
            </div>
            
            {booking ? (
              <div>
                <h3 className="text-xl font-black">{booking.date}</h3>
                <p className="text-sm font-bold opacity-80 uppercase tracking-widest">{booking.timeSlot}</p>
              </div>
            ) : (
                <p className="text-sm font-bold opacity-80">No session booked yet.</p>
            )}
            
            <button className="w-full text-[10px] font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 py-2 rounded-lg">
              {booking ? 'Reschedule' : 'Book Session'}
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#0d1b2a] mb-4">Notifications</h3>
            <div className="space-y-4">
               {notifications.length > 0 ? notifications.slice(0, 2).map((notif) => (
                 <div key={notif.id} className="text-xs font-medium text-gray-600 border-l-2 border-gray-200 pl-3">
                    {notif.message}
                 </div>
               )) : <div className="text-xs text-gray-400">No new notifications.</div>}
            </div>
          </div>
        </div>
      </div>

      {/* System Announcements */}
      {/* Announcements Removed per User Request */}

      {/* Yearbook Layout Preview */}

      {/* Yearbook Layout Preview */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#0d1b2a]">Yearbook Layout Preview</h3>
            <span className="text-[10px] font-black text-[#85b27a] uppercase tracking-widest bg-[#85b27a]/10 px-3 py-1 rounded-full">Live Preview</span>
        </div>
        <div className="p-12 flex justify-center bg-gray-50/50">
           {/* Yearbook Card */}
           <div className="w-[300px] h-[500px] bg-gradient-to-b from-[#000e40] to-[#0d21a1] shadow-2xl rounded-sm p-6 flex flex-col items-center relative overflow-hidden group text-white font-serif">
              
              {/* University Logo */}
              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                  <img src="https://upload.wikimedia.org/wikipedia/en/0/07/Ateneo_de_Naga_University_seal.svg" alt="ADNU Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>

              {/* Header Text */}
              <h2 className="text-[12px] font-bold text-center tracking-[0.15em] uppercase mb-1">ATENEO DE NAGA UNIVERSITY</h2>
              <h3 className="text-[10px] font-light text-center tracking-[0.2em] uppercase mb-6 text-white/90">SENIOR HIGH SCHOOL</h3>
              
              <h1 className="text-[14px] font-bold text-center tracking-[0.1em] uppercase mb-6 text-white/80">
                  GRADUATING CLASS OF 2026
              </h1>

              {/* Photo Frame */}
              <div className="w-48 h-60 border-4 border-[#c5a059] mb-6 overflow-hidden bg-gray-800 flex items-center justify-center shadow-2xl">
                 {user?.photoURL ? (
                    <img src={user.photoURL} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                    <UserIcon className="h-16 w-16 text-white/20" />
                 )}
              </div>
              
              {/* Student Name */}
              <h4 className="text-[22px] font-bold text-[#c5a059] uppercase text-center leading-tight">
                  {user?.displayName || 'Student Name'}
              </h4>
              
              {/* Student Quote (replaces Latin Honor) */}
              <div className="mt-4 px-4">
                 <p className="text-[10px] italic text-white/80 text-center leading-relaxed font-sans">
                   "{user?.quote || 'No quote added yet. Update your profile to set your yearbook quote.'}"
                 </p>
              </div>

              {/* Interactive Edit Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                 <button onClick={() => setActiveTab('profile')} className="px-6 py-2 bg-white text-[#000e40] text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl hover:bg-gray-100 transition-all">Edit Details</button>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
}
