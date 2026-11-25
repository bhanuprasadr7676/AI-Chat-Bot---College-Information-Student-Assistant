import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  Bell,
  Bot,
  Briefcase,
  CalendarDays,
  CheckSquare,
  Clock,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Shield,
  Sun,
  User,
  Users,
  X,
} from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CampusProvider, useCampus } from './context/CampusContext';
import { OverviewSection } from './components/OverviewSection';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import {
  AttendanceView,
  FeesView,
  ProfileView,
} from './components/StudentAcademicViews';
import {
  FacultyView,
  NoticesView,
  PlacementsView,
  ScholarshipsView,
  TimetableView,
  TimingsView,
} from './components/CampusInfoViews';
import { AdminControlView } from './components/AdminControlView';
import { LoginPage } from './components/LoginPage';
import type { NavSection } from './types/campus';

interface NavItem {
  id: NavSection;
  label: string;
  group: 'Workspace' | 'Academics' | 'Campus' | 'Governance';
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', group: 'Workspace', icon: LayoutDashboard },
  { id: 'assistant', label: 'AI Assistant', group: 'Workspace', icon: Bot },
  { id: 'profile', label: 'Student Profile', group: 'Academics', icon: User },
  { id: 'attendance', label: 'Attendance', group: 'Academics', icon: CheckSquare },
  { id: 'timetable', label: 'Timetable', group: 'Academics', icon: CalendarDays },
  { id: 'faculty', label: 'Faculty Details', group: 'Academics', icon: Users },
  { id: 'timings', label: 'College Timings', group: 'Campus', icon: Clock },
  { id: 'notices', label: 'Notices', group: 'Campus', icon: Bell },
  { id: 'fees', label: 'Fees', group: 'Campus', icon: CreditCard },
  { id: 'scholarships', label: 'Scholarships', group: 'Campus', icon: Award },
  { id: 'placements', label: 'Placements', group: 'Campus', icon: Briefcase },
  { id: 'admin', label: 'Admin Console', group: 'Governance', icon: Shield, adminOnly: true },
];

const NAV_GROUPS: Array<NavItem['group']> = ['Workspace', 'Academics', 'Campus', 'Governance'];

function DashboardShell() {
  const {
    theme,
    toggleTheme,
    authUser,
    authReady,
    userProfile,
    isAdmin,
    signOutUser,
    settings,
  } = useCampus();

  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [hasEnteredPortal, setHasEnteredPortal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [queuedAiPrompt, setQueuedAiPrompt] = useState<string>('');

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center p-6">
        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Loading campus portal...
        </div>
      </div>
    );
  }

  if (!hasEnteredPortal) {
    return (
      <LoginPage
        onSuccess={(role) => {
          setHasEnteredPortal(true);
          setActiveSection(role === 'admin' ? 'admin' : 'overview');
        }}
        onContinueAsGuest={() => {
          setHasEnteredPortal(true);
          setActiveSection('overview');
        }}
      />
    );
  }

  const activeNav = NAV_ITEMS.find((n) => n.id === activeSection) ?? NAV_ITEMS[0];
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const handleSelectNav = (id: NavSection) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  const handleAskAI = (question: string) => {
    setQueuedAiPrompt(question);
    if (activeSection !== 'assistant') {
      setDrawerOpen(true);
    }
  };

  const renderSidebarNav = () => (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {NAV_GROUPS.map((group) => {
        const items = visibleNavItems.filter((item) => item.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group} className="space-y-1">
            <p className="px-3 text-xs font-medium text-slate-400 dark:text-slate-500">
              {group}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-900 dark:bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f8fb] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 z-30">
        <div className="h-16 px-5 border-b border-slate-200/90 dark:border-slate-800 flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="font-display font-bold text-sm text-slate-900 dark:text-white tracking-tight whitespace-nowrap truncate">
            AI Chat Bot
          </span>
        </div>

        {renderSidebarNav()}

        <div className="p-4 border-t border-slate-200/90 dark:border-slate-800 space-y-2 shrink-0">
          {authUser && userProfile ? (
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {userProfile.displayName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                {userProfile.rollNumber} · {isAdmin ? 'Admin' : `Sem ${userProfile.semester}`}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                {settings.institutionName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {settings.currentSemester}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full z-10">
            <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                  AI Chat Bot
                </span>
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderSidebarNav()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Glassmorphic Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/85 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 dark:text-slate-400 hidden sm:inline whitespace-nowrap">
                {activeNav.group}
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-display font-semibold text-slate-900 dark:text-white truncate">
                {activeNav.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg transition-colors shrink-0"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Sun className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {activeSection !== 'assistant' && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ask AI Assistant</span>
              </button>
            )}

            {authUser ? (
              <button
                type="button"
                onClick={async () => {
                  await signOutUser();
                  setHasEnteredPortal(false);
                  setActiveSection('overview');
                }}
                title={`Signed in as ${userProfile?.email || authUser.email}`}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <span className="max-w-[120px] truncate hidden sm:inline">
                  {userProfile?.displayName || authUser.displayName || 'Sign Out'}
                </span>
                <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setHasEnteredPortal(false)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Portal Login</span>
              </button>
            )}
          </div>
        </header>

        {/* Active Section Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeSection === 'overview' && (
              <OverviewSection onNavigate={handleSelectNav} onAskAI={handleAskAI} />
            )}
            {activeSection === 'assistant' && (
              <AIAssistantPanel
                mode="full"
                initialQuery={queuedAiPrompt}
                onClearInitialQuery={() => setQueuedAiPrompt('')}
              />
            )}
            {activeSection === 'profile' && <ProfileView />}
            {activeSection === 'attendance' && <AttendanceView />}
            {activeSection === 'faculty' && <FacultyView />}
            {activeSection === 'timetable' && <TimetableView />}
            {activeSection === 'timings' && <TimingsView />}
            {activeSection === 'notices' && <NoticesView />}
            {activeSection === 'fees' && <FeesView />}
            {activeSection === 'scholarships' && <ScholarshipsView />}
            {activeSection === 'placements' && <PlacementsView />}
            {activeSection === 'admin' && <AdminControlView />}
          </motion.div>
        </main>

        <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            {settings.institutionName} · Student Information & AI Assistant Portal
          </span>
          <span>
            Support: {settings.supportEmail} · {settings.supportPhone}
          </span>
        </footer>
      </div>

      {/* Slide-Over Real-Time AI Assistant Drawer */}
      {drawerOpen && activeSection !== 'assistant' && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl"
          >
            <AIAssistantPanel
              mode="drawer"
              initialQuery={queuedAiPrompt}
              onClearInitialQuery={() => setQueuedAiPrompt('')}
              onCloseDrawer={() => setDrawerOpen(false)}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CampusProvider>
        <DashboardShell />
      </CampusProvider>
    </ErrorBoundary>
  );
}
