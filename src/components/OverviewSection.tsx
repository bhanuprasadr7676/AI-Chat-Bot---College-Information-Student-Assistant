import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, Building2, MessageSquare, Send } from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { CAMPUS_BANNER_IMAGE } from '../data/defaultCampusData';
import type { NavSection } from '../types/campus';

interface OverviewSectionProps {
  onNavigate: (section: NavSection) => void;
  onAskAI: (question: string) => void;
}

const QUICK_AI_SHORTCUTS = [
  'What classes are scheduled on Monday?',
  'Central Library weekend hours?',
  'Open merit scholarships?',
];

export function OverviewSection({ onNavigate, onAskAI }: OverviewSectionProps) {
  const {
    authUser,
    userProfile,
    attendance,
    fees,
    timetable,
    timings,
    notices,
    placements,
    settings,
  } = useCampus();

  const [quickPrompt, setQuickPrompt] = useState('');
  const [bannerError, setBannerError] = useState(false);

  const totalAttended = attendance.reduce((acc, r) => acc + r.attendedClasses, 0);
  const totalClasses = attendance.reduce((acc, r) => acc + r.totalClasses, 0);
  const overallAttendancePct =
    totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : null;

  const outstandingFeeAmount = fees
    .filter((f) => f.status !== 'paid')
    .reduce((acc, f) => acc + Math.max(0, f.amount - f.paidAmount), 0);
  const pendingFeeCount = fees.filter((f) => f.status !== 'paid').length;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[new Date().getDay()];
  const displayDay = todayName === 'Sunday' ? 'Monday' : todayName;
  const todaysClasses = timetable.filter((t) => t.day === displayDay);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    onAskAI(quickPrompt.trim());
    setQuickPrompt('');
  };

  return (
    <div className="space-y-6">
      {/* Campus Hero Banner */}
      <section className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-slate-900 min-h-[240px] flex items-end">
        {!bannerError ? (
          <img
            src={CAMPUS_BANNER_IMAGE}
            alt={`${settings.institutionName} Central Campus Quad`}
            referrerPolicy="no-referrer"
            onError={() => setBannerError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 flex items-center justify-center">
            <Building2 className="w-16 h-16 text-slate-600" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/20" />

        <div className="relative z-10 w-full p-6 md:p-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-medium text-blue-200 tracking-wide">
              {settings.academicYear} · {settings.currentSemester}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight text-balance">
              {settings.institutionName}
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed">
              {userProfile
                ? `Welcome back, ${userProfile.displayName} (${userProfile.rollNumber} · ${userProfile.department}). Monitor attendance, class schedules, fee ledgers, and campus AI support from one workspace.`
                : 'Centralized student dashboard for academic timetables, faculty office hours, notices, scholarships, placements, and real-time AI assistance.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('timetable')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <span>View Timetable</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('assistant')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              <span>Open AI Assistant</span>
            </button>
          </div>
        </div>
      </section>

      {/* Portal Announcement */}
      {settings.portalAnnouncement && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white mr-2">
              Campus Bulletin:
            </span>
            <span>{settings.portalAnnouncement}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('notices')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 whitespace-nowrap shrink-0"
          >
            <span>View All Notices</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* 4-Column KPI Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('attendance')}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 transition-colors flex flex-col justify-between gap-3"
        >
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Overall Attendance
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums font-mono">
              {authUser && overallAttendancePct !== null ? `${overallAttendancePct}%` : '--'}
            </p>
          </div>
          <div className="space-y-1.5">
            {authUser && overallAttendancePct !== null && (
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    overallAttendancePct >= settings.minAttendancePercent
                      ? 'bg-emerald-600'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(100, overallAttendancePct)}%` }}
                />
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {authUser
                ? overallAttendancePct !== null
                  ? `${totalAttended}/${totalClasses} classes · ${
                      overallAttendancePct >= settings.minAttendancePercent
                        ? `Above ${settings.minAttendancePercent}% goal`
                        : `Below ${settings.minAttendancePercent}% goal`
                    }`
                  : 'No records assigned yet'
                : 'Sign in to view attendance'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('fees')}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 transition-colors flex flex-col justify-between gap-3"
        >
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Outstanding Fees
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums font-mono">
              {authUser ? `₹${outstandingFeeAmount.toLocaleString('en-IN')}` : '--'}
            </p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {authUser
              ? outstandingFeeAmount === 0
                ? 'All semester dues cleared'
                : `${pendingFeeCount} pending assessment${pendingFeeCount === 1 ? '' : 's'}`
              : 'Sign in to view fee ledger'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('timetable')}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 transition-colors flex flex-col justify-between gap-3"
        >
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {displayDay} Classes
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums font-mono">
              {todaysClasses.length}
            </p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {todaysClasses.length > 0
              ? `Starts at ${todaysClasses[0].startTime} (${todaysClasses[0].courseCode})`
              : 'No classes scheduled'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('placements')}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 transition-colors flex flex-col justify-between gap-3"
        >
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Placement Drives
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums font-mono">
              {placements.filter((p) => p.status !== 'Completed').length}
            </p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Active & upcoming campus drives
          </p>
        </button>
      </section>

      {/* Main Split: Today's Schedule + AI Command Bar & Notices */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Schedule & Timings */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {displayDay} Academic Schedule
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Core sessions for {settings.currentSemester}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('timetable')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 whitespace-nowrap shrink-0"
              >
                Full Timetable
              </button>
            </div>

            {todaysClasses.length === 0 ? (
              <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
                No classes scheduled for {displayDay}. View the full weekly timetable for other days.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {todaysClasses.map((slot) => (
                  <div
                    key={slot.id}
                    className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 mr-2">
                          {slot.courseCode}
                        </span>
                        {slot.courseTitle}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {slot.facultyName} · Room {slot.room}
                      </p>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-medium text-slate-700 dark:text-slate-300 shrink-0">
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Key Campus Timings
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('timings')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 whitespace-nowrap shrink-0"
              >
                All Facilities
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {timings.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 text-sm hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {t.facility}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {t.location}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {t.weekdaysHours}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Mon–Fri</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Instant AI Query + Recent Notices */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3.5">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Ask the Campus AI Assistant
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                Get instant answers on timetables, library hours, fees, faculty cabins, and notices. Non-academic questions redirect straight to Google Search.
              </p>
            </div>

            <form onSubmit={handleQuickSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder="e.g., When is CS304 on Monday?"
                className="flex-1 min-w-0 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-colors"
              />
              <button
                type="submit"
                disabled={!quickPrompt.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ask</span>
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_AI_SHORTCUTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onAskAI(prompt)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors whitespace-nowrap"
                >
                  <span>{prompt}</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Latest Notices
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('notices')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 whitespace-nowrap shrink-0"
              >
                Read All
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notices.slice(0, 4).map((notice) => (
                <button
                  key={notice.id}
                  type="button"
                  onClick={() => onNavigate('notices')}
                  className="w-full text-left px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors space-y-1"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span
                      className={
                        notice.priority === 'Urgent'
                          ? 'text-red-600 dark:text-red-400 font-semibold'
                          : notice.priority === 'Important'
                          ? 'text-amber-600 dark:text-amber-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 font-medium'
                      }
                    >
                      {notice.priority}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{notice.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{notice.publishedDate}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                    {notice.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
