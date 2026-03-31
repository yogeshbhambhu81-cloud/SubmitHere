import React, { useEffect, useState } from "react";

export default function MyAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [viewingFile, setViewingFile] = useState(null);
  const [toast, setToast] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const email = user?.email || "";

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2000);
  };

  const handleViewFile = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/file/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setViewingFile(url);
    } catch {
      showToast("Error opening file.", true);
    }
  };

  const closeFile = () => {
    if (viewingFile) {
      URL.revokeObjectURL(viewingFile);
      setViewingFile(null);
    }
  };

  const loadAssignments = () => {
    setLoadingAssignments(true);
    fetch(`${API_BASE_URL}/api/student/all/${email.toLowerCase()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setAssignments(Array.isArray(data) ? data : []);
        setLoadingAssignments(false);
      })
      .catch(() => {
        showToast("Error loading assignments", true);
        setLoadingAssignments(false);
      });
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const filteredAssignments =
    filter === "all"
      ? assignments
      : assignments.filter((a) => a.status === filter);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
    } else {
      showToast("Only PDF files allowed!", true);
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      showToast("Title and PDF are required", true);
      return;
    }

    const formData = new FormData();
    formData.append("assignment", file);
    formData.append("email", email.toLowerCase());
    formData.append("title", title);

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/student/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (res.ok) {
        showToast("Assignment uploaded successfully!");
        setShowUpload(false);
        setFile(null);
        setTitle("");
        loadAssignments();
      } else {
        showToast("Upload failed", true);
      }
    } catch {
      showToast("Upload error", true);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    submitted: { bg: "bg-green-100", text: "text-green-700" },
    approved: { bg: "bg-blue-100", text: "text-blue-700" },
    rejected: { bg: "bg-red-100", text: "text-red-700" },
    rechecking: { bg: "bg-amber-100", text: "text-amber-700" },
    pending: { bg: "bg-amber-100", text: "text-amber-700" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium backdrop-blur-sm ${
            toast.isError
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-700"
          }`}
          style={{
            animation: 'slideInRight 0.3s ease-out forwards'
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{toast.isError ? "✕" : "✓"}</span>
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap sm:flex-nowrap justify-between items-center gap-4">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
            <button
              onClick={() => window.history.back()}
              className="p-2 sm:p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all shrink-0"
              title="Go Back"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center shadow-md">
                <span className="text-2xl">📚</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-slate-800 truncate">
                  My Assignments
                </h1>
                <p className="hidden sm:block text-xs text-slate-500 truncate">
                  View and manage all your submissions
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-center shrink-0">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-24 sm:w-auto px-2 sm:px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-700 hover:border-slate-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all outline-none"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="rechecking">Rechecking</option>
            </select>

            <button
              onClick={() => setShowUpload(true)}
              className="p-2 sm:px-5 sm:py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs sm:text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
              title="Upload New"
            >
              <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Upload New</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:block bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <div className="col-span-4">Assignment Title</div>
              <div className="col-span-3">Submitted On</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {loadingAssignments ? (
              <div className="text-center py-16">
                <div className="inline-block w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 text-sm font-medium">Loading assignments...</p>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-16 bg-slate-50">
                <span className="text-6xl mb-4 block opacity-50">📋</span>
                <p className="text-slate-600 font-medium mb-1">
                  {filter === "all" ? "No assignments found" : `No ${filter} assignments`}
                </p>
                <p className="text-slate-400 text-sm">
                  {filter === "all" 
                    ? "Upload your first assignment to get started"
                    : "Try changing the filter to see more assignments"}
                </p>
              </div>
            ) : (
              filteredAssignments.map((a, idx) => (
                <div
                  key={a._id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 md:items-center hover:bg-slate-50 transition-colors group"
                  style={{
                    animation: `fadeIn 0.4s ease-out ${idx * 0.05}s forwards`,
                    opacity: 0,
                  }}
                >
                  <div className="col-span-1 md:col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(a.title || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                        {a.title || "Untitled Assignment"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{a.filename}</p>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-3 text-sm text-slate-600 flex md:block items-center justify-between">
                    <span className="md:hidden font-semibold text-slate-500">Submitted:</span>
                    <span>{a.submittedAtFormatted || new Date(a.submittedAt).toLocaleDateString() || "N/A"}</span>
                  </div>

                  <div className="col-span-1 md:col-span-2 flex md:block items-center justify-between">
                    <span className="md:hidden font-semibold text-slate-500">Status:</span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                        statusConfig[a.status]?.bg || "bg-slate-100"
                      } ${statusConfig[a.status]?.text || "text-slate-700"}`}
                    >
                      {a.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="col-span-1 md:col-span-3 flex justify-start md:justify-end gap-2 mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-slate-100">
                    <button
                      onClick={() => handleViewFile(a._id)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium shadow-sm transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    <a
                      href={`${API_BASE_URL}/api/student/file/${a._id}`}
                      target="_self"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          {["all", "pending", "submitted", "approved", "rejected"].map((status, idx) => {
            const count = status === "all" 
              ? assignments.length 
              : assignments.filter(a => a.status === status).length;
            
            return (
              <div
                key={status}
                className="bg-white border border-slate-200 rounded-xl p-4 text-center"
                style={{
                  animation: `fadeInUp 0.4s ease-out ${idx * 0.1}s forwards`,
                  opacity: 0
                }}
              >
                <div className="text-2xl font-bold text-slate-800 mb-1">{count}</div>
                <div className="text-xs text-slate-500 capitalize font-medium">{status}</div>
              </div>
            );
          })}
        </div>
      </main>

      {/* PDF Viewer Modal */}
      {viewingFile && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 animate-fade-in"
          onClick={closeFile}
        >
          <div 
            className="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-800">Assignment Preview</h3>
              </div>
              <button 
                onClick={closeFile}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all group"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* PDF Content */}
            <div className="flex-1 bg-slate-100 relative">
              <iframe 
                src={viewingFile} 
                className="w-full h-full border-none"
                title="Assignment Content"
              />
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowUpload(false)}
        >
          <div 
            className="bg-white w-[90%] sm:w-full max-w-md mx-4 rounded-2xl p-6 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Upload Assignment</h3>
              </div>
              <button
                onClick={() => setShowUpload(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assignment Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., DBMS Project Report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  PDF File
                </label>
                <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-blue-300 hover:bg-slate-50 transition-all">
                  <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-slate-600 mb-1">
                    {file ? file.name : "Click to select PDF"}
                  </span>
                  <span className="text-xs text-slate-400">
                    Only PDF files accepted
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowUpload(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={loading || !file || !title.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
