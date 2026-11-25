import React, { useEffect, useState } from 'react';
import {
  Check,
  Database,
  Plus,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import {
  adminDeleteDocument,
  adminSaveSystemSettings,
  adminSeedAllCampusData,
  adminSeedStudentRecords,
  adminUpdateUserProfile,
  adminUpsertAttendance,
  adminUpsertFaculty,
  adminUpsertFee,
  adminUpsertNotice,
  adminUpsertPlacement,
  adminUpsertScholarship,
  adminUpsertTimetable,
  adminUpsertTiming,
} from '../services/campusService';
import type {
  AttendanceRecord,
  FeeRecord,
  SystemSettings,
  UserProfile,
  UserRole,
} from '../types/campus';

type AdminTab = 'users' | 'content' | 'settings';
type ContentKind =
  | 'notices'
  | 'timetable'
  | 'faculty'
  | 'timings'
  | 'scholarships'
  | 'placements';

const FIELD_SM =
  'w-full px-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-colors';

const FIELD_XS =
  'px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-colors';

const FIELD_COMPACT =
  'px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-colors';

export function AdminControlView() {
  const {
    authUser,
    isAdmin,
    userProfile,
    allUsers,
    allAttendance,
    allFees,
    faculty,
    timetable,
    timings,
    notices,
    scholarships,
    placements,
    settings,
  } = useCampus();

  const [tab, setTab] = useState<AdminTab>('users');
  const [contentKind, setContentKind] = useState<ContentKind>('notices');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Selected user editing
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userDraft, setUserDraft] = useState<UserProfile | null>(null);

  // New Attendance / Fee forms for selected user
  const [newAtt, setNewAtt] = useState({
    subjectCode: '',
    subjectName: '',
    facultyName: '',
    attendedClasses: 18,
    totalClasses: 20,
    semester: 5,
  });
  const [newFee, setNewFee] = useState({
    title: '',
    category: 'Tuition' as FeeRecord['category'],
    semester: 5,
    amount: 500,
    paidAmount: 0,
    dueDate: '2026-12-15',
    status: 'pending' as FeeRecord['status'],
    receiptNo: '',
  });

  // System settings form
  const [settingsDraft, setSettingsDraft] = useState<SystemSettings>(settings);
  useEffect(() => {
    setSettingsDraft(settings);
  }, [settings]);

  // Content quick-add forms
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    category: 'Academic' as const,
    priority: 'Important' as const,
    summary: '',
    body: '',
    publishedDate: new Date().toISOString().slice(0, 10),
    postedBy: 'Office of Academic Affairs',
  });
  const [slotForm, setSlotForm] = useState({
    day: 'Monday' as const,
    startTime: '14:00',
    endTime: '15:00',
    courseCode: '',
    courseTitle: '',
    facultyName: '',
    room: '',
    department: 'Computer Science',
    semester: 5,
  });
  const [facultyForm, setFacultyForm] = useState({
    name: '',
    designation: 'Assistant Professor',
    department: 'Computer Science',
    officeEmail: '',
    officeRoom: '',
    officeHours: 'Mon & Wed · 14:00 - 16:00',
    specialization: '',
  });
  const [timingForm, setTimingForm] = useState({
    facility: '',
    category: 'Academic' as const,
    weekdaysHours: '08:30 - 17:30',
    weekendHours: 'Closed',
    location: '',
    notes: '',
  });
  const [scholarshipForm, setScholarshipForm] = useState({
    name: '',
    provider: '',
    amount: '₹2,500',
    eligibility: '',
    deadline: '2026-12-20',
    category: 'Merit' as const,
    status: 'Open' as const,
  });
  const [placementForm, setPlacementForm] = useState({
    company: '',
    role: '',
    packageLpa: '₹100,000',
    minCgpa: 7.5,
    driveDate: '2026-12-18',
    location: 'Campus / Hybrid',
    eligibleBranches: 'CS, ECE',
    status: 'Registration Open' as const,
  });

  useEffect(() => {
    if (allUsers.length > 0 && !selectedUserId) {
      setSelectedUserId(allUsers[0].uid);
    }
  }, [allUsers, selectedUserId]);

  useEffect(() => {
    const found = allUsers.find((u) => u.uid === selectedUserId) ?? null;
    setUserDraft(found ? { ...found } : null);
  }, [allUsers, selectedUserId]);

  if (!authUser || !isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto flex items-center justify-center text-slate-700 dark:text-slate-300">
          <Shield className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Administrator Access Required
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          System configuration, user role controls, and database management are restricted to authorized campus administrators.
        </p>
      </div>
    );
  }

  const runAction = async (msg: string, fn: () => Promise<void>) => {
    setBusy(true);
    setFeedback(null);
    setErrorFeedback(null);
    try {
      await fn();
      setFeedback(msg);
    } catch (err) {
      let errMsg = err instanceof Error ? err.message : 'Operation failed.';
      try {
        const parsed = JSON.parse(errMsg) as { error?: string; path?: string };
        if (parsed?.error) {
          errMsg = `${parsed.error}${parsed.path ? ` (${parsed.path})` : ''}`;
        }
      } catch {
        // plain string
      }
      setErrorFeedback(errMsg);
    } finally {
      setBusy(false);
    }
  };

  const selectedAttendance = allAttendance.filter((a) => a.userId === selectedUserId);
  const selectedFees = allFees.filter((f) => f.userId === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Admin Control Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full governance over student records, user permissions, campus catalogs, and AI assistant behavior
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setTab('users')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              tab === 'users'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Users & Student Data
          </button>
          <button
            type="button"
            onClick={() => setTab('content')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              tab === 'content'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Campus Content
          </button>
          <button
            type="button"
            onClick={() => setTab('settings')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              tab === 'settings'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            System Settings
          </button>
        </div>
      </div>

      {(feedback || errorFeedback) && (
        <div
          className={`bg-white dark:bg-slate-900 rounded-xl px-5 py-3 text-sm font-medium border ${
            errorFeedback
              ? 'border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400'
              : 'border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-400'
          }`}
        >
          {errorFeedback || feedback}
        </div>
      )}

      {/* TAB 1: USERS & STUDENT RECORDS */}
      {tab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Users List */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Registered Users ({allUsers.length})
                </h3>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[540px] overflow-y-auto">
              {allUsers.length === 0 ? (
                <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
                  No registered user profiles loaded yet.
                </div>
              ) : (
                allUsers.map((u) => (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => setSelectedUserId(u.uid)}
                    className={`w-full text-left px-5 py-3.5 transition-colors space-y-1 ${
                      selectedUserId === u.uid
                        ? 'bg-blue-50/70 dark:bg-blue-950/35'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {u.displayName}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          u.role === 'admin'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {u.role === 'admin' ? 'Admin' : 'Student'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {u.rollNumber} · {u.email}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Selected User Editor + Attendance & Fees */}
          <div className="lg:col-span-7 space-y-6">
            {userDraft ? (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void runAction(`Saved profile for ${userDraft.displayName}.`, () =>
                      adminUpdateUserProfile(userDraft, userProfile?.uid || authUser.uid)
                    );
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        Manage User: {userDraft.displayName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {userDraft.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void runAction(
                          `Assigned default semester attendance and fee records for ${userDraft.displayName}.`,
                          () => adminSeedStudentRecords(userDraft.uid, userDraft.displayName)
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950/80 border border-blue-200 dark:border-blue-800/70 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <Database className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Assign Default Records</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Full Name
                      </span>
                      <input
                        type="text"
                        required
                        value={userDraft.displayName}
                        onChange={(e) =>
                          setUserDraft({ ...userDraft, displayName: e.target.value })
                        }
                        className={FIELD_SM}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Role
                      </span>
                      <select
                        value={userDraft.role}
                        onChange={(e) =>
                          setUserDraft({ ...userDraft, role: e.target.value as UserRole })
                        }
                        className={FIELD_SM}
                      >
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Roll Number
                      </span>
                      <input
                        type="text"
                        required
                        value={userDraft.rollNumber}
                        onChange={(e) =>
                          setUserDraft({ ...userDraft, rollNumber: e.target.value })
                        }
                        className={`${FIELD_SM} font-mono`}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Department
                      </span>
                      <input
                        type="text"
                        required
                        value={userDraft.department}
                        onChange={(e) =>
                          setUserDraft({ ...userDraft, department: e.target.value })
                        }
                        className={FIELD_SM}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Semester
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={userDraft.semester}
                        onChange={(e) =>
                          setUserDraft({ ...userDraft, semester: Number(e.target.value) })
                        }
                        className={`${FIELD_SM} font-mono tabular-nums`}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        CGPA
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={10}
                        value={userDraft.cgpa}
                        onChange={(e) =>
                          setUserDraft({ ...userDraft, cgpa: Number(e.target.value) })
                        }
                        className={`${FIELD_SM} font-mono tabular-nums`}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Phone Number
                      </span>
                      <input
                        type="text"
                        maxLength={32}
                        value={userDraft.phone || ''}
                        onChange={(e) =>
                          setUserDraft({ ...userDraft, phone: e.target.value })
                        }
                        className={FIELD_SM}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Faculty Mentor
                      </span>
                      <input
                        type="text"
                        value={userDraft.mentorName || ''}
                        onChange={(e) =>
                          setUserDraft({ ...userDraft, mentorName: e.target.value })
                        }
                        className={FIELD_SM}
                      />
                    </label>
                    <label className="flex items-center gap-2 pt-2 sm:col-span-2 text-sm text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={userDraft.isActive}
                        onChange={(e) =>
                          setUserDraft({ ...userDraft, isActive: e.target.checked })
                        }
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                      <span>Active Enrollment Status</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    {userDraft.uid !== authUser.uid &&
                    userDraft.email !== 'bhanuprasadrbhanuprasadr@gmail.com' ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void runAction(`Removed user record for ${userDraft.displayName}.`, async () => {
                            await adminDeleteDocument('users', userDraft.uid);
                            setSelectedUserId('');
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/70 border border-red-200 dark:border-red-900/60 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Remove User</span>
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>Save User Data</span>
                    </button>
                  </div>
                </form>

                {/* Attendance Management for Selected User */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Student Attendance Records ({selectedAttendance.length})
                  </h4>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {selectedAttendance.map((rec: AttendanceRecord) => (
                      <div
                        key={rec.id}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {rec.subjectCode} · {rec.subjectName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                            {rec.attendedClasses}/{rec.totalClasses} classes (
                            {rec.totalClasses > 0
                              ? Math.round((rec.attendedClasses / rec.totalClasses) * 100)
                              : 0}
                            %)
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              void runAction('Incremented attended classes.', () =>
                                adminUpsertAttendance({
                                  ...rec,
                                  attendedClasses: rec.attendedClasses + 1,
                                  totalClasses: rec.totalClasses + 1,
                                })
                              )
                            }
                            className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md whitespace-nowrap"
                          >
                            +1 Present
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void runAction('Logged absent class.', () =>
                                adminUpsertAttendance({
                                  ...rec,
                                  totalClasses: rec.totalClasses + 1,
                                })
                              )
                            }
                            className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md whitespace-nowrap"
                          >
                            +1 Absent
                          </button>
                          <button
                            type="button"
                            aria-label="Delete attendance record"
                            onClick={() =>
                              void runAction('Attendance record removed.', () =>
                                adminDeleteDocument('attendance', rec.id)
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-red-700 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void runAction('Added attendance record.', async () => {
                        await adminUpsertAttendance({
                          userId: userDraft.uid,
                          ...newAtt,
                        });
                        setNewAtt({
                          subjectCode: '',
                          subjectName: '',
                          facultyName: '',
                          attendedClasses: 18,
                          totalClasses: 20,
                          semester: userDraft.semester,
                        });
                      });
                    }}
                    className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Code (e.g. CS305)"
                      value={newAtt.subjectCode}
                      onChange={(e) => setNewAtt({ ...newAtt, subjectCode: e.target.value })}
                      className={FIELD_COMPACT}
                    />
                    <input
                      type="text"
                      required
                      placeholder="Subject Name"
                      value={newAtt.subjectName}
                      onChange={(e) => setNewAtt({ ...newAtt, subjectName: e.target.value })}
                      className={FIELD_COMPACT}
                    />
                    <input
                      type="text"
                      required
                      placeholder="Faculty Name"
                      value={newAtt.facultyName}
                      onChange={(e) => setNewAtt({ ...newAtt, facultyName: e.target.value })}
                      className={FIELD_COMPACT}
                    />
                    <input
                      type="number"
                      min={0}
                      required
                      placeholder="Attended"
                      value={newAtt.attendedClasses}
                      onChange={(e) =>
                        setNewAtt({ ...newAtt, attendedClasses: Number(e.target.value) })
                      }
                      className={`${FIELD_COMPACT} font-mono tabular-nums`}
                    />
                    <input
                      type="number"
                      min={1}
                      required
                      placeholder="Total"
                      value={newAtt.totalClasses}
                      onChange={(e) =>
                        setNewAtt({ ...newAtt, totalClasses: Number(e.target.value) })
                      }
                      className={`${FIELD_COMPACT} font-mono tabular-nums`}
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Attendance</span>
                    </button>
                  </form>
                </div>

                {/* Fee Management for Selected User */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Student Fee Assessments ({selectedFees.length})
                  </h4>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {selectedFees.map((fee) => (
                      <div
                        key={fee.id}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {fee.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                            ₹{fee.amount.toLocaleString('en-IN')} · {fee.status.toUpperCase()} · Due{' '}
                            {fee.dueDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {fee.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() =>
                                void runAction('Marked fee as paid.', () =>
                                  adminUpsertFee({
                                    ...fee,
                                    status: 'paid',
                                    paidAmount: fee.amount,
                                    receiptNo:
                                      fee.receiptNo ||
                                      `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
                                  })
                                )
                              }
                              className="px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70 rounded-md whitespace-nowrap"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label="Delete fee record"
                            onClick={() =>
                              void runAction('Fee record deleted.', () =>
                                adminDeleteDocument('fees', fee.id)
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-red-700 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void runAction('Added fee item.', async () => {
                        await adminUpsertFee({
                          userId: userDraft.uid,
                          studentName: userDraft.displayName,
                          ...newFee,
                        });
                        setNewFee({ ...newFee, title: '' });
                      });
                    }}
                    className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Fee Title"
                      value={newFee.title}
                      onChange={(e) => setNewFee({ ...newFee, title: e.target.value })}
                      className={FIELD_COMPACT}
                    />
                    <select
                      value={newFee.category}
                      onChange={(e) =>
                        setNewFee({
                          ...newFee,
                          category: e.target.value as FeeRecord['category'],
                        })
                      }
                      className={FIELD_COMPACT}
                    >
                      <option value="Tuition">Tuition</option>
                      <option value="Laboratory">Laboratory</option>
                      <option value="Examination">Examination</option>
                      <option value="Library">Library</option>
                      <option value="Hostel">Hostel</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      required
                      placeholder="Amount"
                      value={newFee.amount}
                      onChange={(e) => setNewFee({ ...newFee, amount: Number(e.target.value) })}
                      className={`${FIELD_COMPACT} font-mono tabular-nums`}
                    />
                    <input
                      type="date"
                      required
                      value={newFee.dueDate}
                      onChange={(e) => setNewFee({ ...newFee, dueDate: e.target.value })}
                      className={`${FIELD_COMPACT} font-mono`}
                    />
                    <select
                      value={newFee.status}
                      onChange={(e) =>
                        setNewFee({
                          ...newFee,
                          status: e.target.value as FeeRecord['status'],
                        })
                      }
                      className={FIELD_COMPACT}
                    >
                      <option value="pending">Pending</option>
                      <option value="overdue">Overdue</option>
                      <option value="paid">Paid</option>
                    </select>
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Fee</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Select a user from the directory to manage their academic profile, attendance, and fees.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CAMPUS CONTENT CRUD */}
      {tab === 'content' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto">
              {(
                [
                  ['notices', 'Notices'],
                  ['timetable', 'Timetable'],
                  ['faculty', 'Faculty'],
                  ['timings', 'Timings'],
                  ['scholarships', 'Scholarships'],
                  ['placements', 'Placements'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setContentKind(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    contentKind === key
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction('Default campus datasets synced to Firestore.', adminSeedAllCampusData)
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Database className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sync Default Campus Data</span>
            </button>
          </div>

          {contentKind === 'notices' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void runAction('Notice published.', async () => {
                    await adminUpsertNotice({
                      ...noticeForm,
                      body: noticeForm.body || noticeForm.summary,
                      isPublished: true,
                    });
                    setNoticeForm({ ...noticeForm, title: '', summary: '', body: '' });
                  });
                }}
                className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Publish New Notice
                </h3>
                <input
                  type="text"
                  required
                  placeholder="Notice Title"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  className={FIELD_SM}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={noticeForm.category}
                    onChange={(e) =>
                      setNoticeForm({
                        ...noticeForm,
                        category: e.target.value as typeof noticeForm.category,
                      })
                    }
                    className={FIELD_XS}
                  >
                    <option value="Academic">Academic</option>
                    <option value="Examination">Examination</option>
                    <option value="Administration">Administration</option>
                    <option value="Events">Events</option>
                    <option value="Scholarship">Scholarship</option>
                  </select>
                  <select
                    value={noticeForm.priority}
                    onChange={(e) =>
                      setNoticeForm({
                        ...noticeForm,
                        priority: e.target.value as typeof noticeForm.priority,
                      })
                    }
                    className={FIELD_XS}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder="Short summary..."
                  value={noticeForm.summary}
                  onChange={(e) => setNoticeForm({ ...noticeForm, summary: e.target.value })}
                  className={FIELD_SM}
                />
                <textarea
                  rows={3}
                  placeholder="Full circular details..."
                  value={noticeForm.body}
                  onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })}
                  className={FIELD_SM}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Publish Notice
                </button>
              </form>

              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {notices.map((n) => (
                  <div key={n.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {n.category} · {n.priority} · {n.publishedDate}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void runAction('Notice deleted.', () => adminDeleteDocument('notices', n.id))
                      }
                      className="p-1.5 text-slate-400 hover:text-red-700 dark:hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {contentKind === 'timetable' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void runAction('Timetable slot added.', async () => {
                    await adminUpsertTimetable({ ...slotForm, isPublished: true });
                    setSlotForm({ ...slotForm, courseCode: '', courseTitle: '', room: '' });
                  });
                }}
                className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Add Timetable Slot
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={slotForm.day}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, day: e.target.value as typeof slotForm.day })
                    }
                    className={`${FIELD_XS} px-2.5`}
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      )
                    )}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="09:00"
                    value={slotForm.startTime}
                    onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                    className={`${FIELD_XS} px-2.5 font-mono`}
                  />
                  <input
                    type="text"
                    required
                    placeholder="09:55"
                    value={slotForm.endTime}
                    onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                    className={`${FIELD_XS} px-2.5 font-mono`}
                  />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Course Code (e.g. CS312)"
                  value={slotForm.courseCode}
                  onChange={(e) => setSlotForm({ ...slotForm, courseCode: e.target.value })}
                  className={FIELD_SM}
                />
                <input
                  type="text"
                  required
                  placeholder="Course Title"
                  value={slotForm.courseTitle}
                  onChange={(e) => setSlotForm({ ...slotForm, courseTitle: e.target.value })}
                  className={FIELD_SM}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Faculty Name"
                    value={slotForm.facultyName}
                    onChange={(e) => setSlotForm({ ...slotForm, facultyName: e.target.value })}
                    className={FIELD_XS}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Room (e.g. LH-202)"
                    value={slotForm.room}
                    onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                    className={FIELD_XS}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Department"
                    value={slotForm.department}
                    onChange={(e) => setSlotForm({ ...slotForm, department: e.target.value })}
                    className={FIELD_XS}
                  />
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    placeholder="Semester"
                    value={slotForm.semester}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, semester: Number(e.target.value) })
                    }
                    className={`${FIELD_XS} font-mono tabular-nums`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Add Class Slot
                </button>
              </form>

              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-[440px] overflow-y-auto">
                {timetable.map((slot) => (
                  <div key={slot.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {slot.day} · {slot.startTime}-{slot.endTime} · {slot.courseCode}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {slot.courseTitle} ({slot.facultyName}, {slot.room})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void runAction('Timetable slot removed.', () =>
                          adminDeleteDocument('timetable', slot.id)
                        )
                      }
                      className="p-1.5 text-slate-400 hover:text-red-700 dark:hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {contentKind === 'faculty' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void runAction('Faculty member saved.', async () => {
                    await adminUpsertFaculty({
                      ...facultyForm,
                      photoUrl: '',
                      isPublished: true,
                    });
                    setFacultyForm({
                      ...facultyForm,
                      name: '',
                      officeEmail: '',
                      officeRoom: '',
                      specialization: '',
                    });
                  });
                }}
                className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Add Faculty Member
                </h3>
                <input
                  type="text"
                  required
                  placeholder="Full Name (e.g. Dr. Elena Rostova)"
                  value={facultyForm.name}
                  onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                  className={FIELD_SM}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Designation"
                    value={facultyForm.designation}
                    onChange={(e) =>
                      setFacultyForm({ ...facultyForm, designation: e.target.value })
                    }
                    className={FIELD_XS}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Department"
                    value={facultyForm.department}
                    onChange={(e) =>
                      setFacultyForm({ ...facultyForm, department: e.target.value })
                    }
                    className={FIELD_XS}
                  />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Institutional Email"
                  value={facultyForm.officeEmail}
                  onChange={(e) =>
                    setFacultyForm({ ...facultyForm, officeEmail: e.target.value })
                  }
                  className={FIELD_SM}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Office Room"
                    value={facultyForm.officeRoom}
                    onChange={(e) =>
                      setFacultyForm({ ...facultyForm, officeRoom: e.target.value })
                    }
                    className={FIELD_XS}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Office Hours"
                    value={facultyForm.officeHours}
                    onChange={(e) =>
                      setFacultyForm({ ...facultyForm, officeHours: e.target.value })
                    }
                    className={FIELD_XS}
                  />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Specialization"
                  value={facultyForm.specialization}
                  onChange={(e) =>
                    setFacultyForm({ ...facultyForm, specialization: e.target.value })
                  }
                  className={FIELD_SM}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Add Faculty Member
                </button>
              </form>

              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {faculty.map((f) => (
                  <div key={f.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {f.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {f.designation} · {f.department} · {f.officeRoom}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void runAction('Faculty member removed.', () =>
                          adminDeleteDocument('faculty', f.id)
                        )
                      }
                      className="p-1.5 text-slate-400 hover:text-red-700 dark:hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {contentKind === 'timings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void runAction('Facility timing added.', async () => {
                    await adminUpsertTiming({ ...timingForm, isPublished: true });
                    setTimingForm({ ...timingForm, facility: '', location: '', notes: '' });
                  });
                }}
                className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Add Facility Timing
                </h3>
                <input
                  type="text"
                  required
                  placeholder="Facility Name"
                  value={timingForm.facility}
                  onChange={(e) => setTimingForm({ ...timingForm, facility: e.target.value })}
                  className={FIELD_SM}
                />
                <select
                  value={timingForm.category}
                  onChange={(e) =>
                    setTimingForm({
                      ...timingForm,
                      category: e.target.value as typeof timingForm.category,
                    })
                  }
                  className={`w-full ${FIELD_XS}`}
                >
                  <option value="Academic">Academic</option>
                  <option value="Library">Library</option>
                  <option value="Administration">Administration</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Student Services">Student Services</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Weekday Hours"
                    value={timingForm.weekdaysHours}
                    onChange={(e) =>
                      setTimingForm({ ...timingForm, weekdaysHours: e.target.value })
                    }
                    className={`${FIELD_XS} font-mono`}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Weekend Hours"
                    value={timingForm.weekendHours}
                    onChange={(e) =>
                      setTimingForm({ ...timingForm, weekendHours: e.target.value })
                    }
                    className={`${FIELD_XS} font-mono`}
                  />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Location"
                  value={timingForm.location}
                  onChange={(e) => setTimingForm({ ...timingForm, location: e.target.value })}
                  className={FIELD_SM}
                />
                <input
                  type="text"
                  placeholder="Notes"
                  value={timingForm.notes}
                  onChange={(e) => setTimingForm({ ...timingForm, notes: e.target.value })}
                  className={FIELD_SM}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Add Facility Timing
                </button>
              </form>

              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {timings.map((t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {t.facility}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {t.weekdaysHours} · {t.location}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void runAction('Timing entry removed.', () =>
                          adminDeleteDocument('timings', t.id)
                        )
                      }
                      className="p-1.5 text-slate-400 hover:text-red-700 dark:hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {contentKind === 'scholarships' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void runAction('Scholarship added.', async () => {
                    await adminUpsertScholarship({ ...scholarshipForm, isPublished: true });
                    setScholarshipForm({ ...scholarshipForm, name: '', provider: '', eligibility: '' });
                  });
                }}
                className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Add Scholarship
                </h3>
                <input
                  type="text"
                  required
                  placeholder="Scholarship Name"
                  value={scholarshipForm.name}
                  onChange={(e) => setScholarshipForm({ ...scholarshipForm, name: e.target.value })}
                  className={FIELD_SM}
                />
                <input
                  type="text"
                  required
                  placeholder="Provider Organization"
                  value={scholarshipForm.provider}
                  onChange={(e) =>
                    setScholarshipForm({ ...scholarshipForm, provider: e.target.value })
                  }
                  className={FIELD_SM}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Grant Amount"
                    value={scholarshipForm.amount}
                    onChange={(e) =>
                      setScholarshipForm({ ...scholarshipForm, amount: e.target.value })
                    }
                    className={FIELD_XS}
                  />
                  <input
                    type="date"
                    required
                    value={scholarshipForm.deadline}
                    onChange={(e) =>
                      setScholarshipForm({ ...scholarshipForm, deadline: e.target.value })
                    }
                    className={`${FIELD_XS} font-mono`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={scholarshipForm.category}
                    onChange={(e) =>
                      setScholarshipForm({
                        ...scholarshipForm,
                        category: e.target.value as typeof scholarshipForm.category,
                      })
                    }
                    className={FIELD_XS}
                  >
                    <option value="Merit">Merit</option>
                    <option value="Need-Based">Need-Based</option>
                    <option value="Research">Research</option>
                    <option value="STEM">STEM</option>
                    <option value="Sports">Sports</option>
                  </select>
                  <select
                    value={scholarshipForm.status}
                    onChange={(e) =>
                      setScholarshipForm({
                        ...scholarshipForm,
                        status: e.target.value as typeof scholarshipForm.status,
                      })
                    }
                    className={FIELD_XS}
                  >
                    <option value="Open">Open</option>
                    <option value="Closing Soon">Closing Soon</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder="Eligibility Criteria"
                  value={scholarshipForm.eligibility}
                  onChange={(e) =>
                    setScholarshipForm({ ...scholarshipForm, eligibility: e.target.value })
                  }
                  className={FIELD_SM}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Add Scholarship
                </button>
              </form>

              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {scholarships.map((s) => (
                  <div key={s.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {s.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {s.amount} · Deadline {s.deadline}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void runAction('Scholarship deleted.', () =>
                          adminDeleteDocument('scholarships', s.id)
                        )
                      }
                      className="p-1.5 text-slate-400 hover:text-red-700 dark:hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {contentKind === 'placements' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void runAction('Placement drive added.', async () => {
                    await adminUpsertPlacement({ ...placementForm, isPublished: true });
                    setPlacementForm({ ...placementForm, company: '', role: '' });
                  });
                }}
                className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Add Placement Drive
                </h3>
                <input
                  type="text"
                  required
                  placeholder="Company Name"
                  value={placementForm.company}
                  onChange={(e) => setPlacementForm({ ...placementForm, company: e.target.value })}
                  className={FIELD_SM}
                />
                <input
                  type="text"
                  required
                  placeholder="Role Title"
                  value={placementForm.role}
                  onChange={(e) => setPlacementForm({ ...placementForm, role: e.target.value })}
                  className={FIELD_SM}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Compensation"
                    value={placementForm.packageLpa}
                    onChange={(e) =>
                      setPlacementForm({ ...placementForm, packageLpa: e.target.value })
                    }
                    className={FIELD_XS}
                  />
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={10}
                    required
                    placeholder="Min CGPA"
                    value={placementForm.minCgpa}
                    onChange={(e) =>
                      setPlacementForm({ ...placementForm, minCgpa: Number(e.target.value) })
                    }
                    className={`${FIELD_XS} font-mono tabular-nums`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    required
                    value={placementForm.driveDate}
                    onChange={(e) =>
                      setPlacementForm({ ...placementForm, driveDate: e.target.value })
                    }
                    className={`${FIELD_XS} font-mono`}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Branches"
                    value={placementForm.eligibleBranches}
                    onChange={(e) =>
                      setPlacementForm({ ...placementForm, eligibleBranches: e.target.value })
                    }
                    className={FIELD_XS}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Location"
                    value={placementForm.location}
                    onChange={(e) =>
                      setPlacementForm({ ...placementForm, location: e.target.value })
                    }
                    className={FIELD_XS}
                  />
                  <select
                    value={placementForm.status}
                    onChange={(e) =>
                      setPlacementForm({
                        ...placementForm,
                        status: e.target.value as typeof placementForm.status,
                      })
                    }
                    className={FIELD_XS}
                  >
                    <option value="Registration Open">Registration Open</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Add Placement Drive
                </button>
              </form>

              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {placements.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {p.company} — {p.role}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {p.packageLpa} · Min CGPA {p.minCgpa} · {p.driveDate}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void runAction('Placement drive removed.', () =>
                          adminDeleteDocument('placements', p.id)
                        )
                      }
                      className="p-1.5 text-slate-400 hover:text-red-700 dark:hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SYSTEM SETTINGS */}
      {tab === 'settings' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runAction('System settings saved and applied.', () =>
              adminSaveSystemSettings(settingsDraft)
            );
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 space-y-6"
        >
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Global Campus & AI Assistant Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Changes apply immediately across the student dashboard and real-time AI assistant
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Institution Name
              </span>
              <input
                type="text"
                required
                value={settingsDraft.institutionName}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, institutionName: e.target.value })
                }
                className={FIELD_SM}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Academic Year
              </span>
              <input
                type="text"
                required
                value={settingsDraft.academicYear}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, academicYear: e.target.value })
                }
                className={`${FIELD_SM} font-mono`}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Current Semester Label
              </span>
              <input
                type="text"
                required
                value={settingsDraft.currentSemester}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, currentSemester: e.target.value })
                }
                className={FIELD_SM}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Minimum Attendance Threshold (%)
              </span>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={settingsDraft.minAttendancePercent}
                onChange={(e) =>
                  setSettingsDraft({
                    ...settingsDraft,
                    minAttendancePercent: Number(e.target.value),
                  })
                }
                className={`${FIELD_SM} font-mono tabular-nums`}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Support Email
              </span>
              <input
                type="email"
                required
                value={settingsDraft.supportEmail}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, supportEmail: e.target.value })
                }
                className={FIELD_SM}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Support Helpline Phone
              </span>
              <input
                type="text"
                required
                value={settingsDraft.supportPhone}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, supportPhone: e.target.value })
                }
                className={`${FIELD_SM} font-mono`}
              />
            </label>

            <label className="block space-y-1.5 md:col-span-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Google Search Redirect Base URL (Non-Academic Queries)
              </span>
              <input
                type="url"
                required
                value={settingsDraft.googleSearchRedirectBase}
                onChange={(e) =>
                  setSettingsDraft({
                    ...settingsDraft,
                    googleSearchRedirectBase: e.target.value,
                  })
                }
                className={`${FIELD_SM} font-mono`}
              />
            </label>

            <label className="block space-y-1.5 md:col-span-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Portal Top Bulletin Announcement
              </span>
              <textarea
                rows={2}
                maxLength={300}
                value={settingsDraft.portalAnnouncement}
                onChange={(e) =>
                  setSettingsDraft({ ...settingsDraft, portalAnnouncement: e.target.value })
                }
                className={FIELD_SM}
              />
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsDraft.aiAssistantEnabled}
                onChange={(e) =>
                  setSettingsDraft({
                    ...settingsDraft,
                    aiAssistantEnabled: e.target.checked,
                  })
                }
                className="mt-1 rounded border-slate-300 dark:border-slate-600"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Enable Real-Time AI Student Assistant
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Controls whether students can query the real-time Gemini campus assistant.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsDraft.strictAcademicMode}
                onChange={(e) =>
                  setSettingsDraft({
                    ...settingsDraft,
                    strictAcademicMode: e.target.checked,
                  })
                }
                className="mt-1 rounded border-slate-300 dark:border-slate-600"
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Enforce Academic-Only Scope with Google Search Redirect
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  When active, non-academic and non-college questions automatically redirect students to Google Search.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>{busy ? 'Saving...' : 'Save System Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
