import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';                
import { auth, db } from '../firebase';
import { AppUser, UserRole } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
            unsubscribeSnapshot = null;
        }
        
        if (firebaseUser) {
            // Fetch custom user profile from Firestore or listen to it
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            
            // Listen to changes
            unsubscribeSnapshot = onSnapshot(userDocRef, async (userDoc) => {
               if (userDoc.exists()) {
                 const userData = userDoc.data() as AppUser;
                 // Determine role based on email domain
                 const newRole: UserRole = userData.email.endsWith('@gmail.com') ? 'ADMIN' : 'STUDENT';
                 
                 if (userData.role !== newRole) {
                   const updatedUser = { ...userData, role: newRole };
                   await setDoc(userDocRef, updatedUser);
                   setUser(updatedUser);
                 } else {
                   setUser(userData);
                 }
               } else {
                 // Create new profile - For email/pass, displayName might be null
                 const email = firebaseUser.email || '';
                 const role: UserRole = email.endsWith('@gmail.com') ? 'ADMIN' : 'STUDENT';
                 
                 const newUser: AppUser = {
                   uid: firebaseUser.uid,
                   email: email,
                   displayName: firebaseUser.displayName || email.split('@')[0],
                   photoURL: firebaseUser.photoURL || '',
                   role: role,
                   createdAt: new Date().toISOString(),
                 };
                 await setDoc(userDocRef, newUser);
                 setUser(newUser);
               }
               setLoading(false);
            });
        } else {
          setUser(null);
          setLoading(false);
        }
    });
    
    return () => {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        unsubscribeAuth();
    }
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('User closed the sign-in popup.');
        return;
      }
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);                
    // Update profile after creation
    const { updateProfile } = await import('firebase/auth');
    await updateProfile(result.user, { displayName });
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithEmail, signUpWithEmail, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
