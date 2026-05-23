import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CandidateWorkspace from './components/Workspace/CandidateWorkspace';
import InterviewerDashboard from './components/Workspace/InterviewerDashboard';
import CodeReviewer from './components/Workspace/CodeReviewer';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';
import Navbar from './components/Layout/Navbar';
import ResizablePanels from './components/Layout/ResizablePanels';
import { useSocket } from './hooks/useSocket';
import { useProject } from './hooks/useProject';
import { useProjectStore } from './store/useProjectStore';
import { useFileStore } from './store/useFileStore';
import { Code2, Loader2, FolderOpen, Plus } from 'lucide-react';
import { projectService } from './services/projectService';

// ── Project Picker / Creator splash screen ────────────────────────────────
function ProjectGate({ onProjectReady }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const { createProject, loadProject } = useProject();

  useEffect(() => {
    projectService.getAll()
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const project = await createProject(newName.trim(), '', 'react');
    if (project) onProjectReady(project._id);
    setCreating(false);
  };

  const handleOpen = async (id) => {
    setLoading(true);
    await loadProject(id);
    onProjectReady(id);
  };

  return (
    <div
      className="h-screen w-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)' }}
          >
            <Code2 className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-100">CodeNest</h1>
            <p className="text-xs" style={{ color: '#52525b' }}>Browser-based sandbox</p>
          </div>
        </div>

        {/* Create new project */}
        <form onSubmit={handleCreate} className="mb-6">
          <label className="block text-xs font-medium mb-2" style={{ color: '#71717a' }}>
            New Project
          </label>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="my-react-app"
              className="flex-1 px-3 py-2 text-sm rounded-lg outline-none font-mono"
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                color: '#e4e4e7',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              {creating
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Plus className="w-4 h-4" />}
              Create
            </button>
          </div>
        </form>

        {/* Existing projects */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#52525b' }} />
          </div>
        ) : projects.length > 0 ? (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: '#71717a' }}>
              Recent Projects
            </p>
            <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
              {projects.map((p) => (
                <button
                  key={p._id}
                  onClick={() => handleOpen(p._id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group"
                  style={{ border: '1px solid var(--color-border)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3f3f46'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                  <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 truncate">{p.name}</div>
                    <div className="text-[10px]" style={{ color: '#52525b' }}>
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-center py-4" style={{ color: '#3f3f46' }}>
            No projects yet — create one above
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main IDE shell ────────────────────────────────────────────────────────
function IDE() {
  const { project } = useProjectStore();
  const projectId = project?._id || null;
  const { emitFileChange } = useSocket(projectId);

  const handleFileChange = useCallback(
    (path, content) => {
      if (projectId) emitFileChange(projectId, path, content);
    },
    [projectId, emitFileChange]
  );

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden font-sans"
      style={{ backgroundColor: 'var(--color-background)', color: '#d4d4d8' }}
    >
      <Navbar />
      <ResizablePanels onFileChange={handleFileChange} />
    </div>
  );
}

// ── Main Recruiter IDE & Gate ──────────────────────────────────────────────
function MainApp() {
  const { project } = useProjectStore();
  const { loadProject } = useProject();
  const [projectReady, setProjectReady] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Auto-restore project session from localStorage on reload
  useEffect(() => {
    const savedId = localStorage.getItem('codenest_projectId');
    if (savedId) {
      loadProject(savedId)
        .then((proj) => {
          if (proj) setProjectReady(true);
          setInitializing(false);
        })
        .catch(() => {
          localStorage.removeItem('codenest_projectId');
          setInitializing(false);
        });
    } else {
      setInitializing(false);
    }
  }, [loadProject]);

  // Keep localStorage in sync when project changes
  useEffect(() => {
    if (project?._id) {
      localStorage.setItem('codenest_projectId', project._id);
      setProjectReady(true);
    }
  }, [project]);

  if (initializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    );
  }

  if (!projectReady) {
    return <ProjectGate onProjectReady={() => setProjectReady(true)} />;
  }

  return <IDE />;
}

// ── Root Router ──────────────────────────────────────────────────────────
export default function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Recruiter IDE fallback */}
        <Route path="/" element={<MainApp />} />
        
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Candidate View (No auth required) */}
        <Route path="/workspace" element={<CandidateWorkspace />} />
        
        {/* Protected Interviewer Views */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <InterviewerDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/review/:roomId" element={
          <ProtectedRoute>
            <CodeReviewer />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
