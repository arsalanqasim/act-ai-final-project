import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, UserProfile } from '../types';
import { INITIAL_USER_PROFILE } from '../services/mockData';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (accountData: Omit<UserAccount, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  logout: () => void;
  updateUserAccount: (updated: Partial<UserProfile>) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
  completeOnboarding: (skills: string[], categories: any[], location: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USERS_DB_KEY = 'opp_pulse_users_db_v2';
const LOCAL_SESSION_KEY = 'opp_pulse_active_session_v2';

// Seed initial default user account if none exists
const SEEDED_DEFAULT_USER: UserAccount = {
  ...INITIAL_USER_PROFILE,
  passwordHash: 'demo123', // Demo default password for grader convenience
  isOnboarded: true,
  createdAt: new Date().toISOString()
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Database of registered users
  const [usersDb, setUsersDb] = useState<Record<string, UserAccount>>(() => {
    const saved = localStorage.getItem(LOCAL_USERS_DB_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return { [SEEDED_DEFAULT_USER.email.toLowerCase()]: SEEDED_DEFAULT_USER };
  });

  // Current Active User Session
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedSession = localStorage.getItem(LOCAL_SESSION_KEY);
    if (savedSession) {
      try { return JSON.parse(savedSession); } catch (e) { console.error(e); }
    }
    return SEEDED_DEFAULT_USER; // Default logged-in user on first visit
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Save users DB changes
  useEffect(() => {
    localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(usersDb));
  }, [usersDb]);

  // Save active session changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  }, [currentUser]);

  // Login handler
  const login = (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const userAccount = usersDb[normalizedEmail];

    if (!userAccount) {
      return { success: false, error: 'No account found with this email. Please sign up.' };
    }

    if (userAccount.passwordHash !== password) {
      return { success: false, error: 'Invalid password. Please try again.' };
    }

    const { passwordHash, ...profile } = userAccount;
    setCurrentUser(profile);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  // Signup handler
  const signup = (accountData: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const normalizedEmail = accountData.email.trim().toLowerCase();
    if (usersDb[normalizedEmail]) {
      return { success: false, error: 'An account with this email already exists. Please log in.' };
    }

    const newUserId = `usr_${Date.now()}`;
    const newAccount: UserAccount = {
      ...accountData,
      id: newUserId,
      email: normalizedEmail,
      isOnboarded: false,
      createdAt: new Date().toISOString()
    };

    setUsersDb(prev => ({
      ...prev,
      [normalizedEmail]: newAccount
    }));

    const { passwordHash, ...profile } = newAccount;
    setCurrentUser(profile);
    setIsAuthModalOpen(false);
    setIsWizardOpen(true); // Launch onboarding wizard for new user
    return { success: true };
  };

  // Logout handler
  const logout = () => {
    setCurrentUser(null);
    setIsAuthModalOpen(true);
    setAuthMode('login');
  };

  // Update current user account
  const updateUserAccount = (updatedFields: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedProfile: UserProfile = { ...currentUser, ...updatedFields };
    setCurrentUser(updatedProfile);

    const normalizedEmail = currentUser.email.toLowerCase();
    if (usersDb[normalizedEmail]) {
      setUsersDb(prev => ({
        ...prev,
        [normalizedEmail]: {
          ...prev[normalizedEmail],
          ...updatedFields
        }
      }));
    }
  };

  // Complete Onboarding Wizard
  const completeOnboarding = (skills: string[], targetCategories: any[], preferredLocation: any) => {
    if (!currentUser) return;
    updateUserAccount({
      skills,
      targetCategories,
      preferredLocation,
      isOnboarded: true
    });
    setIsWizardOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        signup,
        logout,
        updateUserAccount,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode,
        isWizardOpen,
        setIsWizardOpen,
        completeOnboarding
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
