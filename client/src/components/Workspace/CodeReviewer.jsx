import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
} from '@codesandbox/sandpack-react';
import { Loader2, AlertTriangle, ArrowLeft, Code2, CheckCircle2, Clock } from 'lucide-react';
import api from '../../services/api';

export default function CodeReviewer() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await api.get(`/api/rooms/${roomId}`);
        setRoom(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    }

    if (roomId) {
      fetchRoom();
    } else {
      setError('No roomId provided');
      setLoading(false);
    }
  }, [roomId]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#09090b] text-zinc-200">
        <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load submission</h2>
        <p className="text-zinc-500 mb-6">{error || 'Room not found'}</p>
        <Link 
          to="/dashboard" 
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const template = room.template || 'react';
  const files = room.files && Object.keys(room.files).length > 0 ? room.files : undefined;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-zinc-200 overflow-hidden">
      
      {/* ── HEADER ────────────────────────────────────────── */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-zinc-800 bg-[#18181b]">
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-px h-5 bg-zinc-800"></div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/20 border border-violet-500/30">
              <Code2 className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                {room.candidateName || 'Unnamed Candidate'}
                {room.status === 'submitted' ? (
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" /> Submitted
                  </span>
                ) : room.status === 'expired' ? (
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                    <Clock className="w-3 h-3" /> Expired
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                    In Progress
                  </span>
                )}
              </h1>
              <p className="text-xs text-zinc-500">{room.candidateEmail || 'No email'} · {room.label || 'Assessment'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-800">
            Read-Only Review Mode
          </div>
        </div>
      </header>

      {/* ── SANDPACK ──────────────────────────────────────── */}
      <SandpackProvider
        template={template}
        files={files}
        theme="dark"
        options={{ recompileMode: 'delayed', recompileDelay: 500 }}
      >
        <style>{`
          .sp-wrapper { --sp-layout-height: 100% !important; height: 100% !important; }
          .sp-layout  { height: 100% !important; border: none !important; border-radius: 0 !important; }
          .sp-preview-container { height: 100% !important; }
          .sp-preview-iframe    { height: 100% !important; }
        `}</style>
        <SandpackLayout style={{
          flex: 1, minHeight: 0, border: 'none', borderRadius: 0,
          '--sp-layout-height': '100%',
        }}>
          {/* File Explorer to view all created files */}
          <SandpackFileExplorer style={{ height: '100%', minHeight: '100%' }} />
          {/* Editor is strictly readOnly */}
          <SandpackCodeEditor
            showTabs
            showLineNumbers
            readOnly={true}
            wrapContent={false}
            style={{ height: '100%', flex: '0 0 45%', minHeight: '100%' }}
          />
          {/* Live Preview so interviewer can test functionality */}
          <SandpackPreview
            style={{ height: '100%', flex: 1, minHeight: '100%' }}
            showNavigator={false}
            showRefreshButton
            showOpenInCodeSandbox={false}
          />
        </SandpackLayout>
      </SandpackProvider>

    </div>
  );
}
