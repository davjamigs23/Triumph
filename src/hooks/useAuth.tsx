import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';                
import { auth, db } from '../firebase';
import { AppUser, UserRole } from '../types';
import { handleFirestoreError, OperationType } from '../lib/utils';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string, role?: UserRole) => Promise<void>;
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
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            
            unsubscribeSnapshot = onSnapshot(userDocRef, 
              (userDoc) => {
                if (userDoc.exists()) {
                  setUser(userDoc.data() as AppUser);
                } else {
                  setUser(null);
                }
                setLoading(false);
              },
              (error) => {
                // If it's a new user, they might not have a document yet, but 'get' should still be allowed.
                // However, if it fails, we handle it.
                handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
                setLoading(false);
              }
            );
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
      const result = await signInWithPopup(auth, provider);
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Sign out immediately if no record exists in Firestore
        await signOut(auth);
        throw new Error('No account found for this Google email. Please register using your email and password first to set up your profile and role.');
      }
      // If doc exists, internal state user will be set by the onSnapshot listener in useEffect
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

  const signUpWithEmail = async (email: string, password: string, displayName: string, role: UserRole = 'STUDENT') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);                
      
      const isSuperAdminCheck = email === 'djignaci1@gmail.com' || email === 'djignaci2@gmail.com';
      // If they are a super admin, we let them choose their role for testing, but default to ADMIN if they choose ADMIN.
      // Actually, just respect the passed role since they are the ones choosing it in the UI.
      const finalRole = role;

      // Create Firestore document immediately
      const userDocRef = doc(db, 'users', result.user.uid);
      const newUser: AppUser = {
        uid: result.user.uid,
        email: email,
        displayName: displayName,
        photoURL: '',
        role: finalRole,
        createdAt: new Date().toISOString(),
      };
      
      try {
        await setDoc(userDocRef, newUser);
      } catch (firestoreErr: any) {
        console.error("Failed to create Firestore profile during registration:", firestoreErr);
        // Throw the error so the user knows signup failed (likely rules or network)
        throw firestoreErr;
      }

      // Update Firebase Auth profile
      try {
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(result.user, { displayName });
      } catch (authErr: any) {
        console.error("Failed to update Auth profile displayName:", authErr);
      }
    } catch (err: any) {
      console.error("Sign up error code:", err.code);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    const actionCodeSettings = {
      url: window.location.origin,
      handleCodeInApp: false
    };
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
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
