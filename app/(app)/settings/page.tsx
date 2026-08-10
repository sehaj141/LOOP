"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Shield,
  UserPlus,
  Users,
  Building,
  Key,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  User,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState<"ADMIN" | "ANALYST" | "VIEWER">("ANALYST");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      });

    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspace/members");
      const data = await res.json();
      setMembers(data.members || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/workspace/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");

      setName("");
      setEmail("");
      setPassword("password123");
      setModalOpen(false);
      fetchMembers();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add team member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "ADMIN" | "ANALYST" | "VIEWER") => {
    if (user?.role !== "ADMIN") {
      alert("Forbidden: Only Admins can modify member roles.");
      return;
    }

    try {
      const res = await fetch("/api/workspace/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Role update failed");

      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
      );
    } catch (err: any) {
      alert(err.message || "Role change failed");
    }
  };

  const roleBadgeColors: Record<string, string> = {
    ADMIN: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    ANALYST: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    VIEWER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Settings & Role-Based Access Control
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage workspace team members, assign permissions (ADMIN, ANALYST, VIEWER), and enforce tenant security
        </p>
      </div>

      {/* Workspace Info Card */}
      <div className="p-6 glass-card rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tenant Workspace</div>
            <h2 className="text-xl font-extrabold text-white">{user?.workspaceName || "Acme Corp"}</h2>
            <div className="text-xs text-slate-400 mt-0.5">Workspace ID: <code className="text-indigo-400">{user?.workspaceId}</code></div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Your Active Role:</span>
            <span className="font-extrabold text-white">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Role Matrix Explanation Banner */}
      <div className="p-5 glass-card rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Key className="w-4 h-4 text-purple-400" /> Role Permission Hierarchy
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-1">
            <div className="font-bold text-indigo-400 uppercase">ADMIN ROLE</div>
            <p className="text-slate-400 leading-relaxed">
              Full workspace control. Manage team members, edit roles, ingest feedback, reclassify AI, and generate reports.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1">
            <div className="font-bold text-purple-400 uppercase">ANALYST ROLE</div>
            <p className="text-slate-400 leading-relaxed">
              Operational access. Ingest single/CSV feedback, simulate channels, reclassify AI items, and generate VoC reports. Cannot manage team roles.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
            <div className="font-bold text-emerald-400 uppercase">VIEWER ROLE</div>
            <p className="text-slate-400 leading-relaxed">
              Read-only stakeholder access. View dashboards, browse inbox, ask questions in Ask LOOP, and view reports. Mutation actions return HTTP 403.
            </p>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Team Members ({members.length})
            </h3>
            <p className="text-xs text-slate-400">Users authorized to access this workspace</p>
          </div>

          {user?.role === "ADMIN" && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Invite Teammate
            </button>
          )}
        </div>

        {/* Member Table */}
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading members...</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role Permission</th>
                  <th className="p-4">Joined Date</th>
                  {user?.role === "ADMIN" && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-indigo-400 font-bold flex items-center justify-center text-xs">
                        {member.name.charAt(0)}
                      </div>
                      <span>{member.name}</span>
                    </td>
                    <td className="p-4 text-slate-400">{member.email}</td>
                    <td className="p-4">
                      {user?.role === "ADMIN" ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.id, e.target.value as any)
                          }
                          className={`px-3 py-1 rounded-xl border text-xs font-bold outline-none ${
                            roleBadgeColors[member.role]
                          }`}
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="ANALYST">ANALYST</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded-full border font-bold text-[10px] uppercase ${
                            roleBadgeColors[member.role]
                          }`}
                        >
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    {user?.role === "ADMIN" && (
                      <td className="p-4 text-right">
                        <span className="text-[11px] text-slate-500 font-mono">Managed</span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 border border-slate-800 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" /> Invite Team Member
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dave Engineer"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dave@acme.com"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Temporary Password
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password123"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Assigned Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none"
                >
                  <option value="ANALYST">ANALYST (Feedback & AI Management)</option>
                  <option value="VIEWER">VIEWER (Read-Only Dashboards & Reports)</option>
                  <option value="ADMIN">ADMIN (Full Workspace Control)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Team Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
