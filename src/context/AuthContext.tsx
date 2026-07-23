import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, OpportunityCategory, LocationPreference, ProfileRow } from '../types';
import { INITIAL_USER_PROFILE } from '../services/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  major: string;
  academicLevel: UserProfile['academicLevel'];
  skills?: string[];
  targetCategories?: OpportunityCategory[];
  preferredLocation?: LocationPreference;
  bio?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  supabaseUser: SupabaseUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isSupabaseConfigured: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (input: SignupInput) => Promise<{ success: boolean; error?: string; requiresConfirmation?: boolean; message?: string }>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  updateUserAccount: (updated: Partial<UserProfile>) => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
  completeOnboarding: (skills: string[], categories: OpportunityCategory[], location: LocationPreference) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_GUEST_PROFILE_KEY = 'opp_pulse_guest_profile_v2';
const LOCAL_GUEST_FLAG_KEY = 'opp_pulse_is_guest_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    // Default to guest if Supabase is unconfigured or user opted into guest mode
    if (!isSupabaseConfigured) return true;
    return localStorage.getItem(LOCAL_GUEST_FLAG_KEY) === 'true';
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);

  // Helper: map Supabase ProfileRow to UserProfile
  const mapProfileRowToUser = useCallback((row: ProfileRow): UserProfile => {
    return {
      id: row.id,
      name: row.name || 'User',
      email: row.email || '',
      major: row.major || 'Software Engineering',
      academicLevel: row.academic_level || 'Undergraduate Student',
      skills: row.skills || [],
      targetCategories: row.target_categories || [],
      preferredLocation: row.preferred_location || 'Remote',
      bio: row.bio || '',
      emailNotifications: row.email_notifications ?? true,
      isOnboarded: row.is_onboarded ?? false,
      createdAt: row.created_at
    };
  }, []);

  // Fetch or initialize profile from Supabase
  const syncProfileFromSupabase = useCallback(async (user: SupabaseUser): Promise<UserProfile> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile from Supabase:', error);
      }

      if (data) {
        return mapProfileRowToUser(data as ProfileRow);
      }

      // If no profile row exists, create one
      const newProfile: Partial<ProfileRow> = {
        id: user.id,
        email: user.email || '',
        name: (user.user_metadata?.name as string) || (user.user_metadata?.full_name as string) || 'User',
        major: 'Software Engineering',
        academic_level: 'Undergraduate Student',
        skills: ['React', 'Python', 'Generative AI', 'JavaScript'],
        target_categories: ['Hackathon', 'Scholarship', 'Internship'],
        preferred_location: 'Remote',
        bio: 'Tech enthusiast looking for high-impact opportunities.',
        email_notifications: true,
        is_onboarded: false
      };

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select('*')
        .single();

      if (insertError) {
        console.error('Error upserting profile in Supabase:', insertError);
      }

      if (inserted) {
        return mapProfileRowToUser(inserted as ProfileRow);
      }
    } catch (e) {
      console.error('Failed to sync profile from Supabase:', e);
    }

    // Fallback minimal profile
    return {
      id: user.id,
      name: (user.user_metadata?.name as string) || 'User',
      email: user.email || '',
      major: 'Software Engineering',
      academicLevel: 'Undergraduate Student',
      skills: ['React', 'Python', 'Generative AI'],
      targetCategories: ['Hackathon', 'Scholarship'],
      preferredLocation: 'Remote',
      bio: 'User Profile',
      emailNotifications: true,
      isOnboarded: false
    };
  }, [mapProfileRowToUser]);

  // Handle local guest session
  const loadGuestProfile = useCallback((): UserProfile => {
    const saved = localStorage.getItem(LOCAL_GUEST_PROFILE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_USER_PROFILE;
  }, []);

  // Listen to Supabase Auth state changes & restore session on mount
  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured) {
      setIsAuthLoading(false);
      setCurrentUser(loadGuestProfile());
      setIsGuest(true);
      return;
    }

    const initializeAuth = async () => {
      setIsAuthLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setSupabaseUser(session.user);
          setIsGuest(false);
          localStorage.removeItem(LOCAL_GUEST_FLAG_KEY);
          const profile = await syncProfileFromSupabase(session.user);
          if (isMounted) setCurrentUser(profile);
        } else if (isMounted) {
          setSupabaseUser(null);
          setCurrentUser(loadGuestProfile());
          setIsGuest(true);
        }
      } catch (err) {
        console.error('Supabase session initialization error:', err);
        if (isMounted) {
          setCurrentUser(loadGuestProfile());
          setIsGuest(true);
        }
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setSupabaseUser(session.user);
        setIsGuest(false);
        localStorage.removeItem(LOCAL_GUEST_FLAG_KEY);
        const profile = await syncProfileFromSupabase(session.user);
        if (isMounted) setCurrentUser(profile);
      } else {
        setSupabaseUser(null);
        setCurrentUser(loadGuestProfile());
        setIsGuest(true);
      }
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncProfileFromSupabase, loadGuestProfile]);

  // Login handler
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase backend is not configured. Local guest preview mode is currently active.'
      };
    }

    setIsAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        setIsAuthLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        setSupabaseUser(data.user);
        setIsGuest(false);
        localStorage.removeItem(LOCAL_GUEST_FLAG_KEY);
        const profile = await syncProfileFromSupabase(data.user);
        setCurrentUser(profile);
        setIsAuthModalOpen(false);
        setIsAuthLoading(false);
        return { success: true };
      }

      setIsAuthLoading(false);
      return { success: false, error: 'Login failed to retrieve user credentials.' };
    } catch (err: unknown) {
      setIsAuthLoading(false);
      const msg = err instanceof Error ? err.message : 'Authentication request failed.';
      return { success: false, error: msg };
    }
  };

  // Signup handler
  const signup = async (input: SignupInput): Promise<{ success: boolean; error?: string; requiresConfirmation?: boolean; message?: string }> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase backend is not configured. Local guest preview mode is currently active.'
      };
    }

    setIsAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: {
            name: input.name,
            major: input.major,
            academic_level: input.academicLevel
          }
        }
      });

      if (error) {
        setIsAuthLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Upsert custom profile details into profiles table
        const profilePayload: Partial<ProfileRow> = {
          id: data.user.id,
          name: input.name,
          email: input.email.trim(),
          major: input.major,
          academic_level: input.academicLevel,
          skills: input.skills || ['React', 'Python', 'Generative AI'],
          target_categories: input.targetCategories || ['Hackathon', 'Scholarship'],
          preferred_location: input.preferredLocation || 'Remote',
          bio: input.bio || `${input.academicLevel} specializing in ${input.major}.`,
          email_notifications: true,
          is_onboarded: false
        };

        await supabase.from('profiles').upsert(profilePayload);

        // Check if user session was immediately returned or email confirmation is required
        if (data.session) {
          setSupabaseUser(data.user);
          setIsGuest(false);
          localStorage.removeItem(LOCAL_GUEST_FLAG_KEY);
          const profile = await syncProfileFromSupabase(data.user);
          setCurrentUser(profile);
          setIsAuthModalOpen(false);
          setIsWizardOpen(true);
          setIsAuthLoading(false);
          return { success: true };
        } else {
          // Email confirmation is required
          setIsAuthLoading(false);
          return {
            success: true,
            requiresConfirmation: true,
            message: 'Account created! Please check your email inbox to confirm your email before logging in.'
          };
        }
      }

      setIsAuthLoading(false);
      return { success: false, error: 'Registration failed.' };
    } catch (err: unknown) {
      setIsAuthLoading(false);
      const msg = err instanceof Error ? err.message : 'Registration request failed.';
      return { success: false, error: msg };
    }
  };

  // Logout handler
  const logout = async (): Promise<void> => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    setSupabaseUser(null);
    setIsGuest(true);
    localStorage.setItem(LOCAL_GUEST_FLAG_KEY, 'true');
    setCurrentUser(loadGuestProfile());
    setIsAuthModalOpen(true);
    setAuthMode('login');
  };

  // Explicit Guest Mode Trigger
  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem(LOCAL_GUEST_FLAG_KEY, 'true');
    setCurrentUser(loadGuestProfile());
    setIsAuthModalOpen(false);
  };

  // Update user profile
  const updateUserAccount = async (updatedFields: Partial<UserProfile>): Promise<void> => {
    if (!currentUser) return;

    const updatedProfile: UserProfile = { ...currentUser, ...updatedFields };
    setCurrentUser(updatedProfile);

    if (isGuest || !supabaseUser || !isSupabaseConfigured) {
      localStorage.setItem(LOCAL_GUEST_PROFILE_KEY, JSON.stringify(updatedProfile));
      return;
    }

    // Persist to Supabase
    try {
      const dbPayload: Partial<ProfileRow> = {
        id: supabaseUser.id,
        name: updatedProfile.name,
        email: updatedProfile.email,
        major: updatedProfile.major,
        academic_level: updatedProfile.academicLevel,
        skills: updatedProfile.skills,
        target_categories: updatedProfile.targetCategories,
        preferred_location: updatedProfile.preferredLocation,
        bio: updatedProfile.bio,
        email_notifications: updatedProfile.emailNotifications,
        is_onboarded: updatedProfile.isOnboarded ?? false,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(dbPayload);

      if (error) {
        console.error('Error saving updated profile to Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to save profile to Supabase:', err);
    }
  };

  // Onboarding completion
  const completeOnboarding = async (
    skills: string[],
    targetCategories: OpportunityCategory[],
    preferredLocation: LocationPreference
  ): Promise<void> => {
    await updateUserAccount({
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
        supabaseUser,
        isAuthenticated: Boolean(supabaseUser && !isGuest),
        isGuest,
        isSupabaseConfigured,
        isAuthLoading,
        login,
        signup,
        logout,
        continueAsGuest,
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
