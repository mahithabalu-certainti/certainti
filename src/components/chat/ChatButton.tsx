import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ChatAssistant, { ChatContext, ChatLevel } from './ChatAssistant';

const LEVEL_OPTIONS: { value: ChatLevel; label: string; accent: string }[] = [
  { value: 'project', label: 'Project', accent: 'bg-[#0F6CBD]' },
  { value: 'account', label: 'Account', accent: 'bg-[#107C10]' },
  { value: 'case', label: 'Case', accent: 'bg-[#5C2E91]' },
  { value: 'platform', label: 'Platform', accent: 'bg-[#C23934]' },
];

const MIN_W = 320;
const MAX_W = Math.min(900, window.innerWidth - 32);
const MIN_H = 400;
const MAX_H = window.innerHeight - 100;
const DEFAULT_W = 400;
const DEFAULT_H = 560;
const SNAP_MARGIN = 16; // px from screen edge before snapping to full

type ContextSource = 'project' | 'case' | 'account' | 'platform';

function detectContext(pathname: string, search: string): ChatContext | null {
  const params = new URLSearchParams(search);
  const accountRid = params.get('accountID') || undefined;

  // Project page: /project/details/:projectid
  const projectMatch = pathname.match(/\/project\/details\/([^/?]+)/);
  if (projectMatch) {
    const projectFiscalRid = decodeURIComponent(projectMatch[1]);
    if (projectFiscalRid) return { level: 'project', project_rid: projectFiscalRid, account_rid: accountRid };
  }

  // Case page: /case/details/:caseId
  const caseMatch = pathname.match(/\/case\/details\/([^/?]+)/);
  if (caseMatch) {
    const caseRid = decodeURIComponent(caseMatch[1]);
    if (caseRid) return { level: 'case', case_rid: caseRid, account_rid: accountRid };
  }

  // Account page: /account/details/:accountid
  const accountMatch = pathname.match(/\/account\/details\/([^/?]+)/);
  if (accountMatch) {
    const accountId = decodeURIComponent(accountMatch[1]);
    if (accountId) return { level: 'account', account_rid: accountId };
  }

  return null;
}

function detectContextSource(pathname: string): ContextSource {
  if (/\/project\/details\/[^/?]+/.test(pathname)) return 'project';
  if (/\/case\/details\/[^/?]+/.test(pathname)) return 'case';
  if (/\/account\/details\/[^/?]+/.test(pathname)) return 'account';
  return 'platform';
}

function getAllowedLevels(source: ContextSource): ChatLevel[] {
  switch (source) {
    case 'project':
      return ['project', 'account', 'platform'];
    case 'case':
      return ['case', 'account', 'platform'];
    case 'account':
      return ['account', 'platform'];
    default:
      return ['platform'];
  }
}

export default function ChatButton() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [levelPickerOpen, setLevelPickerOpen] = useState(false);
  const [manualOverride, setManualOverride] = useState<{ context: ChatContext; path: string } | null>(null);

  // Panel dimensions
  const [panelW, setPanelW] = useState(DEFAULT_W);
  const [panelH, setPanelH] = useState(DEFAULT_H);

  // Drag state stored in refs to avoid re-renders during drag
  const dragRef = useRef<{
    type: 'left' | 'top' | 'corner' | null;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  }>({ type: null, startX: 0, startY: 0, startW: DEFAULT_W, startH: DEFAULT_H });

  const autoContext = useMemo(
    () => detectContext(location.pathname, location.search),
    [location.pathname, location.search]
  );
  const contextSource = useMemo(
    () => detectContextSource(location.pathname),
    [location.pathname]
  );
  const allowedLevels = useMemo(
    () => getAllowedLevels(contextSource),
    [contextSource]
  );

  const activeContext: ChatContext = useMemo(() => {
    if (
      manualOverride &&
      manualOverride.path === location.pathname &&
      allowedLevels.includes(manualOverride.context.level)
    ) {
      return manualOverride.context;
    }
    return autoContext ?? { level: 'platform' };
  }, [autoContext, manualOverride, location.pathname, allowedLevels]);

  const selectedLevel = activeContext.level;
  const currentOption = LEVEL_OPTIONS.find(o => o.value === selectedLevel)!;
  const visibleLevelOptions = LEVEL_OPTIONS.filter(option => allowedLevels.includes(option.value));

  function applyLevel(level: ChatLevel) {
    let newContext: ChatContext;

    if (autoContext?.level === level) {
      newContext = autoContext;
    } else if (level === 'account') {
      newContext = autoContext?.account_rid
        ? { level: 'account', account_rid: autoContext.account_rid }
        : { level: 'account' };
    } else {
      newContext = { level };
    }

    setManualOverride({ context: newContext, path: location.pathname });
    setLevelPickerOpen(false);
  }

  // ── Resize drag handlers ──────────────────────────────────────────────────────

  const onMouseMove = useCallback((e: MouseEvent) => {
    const d = dragRef.current;
    if (!d.type) return;

    const dx = d.startX - e.clientX; // dragging left increases width
    const dy = d.startY - e.clientY; // dragging up increases height

    if (d.type === 'left' || d.type === 'corner') {
      const newW = Math.min(MAX_W, Math.max(MIN_W, d.startW + dx));
      // Snap to near-full-width
      setPanelW(newW > MAX_W - SNAP_MARGIN ? MAX_W : newW);
    }
    if (d.type === 'top' || d.type === 'corner') {
      const newH = Math.min(MAX_H, Math.max(MIN_H, d.startH + dy));
      // Snap to near-full-height
      setPanelH(newH > MAX_H - SNAP_MARGIN ? MAX_H : newH);
    }
  }, []);

  const onMouseUp = useCallback(() => {
    dragRef.current.type = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  function startDrag(type: 'left' | 'top' | 'corner', e: React.MouseEvent) {
    e.preventDefault();
    dragRef.current = { type, startX: e.clientX, startY: e.clientY, startW: panelW, startH: panelH };
    document.body.style.cursor = type === 'left' ? 'ew-resize' : type === 'top' ? 'ns-resize' : 'nwse-resize';
    document.body.style.userSelect = 'none';
  }

  // Update MAX bounds on window resize
  useEffect(() => {
    function onResize() {
      setPanelW(w => Math.min(w, window.innerWidth - 32));
      setPanelH(h => Math.min(h, window.innerHeight - 100));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const bottomOffset = 76; // px above the floating button

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className='fixed bottom-6 right-6 z-[2000] flex h-12 w-12 items-center justify-center rounded-full border border-[#D0D7DE] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] transition-all hover:border-[#0F6CBD] hover:bg-[#F8FBFF] active:scale-95'
        title='AI Assistant'
      >
        {open ? (
          <svg className='h-5 w-5 text-[#0F6CBD]' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/>
          </svg>
        ) : (
          <svg className='h-5 w-5 text-[#0F6CBD]' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z'/>
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          className='fixed right-6 z-[1999] flex flex-col overflow-hidden rounded-[12px] border border-[#CBD6E2] bg-[#FDFEFF] shadow-[0_20px_60px_rgba(15,23,42,0.16)]'
          style={{
            width: panelW,
            height: panelH,
            bottom: bottomOffset,
          }}
        >
          {/* ── Top resize handle ── */}
          <div
            className='absolute top-0 left-4 right-4 h-[5px] cursor-ns-resize z-10 group'
            onMouseDown={e => startDrag('top', e)}
          >
            <div className='absolute top-[1px] left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-[#D5DFEA] group-hover:bg-[#0F6CBD] transition-colors' />
          </div>

          {/* ── Left resize handle ── */}
          <div
            className='absolute left-0 top-4 bottom-4 w-[5px] cursor-ew-resize z-10 group'
            onMouseDown={e => startDrag('left', e)}
          >
            <div className='absolute left-[1px] top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-full bg-[#D5DFEA] group-hover:bg-[#0F6CBD] transition-colors' />
          </div>

          {/* ── Top-left corner resize handle ── */}
          <div
            className='absolute top-0 left-0 w-5 h-5 cursor-nwse-resize z-20'
            onMouseDown={e => startDrag('corner', e)}
          >
            {/* Visual corner grip dots */}
            <svg width='14' height='14' viewBox='0 0 14 14' className='absolute top-1 left-1 text-[#D5DFEA] hover:text-[#0F6CBD]' fill='currentColor'>
              <circle cx='2' cy='2' r='1.2'/>
              <circle cx='6' cy='2' r='1.2'/>
              <circle cx='2' cy='6' r='1.2'/>
              <circle cx='10' cy='2' r='1.2'/>
              <circle cx='6' cy='6' r='1.2'/>
              <circle cx='2' cy='10' r='1.2'/>
            </svg>
          </div>

          {/* Panel Header */}
          <div className='mt-[4px] flex flex-shrink-0 items-center justify-between border-b border-[#E5EAF0] bg-[#FBFCFE] px-4 py-3'>
            <div className='flex items-center gap-2'>
              <div className='flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EAF3FF] text-[#0F6CBD]'>
                <svg className='h-4.5 w-4.5' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z'/>
                </svg>
              </div>
              <div className='min-w-0'>
                <span className='block text-[14px] font-semibold text-[#16202A]'>AI Assistant</span>
                <span className='block text-[11px] text-[#5E6B78]'>ThinkR&D 365 Chat</span>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {/* Level Selector */}
              <div className='relative'>
                <button
                  onClick={() => setLevelPickerOpen(p => !p)}
                  className='flex items-center gap-2 rounded-full border border-[#D6DEE8] bg-white px-2.5 py-1 text-[11px] font-medium text-[#253240] hover:bg-[#F8FAFC] transition-colors'
                >
                  <span className={`h-2 w-2 rounded-full ${currentOption.accent}`} />
                  <span>{currentOption.label}</span>
                  <svg className='h-3 w-3 text-[#5E6B78]' viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M7 10l5 5 5-5z'/>
                  </svg>
                </button>
                {levelPickerOpen && (
                  <div className='absolute right-0 top-8 z-10 w-[150px] overflow-hidden rounded-[8px] border border-[#E5EAF0] bg-white shadow-lg'>
                    {visibleLevelOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => applyLevel(opt.value)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F3F6FA] transition-colors ${selectedLevel === opt.value ? 'bg-[#EFF6FC] font-medium text-[#0F6CBD]' : 'text-[#16202A]'}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${opt.accent}`} />
                        <span>{opt.label} Level</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reset size button */}
              <button
                onClick={() => { setPanelW(DEFAULT_W); setPanelH(DEFAULT_H); }}
                className='text-[#8A9BB0] hover:text-[#253240] transition-colors'
                title='Reset size'
              >
                <svg className='h-3.5 w-3.5' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z'/>
                </svg>
              </button>

              <button onClick={() => setOpen(false)} className='text-[#8A9BB0] hover:text-[#253240]'>
                <svg className='h-4 w-4' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/>
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Content — fills remaining space */}
          <div className='min-h-0 flex-1 overflow-hidden'>
            <ChatAssistant context={activeContext} />
          </div>
        </div>
      )}

      {/* Backdrop to close level picker */}
      {levelPickerOpen && (
        <div className='fixed inset-0 z-[1998]' onClick={() => setLevelPickerOpen(false)} />
      )}
    </>
  );
}
