import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  User as UserIcon, Mail, Shield, GraduationCap, BookOpen, Calendar, CheckCircle2, Camera, Edit3, X, Save
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../firebase';

export default function MyProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [quote, setQuote] = useState(user?.quote || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
      }
      // Update firestore if needed
      await updateDoc(doc(db, 'users', user.uid), { photoURL });
      alert('Profile photo updated successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to update profile photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateQuote = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { quote });
      setIsMetaModalOpen(false);
      alert('Yearbook quote updated successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to update quote.');
    }
  };

  if (!user) return null;

  const handleUpdateProfile = async (field: string, value: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { [field]: value });
      alert(`${field} updated successfully!`);
    } catch (error) {
      console.error(error);
      alert(`Failed to update ${field}.`);
    }
  };

  const infoItems = [
    { label: 'Full Name', key: 'displayName', value: user.displayName || 'Not Set', icon: <UserIcon className="h-4 w-4" /> },
    { label: 'Email Address', key: 'email', value: user.email, icon: <Mail className="h-4 w-4" /> },
    { label: 'Student ID', key: 'studentId', value: user.studentId || '', icon: <GraduationCap className="h-4 w-4" /> },
    { label: 'Role', value: user.role, icon: <Shield className="h-4 w-4" /> },
    { label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString(), icon: <Calendar className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-[#0d1b2a]">My Profile</h1>
          <p className="text-sm text-gray-500 font-medium">Manage your personal information and yearbook settings.</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1a237e] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:shadow-xl transition-all"
        >
          <Edit3 className="h-4 w-4" />
          {isEditing ? 'Save Profile' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col items-center text-center">
          <div className="relative group mb-6">
            <div className="h-32 w-32 rounded-full border-4 border-[#fbbd08] p-1 shadow-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
              {isUploading ? (
                <div className="h-10 w-10 border-4 border-[#1a237e] border-t-transparent rounded-full animate-spin" />
              ) : user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="h-16 w-16 text-gray-200" />
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 h-8 w-8 bg-[#1a237e] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all border-2 border-white"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          
          <h2 className="text-xl font-black text-[#0d1b2a] mb-1">{user.displayName}</h2>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#fbbd08] bg-[#fbbd08]/10 px-3 py-1 rounded-full">
            {user.role}
          </span>

          <div className="w-full h-px bg-gray-100 my-8" />

          <div className="w-full space-y-4">
             <div className="flex justify-between items-center text-[11px]">
               <span className="font-bold text-gray-400 uppercase tracking-widest">Status</span>
               <span className="font-black text-[#85b27a] flex items-center gap-1">
                 <CheckCircle2 className="h-3 w-3" />
                 Active
               </span>
             </div>
             <div className="flex justify-between items-center text-[11px]">
               <span className="font-bold text-gray-400 uppercase tracking-widest">Batch</span>
               <span className="font-black text-[#0d1b2a]">2026</span>
             </div>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0d1b2a] mb-8">Personal Information</h3>
            <div className="space-y-8">
              {infoItems.map((item, index) => (
                <div key={index} className="grid grid-cols-3 items-center group">
                  <div className="flex items-center gap-3 text-[#1a237e] opacity-40 group-hover:opacity-100 transition-all">
                    {item.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  </div>
                  <div className="col-span-2">
                    {isEditing && item.key ? (
                      <input 
                        defaultValue={item.value}
                        onBlur={(e) => handleUpdateProfile(item.key!, e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/5"
                      />
                    ) : (
                      <p className="text-sm font-black text-[#0d1b2a]">{item.value || 'Not Set'}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1a237e] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-[#1a237e]/20">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <BookOpen className="h-24 w-24" />
             </div>
             <h3 className="text-xl font-black uppercase tracking-tight mb-2">Yearbook Quote</h3>
             <p className="text-white/60 text-xs font-medium max-w-xs leading-relaxed mb-6">These details will be used for your official yearbook page layout. Ensure they are correct.</p>
             
             <button 
                onClick={() => setIsMetaModalOpen(true)}
                className="flex items-center gap-3 px-6 py-3 bg-[#fbbd08] text-[#0d1b2a] rounded-xl text-[11px] font-black hover:shadow-xl transition-all uppercase tracking-widest shadow-lg shadow-[#fbbd08]/20"
             >
                <BookOpen className="h-4 w-4" />
                Update Yearbook Details
             </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isMetaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase tracking-tight">Yearbook Quote</h3>
                <button onClick={() => setIsMetaModalOpen(false)}><X className="h-6 w-6" /></button>
              </div>
              <textarea 
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                maxLength={200}
                className="w-full h-32 p-4 bg-gray-50 rounded-xl mb-6 text-sm font-medium border border-gray-100"
                placeholder="Enter your inspirational quote..."
              />
              <button 
                onClick={handleUpdateQuote}
                className="w-full py-4 bg-[#1a237e] text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" /> Save Quote
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
