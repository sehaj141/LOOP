"use client";

import { useEffect, useState } from "react";
import {
  Inbox,
  Search,
  Filter,
  Plus,
  Upload,
  Radio,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  RefreshCw,
  Trash2,
  FileSpreadsheet,
  X,
} from "lucide-react";
import Papa from "papaparse";

export default function InboxPage() {
  const [items, setItems] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("VIEWER");

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [sentimentFilter, setSentimentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [themeFilter, setThemeFilter] = useState("ALL");

  // Modal states
  const [singleModalOpen, setSingleModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [reclassifyingId, setReclassifyingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Single Entry Form state
  const [singleContent, setSingleContent] = useState("");
  const [singleChannel, setSingleChannel] = useState("Support Ticket");
  const [singleCustomer, setSingleCustomer] = useState("");
  const [submittingSingle, setSubmittingSingle] = useState(false);

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvSummary, setCsvSummary] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUserRole(data.user.role);
      });

    fetchThemes();
  }, []);

  useEffect(() => {
    fetchInboxData();
  }, [page, search, channelFilter, sentimentFilter, statusFilter, themeFilter]);

  const fetchThemes = async () => {
    try {
      const res = await fetch("/api/themes");
      const data = await res.json();
      setThemes(data.themes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInboxData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        search,
        channel: channelFilter,
        sentiment: sentimentFilter,
        status: statusFilter,
        themeId: themeFilter,
      });

      const res = await fetch(`/api/feedback?${query.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load feedback items");
      }

      setItems(data.items || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || "Error loading inbox data");
    } finally {
      setLoading(false);
    }
  };

  // Inline Status Change (NEW -> REVIEWED -> ACTIONED)
  const handleStatusChange = async (id: string, newStatus: string) => {
    if (userRole === "VIEWER") {
      alert("Forbidden: Viewers are read-only.");
      return;
    }

    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err: any) {
      alert(err.message || "Update failed");
    }
  };

  // Manual Re-classify AI trigger
  const handleReclassify = async (id: string) => {
    if (userRole === "VIEWER") {
      alert("Forbidden: Viewers cannot reclassify.");
      return;
    }

    setReclassifyingId(id);
    try {
      const res = await fetch("/api/feedback/reclassify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reclassification failed");

      setItems((prev) =>
        prev.map((item) => (item.id === id ? data.feedback : item))
      );
    } catch (err: any) {
      alert(err.message || "Reclassification failed");
    } finally {
      setReclassifyingId(null);
    }
  };

  // Delete Feedback Item
  const handleDelete = async (id: string) => {
    if (userRole === "VIEWER") {
      alert("Forbidden: Viewers cannot delete.");
      return;
    }

    if (!confirm("Are you sure you want to delete this feedback entry?")) return;

    try {
      const res = await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotalItems((t) => Math.max(0, t - 1));
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  };

  // Trigger Simulated Channel Ingestion
  const handleSimulateChannel = async () => {
    if (userRole === "VIEWER") {
      alert("Forbidden: Viewers cannot trigger channel ingestion.");
      return;
    }

    setSimulating(true);
    try {
      const res = await fetch("/api/feedback/simulate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Simulation failed");

      fetchInboxData();
      fetchThemes();
    } catch (err: any) {
      alert(err.message || "Simulated channel trigger failed");
    } finally {
      setSimulating(false);
    }
  };

  // Submit Single Feedback Form
  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSingle(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: singleContent,
          channel: singleChannel,
          customerLabel: singleCustomer || "Manual Entry",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingestion failed");

      setSingleContent("");
      setSingleCustomer("");
      setSingleModalOpen(false);
      fetchInboxData();
      fetchThemes();
    } catch (err: any) {
      alert(err.message || "Error submitting feedback");
    } finally {
      setSubmittingSingle(false);
    }
  };

  // Process CSV Upload
  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setUploadingCsv(true);
    setCsvSummary(null);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedRows = results.data.map((row: any) => ({
            content: row.content || row.text || row.Feedback || "",
            channel: row.channel || "Support Ticket",
            customerLabel: row.customer_label || row.customer || "CSV Import",
          })).filter(r => r.content.trim().length >= 3);

          if (parsedRows.length === 0) {
            throw new Error("No valid feedback rows with 'content' column found in CSV.");
          }

          const res = await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: parsedRows }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "CSV Import failed");

          setCsvSummary(data.summary);
          fetchInboxData();
          fetchThemes();
        } catch (err: any) {
          alert(err.message || "CSV processing error");
        } finally {
          setUploadingCsv(false);
        }
      },
    });
  };

  const statusBadgeColors: Record<string, string> = {
    NEW: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    REVIEWED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    ACTIONED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };

  const sentimentBadgeColors: Record<string, string> = {
    POS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    NEU: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    NEG: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };

  return (
    <div className="space-y-6">
      {/* Header & Ingestion Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Feedback Inbox
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-semibold">
              {totalItems} Items
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, auto-classify, and triage incoming customer feedback
          </p>
        </div>

        {/* Action Buttons (Disabled or hidden for Viewer role per RBAC) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSimulateChannel}
            disabled={simulating || userRole === "VIEWER"}
            className="px-3.5 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            title="Simulate incoming ticket/review/survey channel item"
          >
            <Radio className={`w-3.5 h-3.5 ${simulating ? "animate-pulse" : ""}`} />
            {simulating ? "Inhaling Feed..." : "Simulate Channel"}
          </button>

          <button
            onClick={() => setCsvModalOpen(true)}
            disabled={userRole === "VIEWER"}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            Bulk CSV Upload
          </button>

          <button
            onClick={() => setSingleModalOpen(true)}
            disabled={userRole === "VIEWER"}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Single Ingestion
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search feedback text, customer, or feature area..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-500 text-xs outline-none transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Channel Filter */}
            <select
              value={channelFilter}
              onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Channels</option>
              <option value="Support Ticket">Support Ticket</option>
              <option value="App Store Review">App Store Review</option>
              <option value="NPS Survey">NPS Survey</option>
              <option value="Sales Call Note">Sales Call Note</option>
              <option value="Community Post">Community Post</option>
            </select>

            {/* Sentiment Filter */}
            <select
              value={sentimentFilter}
              onChange={(e) => { setSentimentFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Sentiments</option>
              <option value="POS">Positive (POS)</option>
              <option value="NEU">Neutral (NEU)</option>
              <option value="NEG">Negative (NEG)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="REVIEWED">REVIEWED</option>
              <option value="ACTIONED">ACTIONED</option>
            </select>

            {/* Theme Filter */}
            <select
              value={themeFilter}
              onChange={(e) => { setThemeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium outline-none focus:border-indigo-500 max-w-[150px]"
            >
              <option value="ALL">All Themes</option>
              {themes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Feedback Items Table / Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-sm">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
          <span>Loading inbox items...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 space-y-3">
          <Inbox className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No feedback entries found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or click 'Simulate Channel' to ingest sample customer feedback.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-5 glass-card rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
                    {item.channel}
                  </span>

                  <span
                    className={`font-extrabold px-2.5 py-0.5 rounded-full border text-[10px] ${
                      sentimentBadgeColors[item.sentiment]
                    }`}
                  >
                    {item.sentiment} ({item.sentimentScore > 0 ? `+${item.sentimentScore}` : item.sentimentScore})
                  </span>

                  {item.featureArea && (
                    <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/20 text-[11px] font-medium">
                      {item.featureArea}
                    </span>
                  )}

                  <span className="text-slate-500 text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString()} by {item.customerLabel || "Anonymous"}
                  </span>
                </div>

                <p className="text-sm text-slate-100 font-medium leading-relaxed">
                  "{item.content}"
                </p>

                {/* AI Rationale & Themes */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {item.rationale && (
                    <span className="text-xs text-slate-400 italic flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      {item.rationale}
                    </span>
                  )}

                  {item.feedbackThemes?.map((ft: any) => (
                    <span
                      key={ft.theme.id}
                      className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full"
                    >
                      🏷️ {ft.theme.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status Selector & Actions */}
              <div className="flex items-center gap-3 self-end md:self-center">
                {/* Inline Status Dropdown */}
                <select
                  value={item.status}
                  disabled={userRole === "VIEWER"}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase transition-all outline-none ${
                    statusBadgeColors[item.status]
                  }`}
                >
                  <option value="NEW">NEW</option>
                  <option value="REVIEWED">REVIEWED</option>
                  <option value="ACTIONED">ACTIONED</option>
                </select>

                {/* Reclassify AI Button */}
                <button
                  onClick={() => handleReclassify(item.id)}
                  disabled={reclassifyingId === item.id || userRole === "VIEWER"}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-300 border border-slate-700 transition-all disabled:opacity-50"
                  title="Re-run Claude AI classification"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reclassifyingId === item.id ? "animate-spin text-indigo-400" : ""}`} />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={userRole === "VIEWER"}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all disabled:opacity-50"
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            Page <span className="font-bold text-white">{page}</span> of {totalPages} ({totalItems} total)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Single Ingestion */}
      {singleModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-lg w-full rounded-3xl p-6 border border-slate-800 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" /> Single Feedback Ingestion
              </h3>
              <button
                onClick={() => setSingleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSingle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Feedback Content *
                </label>
                <textarea
                  required
                  rows={4}
                  value={singleContent}
                  onChange={(e) => setSingleContent(e.target.value)}
                  placeholder="Paste verbatim customer quote, support ticket message, or review content..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Channel Source
                  </label>
                  <select
                    value={singleChannel}
                    onChange={(e) => setSingleChannel(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none"
                  >
                    <option value="Support Ticket">Support Ticket</option>
                    <option value="App Store Review">App Store Review</option>
                    <option value="NPS Survey">NPS Survey</option>
                    <option value="Sales Call Note">Sales Call Note</option>
                    <option value="Community Post">Community Post</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Customer Identifier
                  </label>
                  <input
                    type="text"
                    value={singleCustomer}
                    onChange={(e) => setSingleCustomer(e.target.value)}
                    placeholder="Acme Corp / User_402"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSingleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSingle}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {submittingSingle ? "AI Classifying & Ingesting..." : "Ingest & Classify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CSV Bulk Upload */}
      {csvModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-lg w-full rounded-3xl p-6 border border-slate-800 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-400" /> Bulk CSV Ingestion
              </h3>
              <button
                onClick={() => { setCsvModalOpen(false); setCsvSummary(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {csvSummary ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">CSV Ingestion Complete!</h4>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-4 text-left text-xs">
                  <div>
                    <span className="text-slate-400">Successfully Imported:</span>
                    <div className="text-lg font-extrabold text-emerald-400">{csvSummary.importedCount} rows</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Failed / Skipped:</span>
                    <div className="text-lg font-extrabold text-rose-400">{csvSummary.failedCount} rows</div>
                  </div>
                </div>
                <button
                  onClick={() => { setCsvModalOpen(false); setCsvSummary(null); }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCsvUpload} className="space-y-4">
                <p className="text-xs text-slate-400">
                  Upload a CSV file containing customer feedback. Must include a <code className="text-indigo-400 font-bold">content</code> column. Optional columns: <code className="text-purple-400 font-bold">channel</code>, <code className="text-purple-400 font-bold">customer_label</code>.
                </p>

                <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl text-center bg-slate-900/50">
                  <input
                    type="file"
                    accept=".csv"
                    required
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="csvInput"
                  />
                  <label htmlFor="csvInput" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-indigo-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-200">
                      {csvFile ? csvFile.name : "Click to select CSV file"}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">Supports up to 5,000 rows</span>
                  </label>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCsvModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingCsv || !csvFile}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                  >
                    {uploadingCsv ? "Parsing & AI Classifying..." : "Upload & Process CSV"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
