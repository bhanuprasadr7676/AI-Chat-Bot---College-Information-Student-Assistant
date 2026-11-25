import React, { useMemo, useState } from 'react';
import { Mail, MapPin, Search } from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import type { NoticeItem } from '../types/campus';

const DAYS_OF_WEEK = [
  'All Days',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const TODAY_WEEKDAY = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
][new Date().getDay()];

const SEARCH_INPUT_CLASS =
  'w-full pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-colors';

export function FacultyView() {
  const { faculty } = useCampus();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const departments = useMemo(
    () => ['All', ...Array.from(new Set(faculty.map((f) => f.department)))],
    [faculty]
  );

  const filtered = faculty.filter((f) => {
    const matchesDept = deptFilter === 'All' || f.department === deptFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.department.toLowerCase().includes(q) ||
      f.specialization.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search faculty by name, department, or research area..."
            className={SEARCH_INPUT_CLASS}
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto">
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                deptFilter === dept
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No faculty members match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((member) => {
            const showPhoto = Boolean(member.photoUrl) && !brokenImages[member.id];
            const initials = member.name
              .replace(/^(Dr\.|Prof\.)\s+/i, '')
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <article
                key={member.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 flex items-start gap-4 transition-colors"
              >
                {showPhoto ? (
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenImages((prev) => ({ ...prev, [member.id]: true }))
                    }
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-200 shrink-0">
                    {initials}
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                      {member.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {member.designation} · {member.department}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Specialization:
                    </span>{' '}
                    {member.specialization}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span>
                        {member.officeRoom} · {member.officeHours}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <a
                        href={`mailto:${member.officeEmail}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                      >
                        {member.officeEmail}
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TimetableView() {
  const { timetable, settings } = useCampus();
  const [selectedDay, setSelectedDay] = useState<(typeof DAYS_OF_WEEK)[number]>('All Days');
  const [search, setSearch] = useState('');

  const filtered = timetable.filter((slot) => {
    const dayOk = selectedDay === 'All Days' || slot.day === selectedDay;
    const q = search.trim().toLowerCase();
    const searchOk =
      !q ||
      slot.courseCode.toLowerCase().includes(q) ||
      slot.courseTitle.toLowerCase().includes(q) ||
      slot.facultyName.toLowerCase().includes(q) ||
      slot.room.toLowerCase().includes(q);
    return dayOk && searchOk;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto">
          {DAYS_OF_WEEK.map((day) => {
            const isToday = day === TODAY_WEEKDAY;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedDay === day
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {day}
                {isToday ? ' (Today)' : ''}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter course, faculty, or room..."
            className={SEARCH_INPUT_CLASS}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Weekly Class Timetable
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {settings.currentSemester} · {filtered.length} scheduled sessions
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No timetable slots match the selected day or filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-5">Day</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Course Title</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-5">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map((slot) => {
                  const isTodaySlot = slot.day === TODAY_WEEKDAY;
                  return (
                    <tr
                      key={slot.id}
                      className={`transition-colors ${
                        isTodaySlot
                          ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/35'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-5 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {slot.day}
                        {isTodaySlot && (
                          <span className="ml-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            · Today
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {slot.startTime} – {slot.endTime}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {slot.courseCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {slot.courseTitle}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {slot.facultyName}
                      </td>
                      <td className="py-3 px-5 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {slot.room}
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

export function TimingsView() {
  const { timings, settings } = useCampus();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/90 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            College & Campus Facility Timings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Standard operational hours for academic blocks, libraries, laboratories, and administrative offices
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <th className="py-3 px-5">Facility</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Mon – Fri Hours</th>
                <th className="py-3 px-4">Weekend Hours</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {timings.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-slate-100">
                    {item.facility}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {item.category}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {item.weekdaysHours}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {item.weekendHours}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    {item.location}
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                    {item.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Student Helpdesk & Registrar Support
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            For after-hours lab access permissions or official transcript requests
          </p>
        </div>
        <div className="text-xs text-slate-700 dark:text-slate-300 flex flex-wrap items-center gap-4">
          <span>
            Email:{' '}
            <a
              href={`mailto:${settings.supportEmail}`}
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              {settings.supportEmail}
            </a>
          </span>
          <span className="font-mono tabular-nums">Tel: {settings.supportPhone}</span>
        </div>
      </div>
    </div>
  );
}

export function NoticesView() {
  const { notices } = useCampus();
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(
    notices[0] ?? null
  );

  const categories = ['All', 'Examination', 'Academic', 'Administration', 'Events', 'Scholarship'];

  const filtered = notices.filter((n) => {
    const catOk = category === 'All' || n.category === category;
    const q = search.trim().toLowerCase();
    const qOk =
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.summary.toLowerCase().includes(q) ||
      n.postedBy.toLowerCase().includes(q);
    return catOk && qOk;
  });

  const activeNotice =
    filtered.find((n) => n.id === selectedNotice?.id) ?? filtered[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                category === cat
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circulars & notices..."
            className={SEARCH_INPUT_CLASS}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No official notices match the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {filtered.map((notice) => {
              const isSelected = activeNotice?.id === notice.id;
              return (
                <button
                  key={notice.id}
                  type="button"
                  onClick={() => setSelectedNotice(notice)}
                  className={`w-full text-left p-4 transition-colors space-y-1.5 ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/35'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span
                      className={
                        notice.priority === 'Urgent'
                          ? 'text-red-700 dark:text-red-400 font-semibold'
                          : notice.priority === 'Important'
                          ? 'text-amber-700 dark:text-amber-400 font-semibold'
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
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {notice.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {notice.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {activeNotice && (
            <article className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span
                  className={
                    activeNotice.priority === 'Urgent'
                      ? 'text-red-700 dark:text-red-400 font-semibold'
                      : activeNotice.priority === 'Important'
                      ? 'text-amber-700 dark:text-amber-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 font-medium'
                  }
                >
                  {activeNotice.priority} Notice
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeNotice.category}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">Published {activeNotice.publishedDate}</span>
              </div>

              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white text-balance">
                {activeNotice.title}
              </h2>

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {activeNotice.body}
              </p>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                Issued by:{' '}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {activeNotice.postedBy}
                </span>
              </div>
            </article>
          )}
        </div>
      )}
    </div>
  );
}

export function ScholarshipsView() {
  const { scholarships } = useCampus();
  const [category, setCategory] = useState('All');

  const categories = ['All', 'Merit', 'Need-Based', 'Research', 'STEM', 'Sports'];
  const filtered = scholarships.filter(
    (s) => category === 'All' || s.category === category
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Scholarships & Financial Grants
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Merit, research, and need-based funding programs available for enrolled students
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                category === cat
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No scholarships available in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    {item.category} · {item.provider}
                  </span>
                  <span
                    className={`font-semibold ${
                      item.status === 'Open'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : item.status === 'Closing Soon'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {item.name}
                </h3>

                <p className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                  {item.amount}
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.eligibility}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Application Deadline</span>
                <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                  {item.deadline}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlacementsView() {
  const { placements, userProfile } = useCampus();
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const statuses = ['All', 'Registration Open', 'Upcoming', 'Completed'];

  const filtered = placements.filter((p) => {
    const statusOk = statusFilter === 'All' || p.status === statusFilter;
    const q = search.trim().toLowerCase();
    const qOk =
      !q ||
      p.company.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      p.eligibleBranches.toLowerCase().includes(q);
    return statusOk && qOk;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto">
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, role, or branch..."
            className={SEARCH_INPUT_CLASS}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Campus Recruitment & Placement Drives
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active corporate recruitment schedule managed by the Training & Placement Office
            </p>
          </div>
          {userProfile && (
            <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
              Your CGPA: <strong className="text-slate-900 dark:text-white">{userProfile.cgpa.toFixed(2)}</strong>
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No placement drives match your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th className="py-3 px-5">Company</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Compensation</th>
                  <th className="py-3 px-4 text-right">Min CGPA</th>
                  <th className="py-3 px-4">Branches</th>
                  <th className="py-3 px-4">Drive Date</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map((drive) => {
                  const cgpaOk = userProfile ? userProfile.cgpa >= drive.minCgpa : null;
                  return (
                    <tr
                      key={drive.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {drive.company}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {drive.location}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                        {drive.role}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                        {drive.packageLpa}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                          {drive.minCgpa.toFixed(1)}
                        </span>
                        {cgpaOk !== null && (
                          <span
                            className={`block text-[11px] font-medium ${
                              cgpaOk
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {cgpaOk ? 'CGPA Eligible' : `Needs ${drive.minCgpa.toFixed(1)}`}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {drive.eligibleBranches}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {drive.driveDate}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            drive.status === 'Registration Open'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : drive.status === 'Upcoming'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {drive.status}
                        </span>
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
