import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  ExternalLink,
  RotateCcw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import type { ChatMessage } from '../types/campus';

const SUGGESTED_PROMPTS = [
  'What classes are scheduled on Monday?',
  'When is the Central Library open on weekends?',
  'Which scholarships are currently open?',
  'What is the minimum attendance requirement?',
  'What is the weather in Tokyo right now?',
];

interface AIAssistantPanelProps {
  mode: 'full' | 'drawer';
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  onCloseDrawer?: () => void;
}

function renderInlineSegments(text: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={idx}
          className="font-mono text-[12px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700/70 text-slate-900 dark:text-slate-100"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

function FormattedAssistantText({ content }: { content: string }) {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`${keyPrefix}-list`} className="list-disc pl-5 space-y-1 my-1.5">
        {listItems.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {renderInlineSegments(item)}
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((rawLine, idx) => {
    const trimmed = rawLine.trim();
    const bulletMatch = trimmed.match(/^(?:[-*•]|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
      return;
    }

    flushList(`line-${idx}`);

    if (!trimmed) {
      blocks.push(<div key={`gap-${idx}`} className="h-2" />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      blocks.push(
        <p key={`h-${idx}`} className="font-semibold text-slate-900 dark:text-white pt-1">
          {renderInlineSegments(trimmed.slice(4))}
        </p>
      );
      return;
    }

    blocks.push(
      <p key={`p-${idx}`} className="leading-relaxed">
        {renderInlineSegments(trimmed)}
      </p>
    );
  });

  flushList('end');
  return <div className="space-y-1 break-words">{blocks}</div>;
}

export function AIAssistantPanel({
  mode,
  initialQuery,
  onClearInitialQuery,
  onCloseDrawer,
}: AIAssistantPanelProps) {
  const {
    userProfile,
    attendance,
    fees,
    faculty,
    timetable,
    timings,
    notices,
    scholarships,
    placements,
    settings,
  } = useCampus();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      scope: 'academic',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: `Hello${userProfile ? `, ${userProfile.displayName.split(' ')[0]}` : ''}. I am the ${settings.institutionName} real-time AI Student Assistant. Ask me about your class timetable, attendance, fees, faculty office hours, college timings, notices, scholarships, or placements. For topics outside college and academics, I will direct you to Google Search.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastSubmittedInitial = useRef<string>('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isStreaming) return;

    const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: nowLabel,
    };

    const assistantId = `ast-${Date.now() + 1}`;
    const placeholderMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: nowLabel,
      isStreaming: true,
    };

    const priorHistory = messages
      .filter((m) => m.id !== 'welcome-msg' && m.content)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg, placeholderMsg]);
    setInput('');
    setIsStreaming(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: priorHistory,
          systemSettings: settings,
          studentContext: userProfile
            ? {
                name: userProfile.displayName,
                rollNumber: userProfile.rollNumber,
                department: userProfile.department,
                semester: userProfile.semester,
                cgpa: userProfile.cgpa,
                mentorName: userProfile.mentorName,
                attendance: attendance.map((a) => ({
                  subjectCode: a.subjectCode,
                  subjectName: a.subjectName,
                  attended: a.attendedClasses,
                  total: a.totalClasses,
                  percent:
                    a.totalClasses > 0
                      ? Math.round((a.attendedClasses / a.totalClasses) * 100)
                      : 0,
                })),
                fees: fees.map((f) => ({
                  title: f.title,
                  amount: f.amount,
                  paidAmount: f.paidAmount,
                  status: f.status,
                  dueDate: f.dueDate,
                })),
              }
            : null,
          campusContext: {
            faculty: faculty.map((f) => ({
              name: f.name,
              designation: f.designation,
              department: f.department,
              officeRoom: f.officeRoom,
              officeHours: f.officeHours,
              officeEmail: f.officeEmail,
            })),
            timetable: timetable.map((t) => ({
              day: t.day,
              time: `${t.startTime}-${t.endTime}`,
              courseCode: t.courseCode,
              courseTitle: t.courseTitle,
              facultyName: t.facultyName,
              room: t.room,
              semester: t.semester,
            })),
            timings: timings.map((t) => ({
              facility: t.facility,
              weekdaysHours: t.weekdaysHours,
              weekendHours: t.weekendHours,
              location: t.location,
              notes: t.notes,
            })),
            notices: notices.map((n) => ({
              title: n.title,
              category: n.category,
              priority: n.priority,
              publishedDate: n.publishedDate,
              summary: n.summary,
            })),
            scholarships: scholarships.map((s) => ({
              name: s.name,
              amount: s.amount,
              eligibility: s.eligibility,
              deadline: s.deadline,
              status: s.status,
            })),
            placements: placements.map((p) => ({
              company: p.company,
              role: p.role,
              packageLpa: p.packageLpa,
              minCgpa: p.minCgpa,
              driveDate: p.driveDate,
              status: p.status,
            })),
          },
        }),
      });

      if (!response.ok) {
        const errPayload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errPayload.error || `Request failed (${response.status})`);
      }

      if (!response.body) {
        throw new Error('No response stream received from assistant.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const block of lines) {
          const dataLine = block
            .split('\n')
            .find((l) => l.startsWith('data: '));
          if (!dataLine) continue;

          try {
            const evt = JSON.parse(dataLine.slice(6)) as {
              type: 'meta' | 'chunk' | 'done' | 'error';
              scope?: 'academic' | 'general';
              searchQuery?: string;
              searchUrl?: string;
              text?: string;
              error?: string;
            };

            if (evt.type === 'meta') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        scope: evt.scope,
                        searchQuery: evt.searchQuery,
                        searchUrl: evt.searchUrl,
                      }
                    : m
                )
              );
            } else if (evt.type === 'chunk' && evt.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + evt.text }
                    : m
                )
              );
            } else if (evt.type === 'error') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        isStreaming: false,
                        error: evt.error || 'Assistant response failed.',
                      }
                    : m
                )
              );
            } else if (evt.type === 'done') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, isStreaming: false } : m
                )
              );
            }
          } catch {
            // ignore partial JSON parse error
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to reach AI Assistant.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, isStreaming: false, error: errorMsg }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    if (initialQuery && initialQuery.trim() && initialQuery !== lastSubmittedInitial.current) {
      lastSubmittedInitial.current = initialQuery;
      void sendMessage(initialQuery);
      onClearInitialQuery?.();
    }
  }, [initialQuery]);

  const clearConversation = () => {
    setMessages((prev) => prev.slice(0, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const containerClasses =
    mode === 'full'
      ? 'flex flex-col h-[calc(100vh-9rem)] min-h-[560px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden'
      : 'flex flex-col h-full bg-white dark:bg-slate-900';

  return (
    <div className={containerClasses}>
      {/* Assistant Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90">
        <div className="min-w-0 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/70 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white truncate">
              Real-Time Student AI Assistant
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {settings.aiAssistantEnabled
                ? settings.strictAcademicMode
                  ? 'Academic & campus queries answered live · General queries redirect to Google Search'
                  : 'General & campus assistance active'
                : 'Disabled by administrator'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clearConversation}
            title="Clear chat history"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear</span>
          </button>
          {mode === 'drawer' && onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              aria-label="Close AI Assistant drawer"
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-white dark:bg-slate-950/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>{msg.role === 'user' ? 'You' : 'Campus Assistant'}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{msg.timestamp}</span>
              {msg.scope === 'general' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Google Search Redirect
                  </span>
                </>
              )}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              {msg.error ? (
                <div className="space-y-2.5">
                  <div className="text-red-700 dark:text-red-400 text-sm leading-relaxed">
                    {msg.error}
                  </div>
                  {(() => {
                    const msgIndex = messages.findIndex((m) => m.id === msg.id);
                    const prevUser = [...messages.slice(0, msgIndex)]
                      .reverse()
                      .find((m) => m.role === 'user');
                    if (!prevUser) return null;
                    return (
                      <button
                        type="button"
                        disabled={isStreaming}
                        onClick={() => void sendMessage(prevUser.content)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Retry Question</span>
                      </button>
                    );
                  })()}
                </div>
              ) : msg.role === 'assistant' ? (
                msg.content ? (
                  <FormattedAssistantText content={msg.content} />
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">
                    {msg.isStreaming ? 'Checking campus records...' : ''}
                  </span>
                )
              ) : (
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              )}

              {msg.scope === 'general' && msg.searchUrl && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      Google Search Redirect
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Query: {msg.searchQuery}
                    </p>
                  </div>
                  <a
                    href={msg.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Search on Google</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="px-5 py-2.5 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 overflow-x-auto">
        <div className="flex items-center gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isStreaming || !settings.aiAssistantEnabled}
              onClick={() => void sendMessage(prompt)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <span>{prompt}</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!settings.aiAssistantEnabled || isStreaming}
          placeholder={
            settings.aiAssistantEnabled
              ? 'Ask about timetable, library hours, fees, scholarships, or campus resources...'
              : 'AI Assistant is currently disabled in System Settings'
          }
          className="flex-1 min-w-0 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming || !settings.aiAssistantEnabled}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span>{isStreaming ? 'Replying...' : 'Ask'}</span>
        </button>
      </form>
    </div>
  );
}
