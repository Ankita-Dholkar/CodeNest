import { useEffect, useState, useCallback, useRef } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
  useSandpack,
} from '@codesandbox/sandpack-react';
import {
  Save, Send, CheckCircle2, Loader2, AlertTriangle, Clock, Code2, Timer, XCircle,
} from 'lucide-react';
import api from '../../services/api';

// No need for hardcoded DEFAULT_FILES anymore, Sandpack will auto-load the 
// native boilerplate for whichever framework template (Vue, Vanilla, Vite) is selected!

// ─────────────────────────────────────────────────────────────────────────────
// Persistent countdown timer hook
// secondsRemaining comes from the SERVER (authoritative, avoids clock skew).
// We tick it down locally — on refresh the server recalculates and we resync.
// ─────────────────────────────────────────────────────────────────────────────
function useCountdown(initialSeconds, onExpire) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds ?? null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Sync when server value arrives (e.g. after fetch)
  useEffect(() => {
    if (initialSeconds !== null) setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft]);   // re-runs whenever timeLeft first becomes non-null

  return timeLeft;
}

function formatTime(secs) {
  if (secs === null) return '--:--';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner component — must live inside <SandpackProvider> to call useSandpack()
// ─────────────────────────────────────────────────────────────────────────────
function WorkspaceInner({ roomId, candidateName, secondsRemaining, onSave, onSubmit, status }) {
  const { sandpack } = useSandpack();
  const [saveStatus, setSaveStatus] = useState('idle');   // idle|saving|saved|error
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle|submitting|submitted|error
  const isSubmitted = status === 'submitted' || submitStatus === 'submitted';
  const isExpired = status === 'expired';

  // ── Auto-submit when timer hits zero ────────────────────────────────────
  const handleAutoSubmit = useCallback(async () => {
    if (isSubmitted || isExpired) return;
    try {
      await onSubmit(sandpack.files, true); // true = auto-submit (expired)
    } catch { /* silent — server already marks expired */ }
  }, [sandpack.files, onSubmit, isSubmitted, isExpired]);

  const timeLeft = useCountdown(
    isSubmitted || isExpired ? 0 : secondsRemaining,
    handleAutoSubmit,
  );

  const isUrgent = timeLeft !== null && timeLeft <= 300 && timeLeft > 0; // < 5 min

  // ── Manual save ────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (isSubmitted) return;
    setSaveStatus('saving');
    try {
      await onSave(sandpack.files);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [sandpack.files, onSave, isSubmitted]);

  // ── Manual submit ──────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!window.confirm('Submit your test? You cannot make further changes after submission.')) return;
    setSubmitStatus('submitting');
    try {
      await onSubmit(sandpack.files);
      setSubmitStatus('submitted');
    } catch {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }
  }, [sandpack.files, onSubmit]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-zinc-200 overflow-hidden relative">

      {/* ── NAVBAR ───────────────────────────────────────────────── */}
      <header className="h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-zinc-800 bg-[#18181b]">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-500/20 border border-violet-500/30">
            <Code2 className="w-4 h-4 text-violet-400" />
          </div>
          <span className="font-semibold text-sm text-zinc-100">CodeNest</span>
          <span className="text-zinc-700 mx-1">·</span>
          <span className="text-xs text-zinc-500">Candidate Assessment</span>
          {candidateName && (
            <>
              <span className="text-zinc-700 mx-1">·</span>
              <span className="text-xs font-medium text-violet-400">{candidateName}</span>
            </>
          )}
        </div>

        {/* Timer + Actions */}
        <div className="flex items-center gap-3">
          {/* Persistent Countdown Timer */}
          {!isSubmitted && !isExpired && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-colors ${isUrgent
                ? 'text-red-400 border-red-500/40 bg-red-500/10 animate-pulse'
                : 'text-zinc-300 border-zinc-700 bg-zinc-800/50'
              }`}>
              <Timer className="w-3.5 h-3.5" />
              {formatTime(timeLeft)}
            </div>
          )}

          {isSubmitted ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Test Submitted
            </div>
          ) : isExpired ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" /> Time Expired
            </div>
          ) : (
            <>
              {/* Save Progress */}
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-all disabled:opacity-50"
              >
                {saveStatus === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saveStatus === 'saved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {saveStatus === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                {saveStatus === 'idle' && <Save className="w-3.5 h-3.5" />}
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Failed' : 'Save Progress'}
              </button>

              {/* Submit Test */}
              <button
                onClick={handleSubmit}
                disabled={submitStatus === 'submitting'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-[0_0_12px_rgba(139,92,246,0.3)] disabled:opacity-50"
              >
                {submitStatus === 'submitting'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Send className="w-3.5 h-3.5" />}
                {submitStatus === 'submitting' ? 'Submitting...' : 'Submit Test'}
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── SANDPACK LAYOUT ──────────────────────────────────────── */}
      <SandpackLayout style={{
        flex: 1, minHeight: 0, border: 'none', borderRadius: 0,
        '--sp-layout-height': '100%',
      }}>
        {!isSubmitted && !isExpired && (
          <SandpackFileExplorer style={{ height: '100%', minHeight: '100%' }} />
        )}
        <SandpackCodeEditor
          showTabs showLineNumbers showInlineErrors wrapContent={false}
          style={{ height: '100%', flex: '0 0 45%', minHeight: '100%' }}
          closableTabs
          readOnly={isSubmitted || isExpired}
        />
        <SandpackPreview
          style={{ height: '100%', flex: 1, minHeight: '100%' }}
          showNavigator={false} showRefreshButton showOpenInCodeSandbox={false}
        />
      </SandpackLayout>

      {/* ── SUBMITTED OVERLAY ────────────────────────────────────── */}
      {(isSubmitted || isExpired) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-10 text-center max-w-sm shadow-2xl">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isExpired && !isSubmitted
                ? 'bg-red-500/15 border border-red-500/30'
                : 'bg-emerald-500/15 border border-emerald-500/30'
              }`}>
              {isExpired && !isSubmitted
                ? <Clock className="w-8 h-8 text-red-400" />
                : <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              {isExpired && !isSubmitted ? 'Time Expired' : 'Test Submitted!'}
            </h2>
            <p className="text-sm text-zinc-400">
              {isExpired && !isSubmitted
                ? 'Your time is up. Your last saved code has been recorded.'
                : 'Your code has been saved. The evaluator will review your submission shortly.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Candidate Entry Gate — Required before timer starts
// ─────────────────────────────────────────────────────────────────────────────
function CandidateEntryGate({ onStart, isStarting }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onStart(name.trim(), email.trim());
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#09090b] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="w-full max-w-md bg-[#18181b] border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-500/20 border border-violet-500/30 mb-6 mx-auto">
          <Code2 className="w-6 h-6 text-violet-400" />
        </div>
        <h1 className="text-xl font-bold text-zinc-100 text-center mb-2">Welcome to CodeNest</h1>
        <p className="text-sm text-zinc-400 text-center mb-8">Please enter your details to begin the assessment. Your timer will start immediately after clicking start.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 outline-none focus:border-violet-500 transition-colors"
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email Address</label>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 outline-none focus:border-violet-500 transition-colors"
              placeholder="e.g. jane@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={isStarting || !name.trim() || !email.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          >
            {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isStarting ? 'Starting...' : 'Start Assessment'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main exported component — fetches room data, wraps <SandpackProvider>
// ─────────────────────────────────────────────────────────────────────────────
export default function CandidateWorkspace() {
  const params = new URLSearchParams(window.location.search);
  const initialRoomId = params.get('roomId');
  const assessmentId = params.get('assessmentId');

  const [roomId, setRoomId] = useState(initialRoomId);
  const [files, setFiles] = useState(null);
  const [status, setStatus] = useState(assessmentId ? 'pending' : 'active');
  const [template, setTemplate] = useState('react');
  const [candidateName, setCandidateName] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const [error, setError] = useState(null);
  const [terminatedError, setTerminatedError] = useState(false); // link was closed by recruiter
  const [isStarting, setIsStarting] = useState(false);

  // 2. Fetch room on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) {
      if (assessmentId) return; // Wait for candidate to join
      setError('No roomId or assessmentId in URL. Expected: /workspace?assessmentId=<id>');
      return;
    }

    async function fetchRoom() {
      try {
        const res = await api.get(`/api/rooms/${roomId}`);
        const data = res.data;

        const loadedFiles = data.files && Object.keys(data.files).length > 0
          ? data.files
          : {}; // Empty object lets Sandpack load the native template boilerplate

        setFiles(loadedFiles);
        setCandidateName(data.candidateName || '');
        setStatus(data.status || 'active');
        setTemplate(data.template || 'react');
        // Key: server sends remaining seconds so timer survives refresh
        setSecondsRemaining(data.secondsRemaining);
      } catch (err) {
        console.warn('[CandidateWorkspace] Falling back to default template:', err.message);
        setFiles({});
        setTemplate('react');
        setSecondsRemaining(45 * 60); // 45 min fallback
      }
    }

    fetchRoom();
  }, [roomId]);

  // 3. Start Assessment ─────────────────────────────────────────────────────
  const handleStart = async (name, email) => {
    setIsStarting(true);
    try {
      if (assessmentId) {
        // Multi-use link flow
        try {
          const res = await api.post(`/api/assessments/join/${assessmentId}`, {
            candidateName: name,
            candidateEmail: email,
          });
          const newRoomId = res.data.roomId;
          window.history.replaceState(null, '', `/workspace?roomId=${newRoomId}`);
          setRoomId(newRoomId); // Triggers useEffect to fetch the newly spawned room
        } catch (err) {
          if (err.response?.status === 403) {
            // The recruiter terminated this link
            setTerminatedError(true);
          } else {
            setError(err.response?.data?.message || err.message);
          }
        }
      } else if (roomId) {
        // Legacy single-use room flow (just in case)
        await api.patch(`/api/rooms/start/${roomId}`, {
          candidateName: name,
          candidateEmail: email,
        });
        const roomRes = await api.get(`/api/rooms/${roomId}`);
        setCandidateName(name);
        setStatus('active');
        setSecondsRemaining(roomRes.data.secondsRemaining);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsStarting(false);
    }
  };

  // 4. Save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (currentFiles) => {
    await api.post(`/api/rooms/save/${roomId}`, { files: currentFiles });
  }, [roomId]);

  // 4. Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (currentFiles, isAutoSubmit = false) => {
    await api.post(`/api/rooms/save/${roomId}`, {
      files: currentFiles,
      status: isAutoSubmit ? 'expired' : 'submitted',
    });
    setStatus(isAutoSubmit ? 'expired' : 'submitted');
  }, [roomId]);

  // ── Loading / Error ───────────────────────────────────────────────────────

  // Link was terminated by the recruiter
  if (terminatedError) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#09090b]">
      <div className="w-full max-w-md bg-[#18181b] border border-zinc-800 rounded-2xl p-10 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-600" />
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500/15 border border-red-500/30 mx-auto mb-5">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-zinc-100 mb-2">Assessment Closed</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          This assessment link has been closed by the interviewer.<br />
          No new participants can join at this time.
        </p>
        <p className="text-xs text-zinc-600 mt-6">
          If you believe this is a mistake, please contact the interviewer directly.
        </p>
      </div>
    </div>
  );

  if (error) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#09090b]">
      <div className="text-center max-w-sm">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-zinc-300 text-sm">{error}</p>
      </div>
    </div>
  );

  if (status === 'pending') {
    return <CandidateEntryGate onStart={handleStart} isStarting={isStarting} />;
  }

  if (!files) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#09090b]">
      <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
    </div>
  );

  // 6. Render ───────────────────────────────────────────────────────────────
  return (
    <SandpackProvider
      template={template}
      files={Object.keys(files).length > 0 ? files : undefined}
      theme="dark"
      options={{ recompileMode: 'delayed', recompileDelay: 500 }}
    >
      <style>{`
        .sp-wrapper { --sp-layout-height: 100% !important; height: 100% !important; }
        .sp-layout  { height: 100% !important; border: none !important; border-radius: 0 !important; }
        .sp-preview-container { height: 100% !important; }
        .sp-preview-iframe    { height: 100% !important; }
      `}</style>
      <WorkspaceInner
        roomId={roomId}
        candidateName={candidateName}
        secondsRemaining={secondsRemaining}
        onSave={handleSave}
        onSubmit={handleSubmit}
        status={status}
      />
    </SandpackProvider>
  );
}
