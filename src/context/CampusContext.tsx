import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, ROOT_ADMIN_EMAIL } from '../lib/firebase';
import {
  checkIsAdminUser,
  ensureUserProfile,
  seedCampusIfEmpty,
  subscribeAllAttendanceAdmin,
  subscribeAllFeesAdmin,
  subscribeAllUsersAdmin,
  subscribePublicCollection,
  subscribeStudentAttendance,
  subscribeStudentFees,
  subscribeSystemSettings,
} from '../services/campusService';
import {
  DEFAULT_FACULTY,
  DEFAULT_NOTICES,
  DEFAULT_PLACEMENTS,
  DEFAULT_SCHOLARSHIPS,
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_TIMETABLE,
  DEFAULT_TIMINGS,
} from '../data/defaultCampusData';
import type {
  AttendanceRecord,
  CollegeTiming,
  FacultyMember,
  FeeRecord,
  NoticeItem,
  PlacementDrive,
  ScholarshipItem,
  SystemSettings,
  TimetableSlot,
  UserProfile,
} from '../types/campus';

export interface LoginOptions {
  intent?: 'student' | 'register' | 'admin';
  displayName?: string;
  rollNumber?: string;
  department?: string;
  semester?: number;
  phone?: string;
}

export interface LoginResult {
  ok: boolean;
  isAdmin: boolean;
  error?: string;
}

interface CampusContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  authUser: User | null;
  authReady: boolean;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isRootAdmin: boolean;
  signInLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: (options?: LoginOptions) => Promise<LoginResult>;
  signOutUser: () => Promise<void>;
  settings: SystemSettings;
  faculty: FacultyMember[];
  timetable: TimetableSlot[];
  timings: CollegeTiming[];
  notices: NoticeItem[];
  scholarships: ScholarshipItem[];
  placements: PlacementDrive[];
  attendance: AttendanceRecord[];
  fees: FeeRecord[];
  allUsers: UserProfile[];
  allAttendance: AttendanceRecord[];
  allFees: FeeRecord[];
}

const CampusContext = createContext<CampusContextValue | null>(null);

export function CampusProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('campus_portal_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore storage failure
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('campus_portal_theme', theme);
    } catch {
      // ignore storage failure
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const signInInProgressRef = useRef(false);
  const rejectingNonAdminRef = useRef(false);

  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [faculty, setFaculty] = useState<FacultyMember[]>(DEFAULT_FACULTY);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(DEFAULT_TIMETABLE);
  const [timings, setTimings] = useState<CollegeTiming[]>(DEFAULT_TIMINGS);
  const [notices, setNotices] = useState<NoticeItem[]>(DEFAULT_NOTICES);
  const [scholarships, setScholarships] = useState<ScholarshipItem[]>(DEFAULT_SCHOLARSHIPS);
  const [placements, setPlacements] = useState<PlacementDrive[]>(DEFAULT_PLACEMENTS);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [allFees, setAllFees] = useState<FeeRecord[]>([]);

  const isRootAdmin = Boolean(
    authUser?.emailVerified && authUser?.email === ROOT_ADMIN_EMAIL
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (rejectingNonAdminRef.current || signInInProgressRef.current) {
        return;
      }

      setAuthUser(user);
      if (!user) {
        setUserProfile(null);
        setIsAdmin(false);
        setAttendance([]);
        setFees([]);
        setAllUsers([]);
        setAllAttendance([]);
        setAllFees([]);
        setAuthReady(true);
        return;
      }

      try {
        const [profile, adminStatus] = await Promise.all([
          ensureUserProfile(user),
          checkIsAdminUser(user),
        ]);
        setUserProfile(profile);
        setIsAdmin(adminStatus);
        if (user.emailVerified && user.email === ROOT_ADMIN_EMAIL) {
          await seedCampusIfEmpty(user.uid, profile.displayName);
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubs = [
      subscribeSystemSettings((docSettings) => {
        if (docSettings) setSettings(docSettings);
      }),
      subscribePublicCollection<FacultyMember>('faculty', isRootAdmin, (items) => {
        if (items.length > 0 || isRootAdmin) setFaculty(items.length ? items : DEFAULT_FACULTY);
      }),
      subscribePublicCollection<TimetableSlot>('timetable', isRootAdmin, (items) => {
        if (items.length > 0 || isRootAdmin) setTimetable(items.length ? items : DEFAULT_TIMETABLE);
      }),
      subscribePublicCollection<CollegeTiming>('timings', isRootAdmin, (items) => {
        if (items.length > 0 || isRootAdmin) setTimings(items.length ? items : DEFAULT_TIMINGS);
      }),
      subscribePublicCollection<NoticeItem>('notices', isRootAdmin, (items) => {
        if (items.length > 0 || isRootAdmin) setNotices(items.length ? items : DEFAULT_NOTICES);
      }),
      subscribePublicCollection<ScholarshipItem>('scholarships', isRootAdmin, (items) => {
        if (items.length > 0 || isRootAdmin) setScholarships(items.length ? items : DEFAULT_SCHOLARSHIPS);
      }),
      subscribePublicCollection<PlacementDrive>('placements', isRootAdmin, (items) => {
        if (items.length > 0 || isRootAdmin) setPlacements(items.length ? items : DEFAULT_PLACEMENTS);
      }),
    ];

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [isRootAdmin]);

  useEffect(() => {
    if (!authReady || !authUser) return;
    const unsubAtt = subscribeStudentAttendance(authUser.uid, setAttendance);
    const unsubFees = subscribeStudentFees(authUser.uid, setFees);
    return () => {
      unsubAtt();
      unsubFees();
    };
  }, [authReady, authUser]);

  useEffect(() => {
    if (!authReady || !isRootAdmin) return;
    const unsubUsers = subscribeAllUsersAdmin(setAllUsers);
    const unsubAtt = subscribeAllAttendanceAdmin(setAllAttendance);
    const unsubFees = subscribeAllFeesAdmin(setAllFees);
    return () => {
      unsubUsers();
      unsubAtt();
      unsubFees();
    };
  }, [authReady, isRootAdmin]);

  const signInWithGoogle = async (options?: LoginOptions): Promise<LoginResult> => {
    setSignInLoading(true);
    setAuthError(null);
    signInInProgressRef.current = true;
    const regMeta =
      options?.intent === 'register'
        ? {
            displayName: options.displayName,
            rollNumber: options.rollNumber,
            department: options.department,
            semester: options.semester,
            phone: options.phone,
            isRegistration: true,
          }
        : undefined;

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const adminStatus = await checkIsAdminUser(cred.user);

      if (options?.intent === 'admin' && !adminStatus) {
        rejectingNonAdminRef.current = true;
        await signOut(auth);
        rejectingNonAdminRef.current = false;
        setAuthUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        const msg = `The account ${cred.user.email || ''} does not have Administrator permissions. Please switch to Student Login or sign in with an authorized admin Google account.`;
        setAuthError(msg);
        return { ok: false, isAdmin: false, error: msg };
      }

      const profile = await ensureUserProfile(cred.user, regMeta);
      setAuthUser(cred.user);
      setUserProfile(profile);
      setIsAdmin(adminStatus);
      setAuthReady(true);

      if (cred.user.emailVerified && cred.user.email === ROOT_ADMIN_EMAIL) {
        await seedCampusIfEmpty(cred.user.uid, profile.displayName);
      }

      return { ok: true, isAdmin: adminStatus };
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
      try {
        const parsed = JSON.parse(msg) as { error?: string; path?: string };
        if (parsed?.error) {
          msg = `${parsed.error}${parsed.path ? ` (${parsed.path})` : ''}`;
        }
      } catch {
        // non-JSON message
      }
      setAuthError(msg);
      return { ok: false, isAdmin: false, error: msg };
    } finally {
      signInInProgressRef.current = false;
      setSignInLoading(false);
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  return (
    <CampusContext.Provider
      value={{
        theme,
        toggleTheme,
        authUser,
        authReady,
        userProfile,
        isAdmin,
        isRootAdmin,
        signInLoading,
        authError,
        clearAuthError: () => setAuthError(null),
        signInWithGoogle,
        signOutUser,
        settings,
        faculty,
        timetable,
        timings,
        notices,
        scholarships,
        placements,
        attendance,
        fees,
        allUsers,
        allAttendance,
        allFees,
      }}
    >
      {children}
    </CampusContext.Provider>
  );
}

export function useCampus() {
  const ctx = useContext(CampusContext);
  if (!ctx) throw new Error('useCampus must be used inside CampusProvider');
  return ctx;
}
