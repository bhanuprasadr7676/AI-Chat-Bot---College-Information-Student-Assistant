import React, { useEffect, useState } from 'react';
import { Check, CreditCard, LogIn, UserCheck } from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { DEFAULT_STUDENT_AVATAR } from '../data/defaultCampusData';
import {
  payOwnFeeRecord,
  updateOwnStudentProfile,
} from '../services/campusService';
import type { FeeRecord } from '../types/campus';

function SignInPromptCard({ title, subtitle }: { title: string; subtitle: string }) {
  const { signInWithGoogle, signInLoading, authError } = useCampus();
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-4">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto flex items-center justify-center text-blue-600 dark:text-blue-400">
        <UserCheck className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {subtitle}
        </p>
      </div>
      {authError && <p className="text-xs text-red-700 dark:text-red-400">{authError}</p>}
      <button
        type="button"
        disabled={signInLoading}
        onClick={() => void signInWithGoogle()}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
      >
        <LogIn className="w-4 h-4" aria-hidden="true" />
        <span>{signInLoading ? 'Signing in...' : 'Sign in with Google'}</span>
      </button>
    </div>
  );
}

function getAttendanceBufferNote(
  attended: number,
  total: number,
  thresholdPercent: number
): { label: string; tone: 'ok' | 'warn' | 'neutral' } {
  if (total <= 0) {
    return { label: 'Pending classes', tone: 'neutral' };
  }
  const pct = (attended / total) * 100;
  const targetRatio = thresholdPercent / 100;
  if (pct >= thresholdPercent) {
    if (targetRatio <= 0) return { label: 'On track', tone: 'ok' };
    const canMiss = Math.floor(attended / targetRatio - total);
    if (canMiss > 0) {
      return {
        label: `Safe margin: ${canMiss} class${canMiss === 1 ? '' : 'es'}`,
        tone: 'ok',
      };
    }
    return { label: 'At threshold limit', tone: 'ok' };
  }
  if (targetRatio >= 1) {
    return { label: 'Below threshold', tone: 'warn' };
  }
  const needed = Math.max(1, Math.ceil((targetRatio * total - attended) / (1 - targetRatio)));
  return {
    label: `Attend next ${needed} class${needed === 1 ? '' : 'es'}`,
    tone: 'warn',
  };
}

export function ProfileView() {
  const { authUser, userProfile, isAdmin, settings } = useCampus();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState(5);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setPhone(userProfile.phone || '');
      setDepartment(userProfile.department);
      setSemester(userProfile.semester);
    }
  }, [userProfile]);

  if (!authUser || !userProfile) {
    return (
      <SignInPromptCard
        title="Student Profile"
        subtitle="Sign in with your Google campus account to view and manage your academic profile, roll number, mentor assignment, and semester details."
      />
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(null);
    setSaveError(null);
    try {
      await updateOwnStudentProfile(userProfile.uid, {
        displayName,
        phone,
        department,
        semester: Number.isFinite(semester) ? semester : userProfile.semester,
      });
      setSavedNotice('Profile updated successfully.');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc =
    !avatarError && userProfile.photoUrl
      ? userProfile.photoUrl
      : DEFAULT_STUDENT_AVATAR;

  const inputClass =
    'w-full px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-colors';

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5 min-w-0">
          {!avatarError ? (
            <img
              src={avatarSrc}
              alt={userProfile.displayName}
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
              className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl font-bold text-slate-700 dark:text-slate-200 shrink-0">
              {userProfile.displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white truncate">
              {userProfile.displayName}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
              {userProfile.email}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono">{userProfile.rollNumber}</span>
              <span aria-hidden="true">·</span>
              <span>{userProfile.department}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Semester {userProfile.semester}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {isAdmin ? 'Administrator' : 'Student'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:text-right shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cumulative CGPA</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
              {userProfile.cgpa.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Faculty Mentor</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1.5">
              {userProfile.mentorName || 'Dr. Maya Vance'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 space-y-4"
        >
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Personal & Academic Details
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Roll number, CGPA, and role permissions are managed by campus administration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Full Name
              </span>
              <input
                type="text"
                required
                maxLength={120}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Phone Number
              </span>
              <input
                type="text"
                maxLength={32}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Department
              </span>
              <input
                type="text"
                required
                maxLength={100}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Current Semester
              </span>
              <input
                type="number"
                min={1}
                max={12}
                required
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className={`${inputClass} tabular-nums font-mono`}
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <span
              className={`text-xs font-medium ${
                saveError
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {saveError || savedNotice || ''}
            </span>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>

        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Academic Registration Summary
          </h3>
          <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Institution</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100 text-right">
                {settings.institutionName}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Roll Number</dt>
              <dd className="font-mono text-slate-900 dark:text-slate-100">
                {userProfile.rollNumber}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Academic Year</dt>
              <dd className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {settings.academicYear}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Account Status</dt>
              <dd className="font-medium text-emerald-700 dark:text-emerald-400">
                {userProfile.isActive ? 'Active Enrolled' : 'Inactive'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export function AttendanceView() {
  const { authUser, attendance, settings } = useCampus();
  const [filterMode, setFilterMode] = useState<'all' | 'shortage'>('all');

  if (!authUser) {
    return (
      <SignInPromptCard
        title="Attendance Tracker"
        subtitle="Sign in with Google to inspect your subject-wise attendance logs, cumulative percentage, and minimum eligibility status."
      />
    );
  }

  const totalAttended = attendance.reduce((s, r) => s + r.attendedClasses, 0);
  const totalClasses = attendance.reduce((s, r) => s + r.totalClasses, 0);
  const overallPct =
    totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

  const filtered = attendance.filter((rec) => {
    if (filterMode === 'all') return true;
    const pct = rec.totalClasses > 0 ? (rec.attendedClasses / rec.totalClasses) * 100 : 100;
    return pct < settings.minAttendancePercent;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Cumulative Attendance
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
              {totalClasses > 0 ? `${overallPct}%` : '--'}
            </p>
          </div>
          <div className="space-y-1.5">
            {totalClasses > 0 && (
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    overallPct >= settings.minAttendancePercent
                      ? 'bg-emerald-600'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(100, overallPct)}%` }}
                />
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {totalAttended} of {totalClasses} classes attended
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Minimum Requirement
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {settings.minAttendancePercent}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Required for end-semester exam eligibility
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Eligibility Standing
          </p>
          <p
            className={`text-lg font-semibold mt-1.5 ${
              totalClasses === 0
                ? 'text-slate-700 dark:text-slate-300'
                : overallPct >= settings.minAttendancePercent
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-red-700 dark:text-red-400'
            }`}
          >
            {totalClasses === 0
              ? 'Pending Assignment'
              : overallPct >= settings.minAttendancePercent
              ? 'Eligible for Exams'
              : 'Attendance Warning'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitored across {attendance.length} enrolled courses
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Subject-Wise Attendance Ledger
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Updated by department administrators
            </p>
          </div>
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Courses
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('shortage')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filterMode === 'shortage'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Below {settings.minAttendancePercent}%
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {attendance.length === 0
              ? 'No attendance records have been posted to your account yet.'
              : `All courses meet or exceed the ${settings.minAttendancePercent}% attendance threshold.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-5">Code</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4 text-right">Attended</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-5">Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map((rec) => {
                  const pct =
                    rec.totalClasses > 0
                      ? Math.round((rec.attendedClasses / rec.totalClasses) * 100)
                      : 0;
                  const ok = pct >= settings.minAttendancePercent;
                  const buffer = getAttendanceBufferNote(
                    rec.attendedClasses,
                    rec.totalClasses,
                    settings.minAttendancePercent
                  );
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-5 font-mono text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {rec.subjectCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {rec.subjectName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {rec.facultyName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {rec.attendedClasses}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {rec.totalClasses}
                      </td>
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                ok ? 'bg-emerald-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs tabular-nums font-semibold text-slate-900 dark:text-white w-9 text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span
                            className={`block text-xs font-semibold ${
                              ok
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-red-700 dark:text-red-400'
                            }`}
                          >
                            {ok ? 'On Track' : 'Below Threshold'}
                          </span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                            {buffer.label}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function FeesView() {
  const { authUser, fees } = useCampus();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  if (!authUser) {
    return (
      <SignInPromptCard
        title="Fee Ledger & Receipts"
        subtitle="Sign in with your Google campus account to inspect semester tuition, lab dues, payment receipts, and settle pending items."
      />
    );
  }

  const totalAssessed = fees.reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0);
  const balance = Math.max(0, totalAssessed - totalPaid);
  const paidPct =
    totalAssessed > 0 ? Math.min(100, Math.round((totalPaid / totalAssessed) * 100)) : 100;

  const handlePay = async (fee: FeeRecord) => {
    setPayingId(fee.id);
    setStatusMessage(null);
    setPayError(null);
    try {
      await payOwnFeeRecord(fee);
      setStatusMessage(`Payment recorded for "${fee.title}". Receipt generated.`);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment could not be completed.');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Assessed
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            ₹{totalAssessed.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Current academic billing
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Paid
            </p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-1">
              ₹{totalPaid.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="space-y-1.5">
            {totalAssessed > 0 && (
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${paidPct}%` }}
                />
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {totalAssessed > 0
                ? `${paidPct}% of assessed fees settled`
                : 'Verified campus receipts'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Outstanding Balance
          </p>
          <p
            className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
              balance > 0
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            ₹{balance.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {balance > 0 ? 'Settlement required before exams' : 'No pending dues'}
          </p>
        </div>
      </div>

      {(statusMessage || payError) && (
        <div
          className={`bg-white dark:bg-slate-900 rounded-xl px-5 py-3 text-sm font-medium border ${
            payError
              ? 'border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400'
              : 'border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-400'
          }`}
        >
          {payError || statusMessage}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/90 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Itemized Fee Statements
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Semester tuition, lab, examination, and facility charges
          </p>
        </div>

        {fees.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No fee records have been posted to your account yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-5">Fee Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Receipt</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {fees.map((fee) => (
                  <tr
                    key={fee.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-5 font-medium text-slate-900 dark:text-slate-100">
                      {fee.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {fee.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                      {fee.dueDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      ₹{fee.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      ₹{fee.paidAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          fee.status === 'paid'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : fee.status === 'overdue'
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {fee.status === 'paid'
                          ? 'Paid'
                          : fee.status === 'overdue'
                          ? 'Overdue'
                          : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {fee.receiptNo || '—'}
                    </td>
                    <td className="py-3 px-5 text-right">
                      {fee.status === 'paid' ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Settled
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={payingId === fee.id}
                          onClick={() => void handlePay(fee)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{payingId === fee.id ? 'Processing...' : 'Pay Now'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
