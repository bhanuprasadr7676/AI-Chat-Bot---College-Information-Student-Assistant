import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  GraduationCap,
  LogIn,
  Moon,
  ShieldCheck,
  Sun,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { CAMPUS_BANNER_IMAGE } from '../data/defaultCampusData';

interface LoginPageProps {
  onSuccess: (role: 'student' | 'admin') => void;
  onContinueAsGuest: () => void;
}

type PortalAuthMode = 'student' | 'register' | 'admin';

const DEPARTMENTS = [
  'Computer Science',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Mathematics & Data Science',
  'Information Technology',
];

export function LoginPage({ onSuccess, onContinueAsGuest }: LoginPageProps) {
  const {
    theme,
    toggleTheme,
    authUser,
    userProfile,
    isAdmin,
    settings,
    signInWithGoogle,
    signOutUser,
    signInLoading,
    authError,
    clearAuthError,
  } = useCampus();

  const [mode, setMode] = useState<PortalAuthMode>('student');
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [semester, setSemester] = useState(1);
  const [phone, setPhone] = useState('');
  const [bannerError, setBannerError] = useState(false);

  const handleModeSwitch = (nextMode: PortalAuthMode) => {
    setMode(nextMode);
    clearAuthError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signInWithGoogle(
      mode === 'register'
        ? {
            intent: 'register',
            displayName: fullName.trim(),
            rollNumber: rollNumber.trim(),
            department,
            semester,
            phone: phone.trim(),
          }
        : {
            intent: mode,
          }
    );

    if (res.ok) {
      onSuccess(mode === 'admin' && res.isAdmin ? 'admin' : 'student');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] bg-architectural-grid flex flex-col justify-between p-4 sm:p-8 lg:p-10 transition-colors">
      {/* Top Minimal Utility Strip */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
            AI Chat Bot
          </span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Light Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Main Unified Architectural Split Card */}
      <div className="flex-1 flex items-center justify-center py-2">
        <div className="max-w-6xl w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-sm">
          {/* Left Institutional Media Panel */}
          <div className="lg:col-span-5 relative bg-slate-900 text-white p-7 sm:p-9 flex flex-col justify-between min-h-[280px] lg:min-h-[640px]">
            {!bannerError ? (
              <img
                src={CAMPUS_BANNER_IMAGE}
                alt={`${settings.institutionName} Campus`}
                referrerPolicy="no-referrer"
                onError={() => setBannerError(true)}
                className="absolute inset-0 w-full h-full object-cover lg:h-full"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 flex items-center justify-center">
                <Building2 className="w-16 h-16 text-slate-600" aria-hidden="true" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-900/45" />

            <div className="relative z-10 space-y-3">
              <p className="text-xs font-medium text-blue-200 tracking-wide">
                {settings.academicYear} · {settings.currentSemester}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance leading-tight">
                {settings.institutionName}
              </h1>
              <p className="text-sm text-slate-200 leading-relaxed max-w-md">
                Unified campus gateway for student access, new enrollment registration, administrative governance, and real-time academic AI assistance.
              </p>
            </div>

            <div className="relative z-10 pt-8 mt-8 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div>
                <p className="text-xs font-semibold text-white">
                  Academic & Student Workspace
                </p>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Register your roll number or sign in for live attendance tracking, rupee fee ledgers, class schedules, scholarships, and placements.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Real-Time AI Campus Assistant
                </p>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Answers academic and facility queries instantaneously while routing general topics directly to Google Search.
                </p>
              </div>
            </div>
          </div>

          {/* Right Unified 1-Page Login & Registration Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between gap-6">
            <div className="space-y-6">
              {authUser && (
                <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      Signed in as {userProfile?.displayName || authUser.displayName || authUser.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {userProfile?.email || authUser.email} · {isAdmin ? 'Administrator' : 'Student'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSuccess(isAdmin ? 'admin' : 'student')}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      Continue to Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => void signOutUser()}
                      className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}

              {/* 3-Mode Segmented Selector */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Access Portal Mode
                </span>
                <div
                  role="tablist"
                  aria-label="Portal access options"
                  className="grid grid-cols-1 sm:grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 rounded-xl"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'student'}
                    onClick={() => handleModeSwitch('student')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 ${
                      mode === 'student'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Student Login</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'register'}
                    onClick={() => handleModeSwitch('register')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 ${
                      mode === 'register'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Student Registration</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'admin'}
                    onClick={() => handleModeSwitch('admin')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 ${
                      mode === 'admin'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Admin Login</span>
                  </button>
                </div>
              </div>

              {/* Active Mode Heading & Animated Body */}
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight text-balance">
                    {mode === 'student'
                      ? 'Student Portal Sign In'
                      : mode === 'register'
                      ? 'New Student Registration'
                      : 'Administrator Console Sign In'}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {mode === 'student'
                      ? 'Authenticate with your Google campus account to open your profile, attendance ledger, fee receipts, and timetable.'
                      : mode === 'register'
                      ? 'Complete your academic enrollment details below and continue with Google to provision your student account.'
                      : 'Sign in with an authorized administrator Google account to govern user records, campus data, and system settings.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'student' && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Existing Student Sign In
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        First time using the portal? Open{' '}
                        <button
                          type="button"
                          onClick={() => handleModeSwitch('register')}
                          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                        >
                          Student Registration
                        </button>{' '}
                        to set your roll number, department, and semester first.
                      </p>
                    </div>
                  )}

                  {mode === 'register' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <label className="block space-y-1.5 sm:col-span-2">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Full Name
                        </span>
                        <input
                          type="text"
                          required
                          maxLength={120}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Ananya Sharma"
                          className="w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                        />
                      </label>

                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Roll Number
                        </span>
                        <input
                          type="text"
                          required
                          maxLength={32}
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          placeholder="e.g. CIT-2026-104"
                          className="w-full px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                        />
                      </label>

                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Department
                        </span>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                        >
                          {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Semester
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          required
                          value={semester}
                          onChange={(e) => setSemester(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                        />
                      </label>

                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Phone Number (Optional)
                        </span>
                        <input
                          type="text"
                          maxLength={32}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                        />
                      </label>
                    </div>
                  )}

                  {mode === 'admin' && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Role Verification Active
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Only verified administrator accounts registered in the campus directory can enter the Admin Control Center.
                      </p>
                    </div>
                  )}

                  {authError && (
                    <div
                      role="alert"
                      className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-3.5 text-xs text-red-800 dark:text-red-300 leading-relaxed"
                    >
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={signInLoading}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {mode === 'register' ? (
                      <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      {signInLoading
                        ? 'Verifying Google Account...'
                        : mode === 'student'
                        ? 'Sign in as Student with Google'
                        : mode === 'register'
                        ? 'Register & Continue with Google'
                        : 'Sign in as Admin with Google'}
                    </span>
                  </button>
                </form>
              </motion.div>
            </div>

            {/* Footer Actions */}
            <div className="pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Helpdesk: {settings.supportEmail}
              </p>
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 whitespace-nowrap shrink-0 self-start sm:self-auto"
              >
                <span>Browse Public Campus Portal</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
