import React, { useState, useRef, useEffect } from 'react';
import { chatServiceApi } from '../../api/api';

export type ChatLevel = 'project' | 'account' | 'case' | 'platform';

export interface ChatContext {
  level: ChatLevel;
  project_rid?: string;
  project_name?: string;
  account_rid?: string;
  account_name?: string;
  case_rid?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

interface ChatAssistantProps {
  context: ChatContext;
}

const LEVEL_LABELS: Record<ChatLevel, string> = {
  project: 'Project',
  account: 'Account',
  case: 'Case',
  platform: 'Platform',
};

const PLACEHOLDERS: Record<ChatLevel, string> = {
  project: 'Ask about this project: costs, resources, tasks, interactions, R&D status...',
  account: 'Ask about this account: projects, resources, cases, contacts, attachments, meetings...',
  case: 'Ask about this case: projects, QRE, credits, submission dates...',
  platform: 'Ask a platform-wide question: total projects, top accounts...',
};

const SUGGESTIONS: Record<ChatLevel, string[]> = {
  project: [
    'Give me a full project overview',
    'Who are the resources working on this project?',
    'Who is the point of contact for this project?',
    'What is the R&D assessment status?',
    'Show fiscal year R&D credit breakdown',
    'Show all interactions for this project',
    'What are the recent meetings?',
    'What is the total QRE and R&D credits?',
    'List all tasks in this project',
  ],
  account: [
    'Give me an account summary',
    'How many projects does this account have?',
    'List all active projects',
    'List resources for this account',
    'Show cases for this account',
    'Who are the key contacts for this account?',
    'Show attachments for this account',
    'How many R&D qualified projects?',
  ],
  case: [
    'Summarise this case',
    'List projects in this case',
    'Who is on the case team?',
    'List resources working across this case',
    'Show case milestones and timeline',
    'What is the total QRE for this case?',
    'What is the completion percentage?',
  ],
  platform: [
    'Platform summary',
    'How many total projects are there?',
    'Show top accounts by projects',
    'How many R&D qualified projects platform-wide?',
  ],
};

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className='space-y-1'>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className='font-semibold text-[13px] mt-2'>{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className='font-semibold text-[14px] mt-2'>{line.slice(3)}</h2>;
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <div key={i} className='flex gap-1.5'><span className='text-[#5E6B78] mt-0.5'>•</span><span>{renderInline(line.slice(2))}</span></div>;
        }
        if (line.trim() === '') return <div key={i} className='h-1' />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // First handle markdown links [text](url)
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before link
    if (match.index > lastIndex) {
      result.push(renderBoldText(text.substring(lastIndex, match.index)));
    }
    // Add link
    result.push(
      <a
        key={match.index}
        href={match[2]}
        target='_blank'
        rel='noopener noreferrer'
        className='text-[#0F6CBD] underline hover:text-[#115EA3]'
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(renderBoldText(text.substring(lastIndex)));
  }

  return result;
}

function renderBoldText(text: string): React.ReactNode {
  const boldRegex = /\*\*([^*]+)\*\*/g;
  const parts = text.split(boldRegex);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i}>{part}</strong>;
    }
    return part;
  });
}

export default function ChatAssistant({ context }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message when context changes
  useEffect(() => {
    const contextLabel = context.project_name || context.account_name || '';
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm **ORIN**, your **${LEVEL_LABELS[context.level]}-level** AI assistant${contextLabel ? ` for **${contextLabel}**` : ''}.\n\n${
  context.level === 'project'
    ? 'I can answer questions about:\n- **Resources** — who is working on this project, hours, cost, R&D %\n- **Point of contact** — project and technical POC details\n- **Person lookup** — "Is [name] working on this project?"\n- **R&D assessment** — qualification status, QRE, credits per fiscal year\n- **Interactions** — emails sent, recipients, response status\n- **Meetings** — scheduled meetings, participants, minutes\n- **Tasks** — task list, types, hours, cost\n- **Fiscal breakdown** — year-by-year costs and efforts'
    : context.level === 'account'
    ? 'I can answer questions about this account\'s projects, financial summary, resources, cases, key contacts, meetings, interactions, attachments, and notes.'
    : context.level === 'case'
    ? 'I can answer questions about this R&D case including summary, projects, resources, tasks, team members, key contacts, milestones, interactions, workflow tasks, and history.'
    : 'I can answer platform-wide questions about accounts, projects, and R&D statistics.'
}\n\nWhat would you like to know?`,
        timestamp: new Date(),
      },
    ]);
  }, [context.level, context.project_rid, context.account_rid, context.case_rid, context.project_name, context.account_name]);

  async function sendMessage(text?: string) {
    const msg = (text || input).trim();
    if (!msg || sending) return;

    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date() };
    const loadingMsg: Message = { id: 'loading', role: 'assistant', content: '', timestamp: new Date(), loading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setSending(true);

    try {
      const res = await chatServiceApi.post('/api/chat/message', {
        message: msg,
        context,
      });
      const reply = res.data?.data?.response || 'Sorry, I could not process that.';
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'loading'),
        { id: Date.now().toString(), role: 'assistant', content: reply, timestamp: new Date() },
      ]);
    } catch {
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'loading'),
        { id: Date.now().toString(), role: 'assistant', content: 'Something went wrong. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className='flex h-full flex-col bg-[#FDFEFF]'>
      {/* Header */}
      <div className='flex flex-shrink-0 items-center gap-3 border-b border-[#E5EAF0] bg-[#FFFFFF] px-4 py-3'>
        <span className='flex items-center gap-2'>
          <div className='flex h-8 w-8 items-center justify-center rounded-full border border-[#CFE3FA] bg-[#EAF3FF]'>
            <svg className='h-4 w-4 text-[#0F6CBD]' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'/>
            </svg>
          </div>
          <div className='flex flex-col'>
            <span className='text-[13px] font-semibold text-[#0F6CBD]'>ORIN</span>
            <span className='text-[10px] text-[#8A9BB0]'>{LEVEL_LABELS[context.level]} Level</span>
          </div>
        </span>
        {(context.project_name || context.account_name) && (
          <span className='truncate text-[12px] text-[#5E6B78]'>
            {context.project_name || context.account_name}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className='min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F7F9FC] p-4'>
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className='mr-3 flex flex-col items-center gap-1'>
                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#CFE3FA] bg-[#EAF3FF]'>
                  <svg className='h-4 w-4 text-[#0F6CBD]' viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z'/>
                  </svg>
                </div>
                <span className='text-[10px] font-semibold text-[#0F6CBD]'>ORIN</span>
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-[10px] px-3.5 py-2.5 text-[13px] leading-[1.5] ${
                msg.role === 'user'
                  ? 'rounded-tr-[2px] border border-[#0F6CBD] bg-[#0F6CBD] text-white'
                  : 'rounded-tl-[2px] border border-[#E5EAF0] bg-white text-[#16202A] shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
              }`}
            >
              {msg.loading ? (
                <div className='flex items-center gap-1'>
                  <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#5E6B78]' style={{ animationDelay: '0ms' }} />
                  <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#5E6B78]' style={{ animationDelay: '150ms' }} />
                  <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#5E6B78]' style={{ animationDelay: '300ms' }} />
                </div>
              ) : msg.role === 'assistant' ? (
                <MarkdownText text={msg.content} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className='flex flex-shrink-0 flex-wrap gap-1.5 border-t border-[#E5EAF0] bg-white px-4 py-2'>
          {SUGGESTIONS[context.level].map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className='rounded-full border border-[#D6DEE8] bg-[#FBFCFE] px-2.5 py-1 text-[11px] text-[#344054] transition-colors hover:border-[#B7D6F6] hover:bg-[#EFF6FC] hover:text-[#0F6CBD]'
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className='flex flex-shrink-0 items-end gap-2 border-t border-[#E5EAF0] bg-white p-3'>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[context.level]}
          rows={1}
          spellCheck={false}
          autoComplete='off'
          disabled={sending}
          className='min-h-[36px] flex-1 resize-none rounded-[8px] border border-[#CBD6E2] bg-[#FBFCFE] px-3 py-2 text-[13px] text-[#16202A] placeholder:text-[#8A9BB0] focus:border-[#0F6CBD] focus:bg-white focus:outline-none disabled:opacity-50'
          style={{ maxHeight: '100px' }}
          onInput={e => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 100) + 'px';
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || sending}
          className='flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#0F6CBD] bg-[#0F6CBD] text-white transition-colors hover:bg-[#115EA3] disabled:cursor-not-allowed disabled:border-[#CBD6E2] disabled:bg-[#E5EAF0] disabled:text-[#8A9BB0]'
        >
          <svg className='h-4 w-4' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z'/>
          </svg>
        </button>
      </div>
    </div>
  );
}
