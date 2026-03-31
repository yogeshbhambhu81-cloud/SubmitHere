import React, { useState, useEffect } from "react";
import ProfileSidebar from "../components/ProfileSidebar.jsx";

export default function StudentAssignment() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [showPrev, setShowPrev] = useState(false);
  const [title, setTitle] = useState("");
  const [toast, setToast] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const email = user?.email || "";

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
    } else {
      showToast("Only PDF files allowed!", true);
    }
  };

  const handleSubmit = async () => {
    if (!file || title.trim() === "") {
      showToast("Title and PDF are required.", true);
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

      const data = await res.json();

      if (res.ok) {
        showToast("Assignment uploaded successfully!");
        setFile(null);
        setTitle("");
        loadAssignments();
      } else {
        showToast(data.message || "Upload failed", true);
      }
    } catch {
      showToast("Upload error", true);
    } finally {
      setLoading(false);
    }
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
    fetch(`${API_BASE_URL}/api/student/all/${email.toLowerCase()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAssignments(data);
        } else {
          setAssignments([]);
        }
      })
      .catch(() => showToast("Error loading assignments.", true));
  };

  useEffect(() => {
    if (user && email) {
      loadAssignments();
    }
  }, []);

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
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center shadow-md">
              <span className="text-2xl">🎓</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-slate-800 truncate">
                {user?.name || "Student"}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1.5 sm:gap-2">
                <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full"></span>
                Assignment Portal
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center shrink-0">
            <button
              onClick={() => window.location.href = "/my-assignments"}
              className="p-2 sm:px-4 sm:py-2 rounded-lg bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-sm transition-all flex items-center gap-2"
              title="My Assignments"
            >
              <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">My Assignments</span>
            </button>

            <button
              onClick={() => setIsProfileOpen(true)}
              className="p-2 sm:px-4 sm:py-2 rounded-lg bg-white border border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-xs font-medium text-slate-700 shadow-sm transition-all flex items-center gap-2"
              title="Profile Settings"
            >
              <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 sm:px-4 sm:py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-xs font-medium text-white shadow-sm transition-all flex items-center gap-2"
              title="Logout"
            >
              <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
        {/* Upload Section */}
        <div
          className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 transition-all duration-300 ${
            showPrev ? 'opacity-90 scale-[0.98]' : 'opacity-100 scale-100'
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                Upload Assignment
              </h2>
              <p className="text-sm text-slate-500">
                Submit your assignment PDF for review
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assignment Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., DBMS Project Report"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload PDF File
              </label>
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-all group">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-700 mb-1">
                  Click to select PDF file
                </span>
                <span className="text-xs text-slate-400">
                  Only PDF files are accepted
                </span>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </label>

              {file && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={!file || !title.trim() || loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-sm font-medium text-white disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit Assignment
                  </>
                )}
              </button>

              <button
                onClick={() => setShowPrev(!showPrev)}
                className="px-6 py-3 rounded-xl text-sm font-medium border border-slate-300 bg-white hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {showPrev ? "Hide" : "View"} History
              </button>
            </div>
          </div>
        </div>

        {/* Previous Submissions */}
        {showPrev && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-slide-in">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Your Submissions
                </h3>
              </div>
              <span className="px-3 py-1 bg-slate-200 text-slate-700 text-sm font-semibold rounded-full">
                {assignments.length}
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {assignments.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl">
                  <span className="text-5xl mb-3 block opacity-50">📋</span>
                  <p className="text-slate-600 font-medium mb-1">No submissions yet</p>
                  <p className="text-slate-400 text-sm">Upload your first assignment to get started</p>
                </div>
              ) : (
                assignments.map((file, idx) => (
                  <div
                    key={file._id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                    style={{
                      animation: `fadeIn 0.3s ease-out ${idx * 0.05}s forwards`,
                      opacity: 0
                    }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-3">
                      <div className="flex flex-wrap sm:flex-nowrap items-start gap-3 w-full sm:w-auto flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(file.title || "U").charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-slate-800 mb-1">
                          {file.title || "Untitled Assignment"}
                        </h4>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                              file.status === "submitted"
                                ? "bg-green-100 text-green-700"
                                : file.status === "approved"
                                ? "bg-blue-100 text-blue-700"
                                : file.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : file.status === "rechecking"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {file.status.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 flex items-center gap-1.5 overflow-hidden">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="truncate">{file.filename}</span>
                        </p>
                      </div>
                      </div>

                       <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleViewFile(file._id)}
                          className="flex-1 sm:flex-none justify-center px-3 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        <a
                          href={`${API_BASE_URL}/api/student/file/${file._id}`}
                          className="flex-1 sm:flex-none justify-center px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition-all flex items-center gap-1.5"
                          target="_self"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      <ProfileSidebar isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

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

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
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

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-slide-in {
          animation: slideIn 0.4s ease-out forwards;
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

        .animate-scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
