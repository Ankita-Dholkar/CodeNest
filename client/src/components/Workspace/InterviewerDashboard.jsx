import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Users, Search, ChevronRight, CheckCircle2, Clock, Plus, Copy, LogOut, XCircle, Tag } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

export default function InterviewerDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [duration, setDuration] = useState(45);
  const [label, setLabel] = useState('Frontend Assessment');
  const [template, setTemplate] = useState('react');

  const fetchData = async () => {
      try {
        const [assessRes, roomsRes] = await Promise.all([
          api.get('/api/assessments/interviewer/me'),
          api.get('/api/rooms/interviewer/me')
        ]);
        setAssessments(assessRes.data);
        setRooms(roomsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await api.post('/api/assessments', { 
        label,
        durationMinutes: duration,
        template 
      });
      await fetchData();
    } catch (err) {
      alert('Failed to create assessment: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = (assessmentId) => {
    const link = `${window.location.origin}/workspace?assessmentId=${assessmentId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(assessmentId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTerminate = async (assessmentId, label) => {
    const confirmed = window.confirm(
      `Terminate "${label}"?\n\nThis will:\n• Prevent any new candidates from joining\n• Force-expire all currently active candidate sessions\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;
    try {
      const res = await api.patch(`/api/assessments/${assessmentId}/terminate`);
      alert(res.data.message);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to terminate assessment.');
    }
  };

  const filteredRooms = rooms.filter(room => 
    room.candidateName?.toLowerCase().includes(search.toLowerCase()) || 
    room.candidateEmail?.toLowerCase().includes(search.toLowerCase()) ||
    room.label?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* ── HEADER ────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-violet-500" />
              Welcome, {user?.name || 'Interviewer'}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Manage and review candidate coding assessments.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* New Assessment Label */}
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text"
                placeholder="New Assessment Label..."
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 outline-none focus:border-violet-500 transition-colors w-48"
              />
            </div>
            
            {/* Template Dropdown */}
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 outline-none focus:border-violet-500 transition-colors"
            >
              <option value="react">React</option>
              <option value="vue">Vue</option>
              <option value="vanilla">Vanilla JS</option>
              <option value="vite">Vite</option>
            </select>

            {/* Duration Dropdown */}
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 outline-none focus:border-violet-500 transition-colors"
            >
              <option value={15}>15 mins</option>
              <option value={30}>30 mins</option>
              <option value={45}>45 mins</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-all shadow-[0_0_12px_rgba(139,92,246,0.2)] disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Generate Link
            </button>
            {/* Logout */}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-lg transition-all border border-zinc-700"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* ── ERROR & LOADING ───────────────────────────────── */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        )}
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        {/* ── ASSESSMENTS TABLE ─────────────────────────────────────────── */}
        {!loading && !error && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Your Active Assessment Links</h2>
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900/50 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                    <th className="px-6 py-4 font-medium">Assessment Name</th>
                    <th className="px-6 py-4 font-medium">Stack</th>
                    <th className="px-6 py-4 font-medium">Duration</th>
                    <th className="px-6 py-4 font-medium">Created On</th>
                    <th className="px-6 py-4 font-medium text-right">Master Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {assessments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-zinc-500">
                        No assessments created yet. Generate one above.
                      </td>
                    </tr>
                  ) : (
                    assessments.map((assess) => (
                      <tr key={assess._id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-200">{assess.label}</td>
                        <td className="px-6 py-4 text-sm text-zinc-400 capitalize">{assess.template || 'react'}</td>
                        <td className="px-6 py-4 text-sm text-zinc-400">{assess.durationMinutes} mins</td>
                        <td className="px-6 py-4 text-sm text-zinc-500">{new Date(assess.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          {!assess.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 text-red-400 text-xs font-semibold rounded-md border border-red-500/20">
                              <XCircle className="w-3.5 h-3.5" /> Terminated
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleCopyLink(assess._id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 text-xs font-semibold rounded-md transition-all border border-violet-500/20"
                              >
                                {copiedId === assess._id ? (
                                  <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied</>
                                ) : (
                                  <><Copy className="w-3.5 h-3.5" /> Copy Link</>
                                )}
                              </button>
                              <button
                                onClick={() => handleTerminate(assess._id, assess.label)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-semibold rounded-md transition-all border border-red-500/20"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Terminate
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CANDIDATE SUBMISSIONS TABLE ─────────────────────────────────────────── */}
        {!loading && !error && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-100">Candidate Submissions</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text"
                  placeholder="Filter candidates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 outline-none focus:border-violet-500 transition-colors w-64"
                />
              </div>
            </div>
            
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900/50 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                    <th className="px-6 py-4 font-medium">Candidate</th>
                    <th className="px-6 py-4 font-medium">Assessment</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Started At</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredRooms.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-zinc-500">
                        No candidate submissions yet.
                      </td>
                    </tr>
                  ) : (
                    filteredRooms.map((room) => (
                      <tr key={room._id} className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-200">{room.candidateName || 'Unnamed Candidate'}</div>
                          <div className="text-xs text-zinc-500">{room.candidateEmail || 'No email provided'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-400">
                          {room.label || 'Frontend Test'}
                        </td>
                        <td className="px-6 py-4">
                        {room.status === 'submitted' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                          </span>
                        ) : room.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> In Progress
                          </span>
                        ) : room.status === 'expired' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <Clock className="w-3.5 h-3.5" /> Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        {room.startedAt ? new Date(room.startedAt).toLocaleDateString() : 'Not started'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(room.status === 'submitted' || room.status === 'expired') ? (
                          <Link
                            to={`/review/${room._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-md transition-all shadow-[0_0_12px_rgba(139,92,246,0.2)] hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                          >
                            Review Code <ChevronRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-800 text-zinc-500 text-xs font-semibold rounded-md cursor-not-allowed border border-zinc-700"
                          >
                            In Progress...
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
