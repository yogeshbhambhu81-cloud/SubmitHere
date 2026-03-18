import React, { useEffect, useState, useCallback } from "react";

const getInitialAuth = () => {
  try {
    return {
      user: JSON.parse(localStorage.getItem("user")),
      token: localStorage.getItem("token")
    };
  } catch {
    return { user: null, token: null };
  }
};

const API_BASE_URL = "https://uniportal-07kb.onrender.com/api/professor";

export default function ProfessorDashboard() {
  const [auth, setAuth] = useState(getInitialAuth());
  const [isLoading, setIsLoading] = useState(true);
  const { user, token } = auth;

  const [assignments, setAssignments] = useState([]);
  const [tab, setTab] = useState("pending");
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    reviewed: 0
  });
  const [toast, setToast] = useState(null);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setAuth(getInitialAuth());
      setIsLoading(false);
    }, 50);
    return () => clearTimeout(t);
  }, []);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 2000);
  };

  const loadCounts = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE_URL}/assignments-counts`, {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();

    setCounts({
      pending: (data.pending || 0) + (data.rechecking || 0),
      approved: data.approved || 0,
      rejected: data.rejected || 0,
      reviewed: (data.approved || 0) + (data.rejected || 0)
    });
  }, [token]);

  const fetchAssignments = useCallback(async () => {
    if (!token) return;
    
    setLoadingAssignments(true);
    let url = `${API_BASE_URL}/assignments/${tab}`;
    if (tab === "pending") {
      url = `${API_BASE_URL}/assignments/pending`;
    }

    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + token }
    });

    const data = await res.json();

    if (tab === "pending") {
      setAssignments(
        data.filter(a => a.status === "pending" || a.status === "rechecking")
      );
    } else {
      setAssignments(data);
    }
    setLoadingAssignments(false);
  }, [tab, token]);

const changeStatus = async (id, status) => {
  const prevAssignment = assignments.find(a => a._id === id);
  if (!prevAssignment) return;

  const prevStatus = prevAssignment.status;

  const res = await fetch(
    `${API_BASE_URL}/assignments/${id}/${status}`,
    {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token }
    }
  );

  if (!res.ok) {
    showToast("Action failed", true);
    return;
  }

  const updated = await res.json();

  setAssignments(prev =>
    prev.map(a =>
      a._id === id
        ? {
            ...a,
            status: updated.status,
            reviewerId: updated.reviewerId,
            reviewerName: updated.reviewerName
          }
        : a
    )
  );

  setCounts(prev => {
    const next = { ...prev };

    if (prevStatus === "pending" || prevStatus === "rechecking") {
      next.pending = Math.max(0, next.pending - 1);
    }

    if (prevStatus === "approved") {
      next.approved = Math.max(0, next.approved - 1);
    }

    if (prevStatus === "rejected") {
      next.rejected = Math.max(0, next.rejected - 1);
    }

    if (updated.status === "approved") {
      next.approved += 1;
    }

    if (updated.status === "rejected") {
      next.rejected += 1;
    }

    next.reviewed = next.approved + next.rejected;
    return next;
  });

  showToast(
    `Assignment ${updated.status.charAt(0).toUpperCase() +
      updated.status.slice(1)} successfully!`
  );
};



  const openFile = async (id) => {
    const res = await fetch(`${API_BASE_URL}/assignment/file/${id}`, {
      headers: { Authorization: "Bearer " + token }
    });
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), "_blank");
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  useEffect(() => {
    if (!isLoading && token) {
      fetchAssignments();
      loadCounts();
    }
  }, [tab, isLoading, token]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        <div className="p-8 bg-white rounded-2xl shadow-lg border border-slate-200">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-semibold text-slate-700 text-center">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const tabConfig = {
    pending: { icon: "⏳", color: "from-amber-500 to-orange-500", bgColor: "bg-amber-50", borderColor: "border-amber-200", textColor: "text-amber-700" },
    approved: { icon: "✓", color: "from-emerald-500 to-green-500", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", textColor: "text-emerald-700" },
    rejected: { icon: "✕", color: "from-red-500 to-rose-500", bgColor: "bg-red-50", borderColor: "border-red-200", textColor: "text-red-700" },
    reviewed: { icon: "📊", color: "from-blue-500 to-indigo-500", bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-700" }
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
            {toast.msg}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <span className="text-2xl">👨‍🏫</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                {user.name}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full"></span>
                Professor • {user.department.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-xs font-medium text-white shadow-sm transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Assignment Review
          </h1>
          <p className="text-slate-500 text-sm">
            Review and manage student assignments
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.keys(tabConfig).map((t, idx) => (
            <div
              key={t}
              onClick={() => setTab(t)}
              className={`group relative p-5 rounded-2xl cursor-pointer transition-all duration-300 ${
                tab === t
                  ? `bg-gradient-to-br ${tabConfig[t].color} text-white shadow-xl scale-[1.02]`
                  : "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:shadow-lg"
              }`}
              style={{
                animation: `fadeInUp 0.4s ease-out ${idx * 0.1}s forwards`,
                opacity: 0
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  tab === t ? "bg-white/20" : tabConfig[t].bgColor
                }`}>
                  <span className="text-xl">{tabConfig[t].icon}</span>
                </div>
                <h2 className="text-3xl font-bold">{counts[t]}</h2>
              </div>
              <p className="text-sm font-medium capitalize opacity-90">{t}</p>
              <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transition-all ${
                tab === t ? "bg-white/30" : "bg-slate-500/0 group-hover:bg-slate-500/10"
              }`}></div>
            </div>
          ))}
        </div>

        {/* Assignments Section */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tabConfig[tab].bgColor}`}>
                  <span className="text-xl">{tabConfig[tab].icon}</span>
                </div>
                <span className="capitalize">{tab} Assignments</span>
              </h2>
              <span className="px-3 py-1 bg-slate-200 text-slate-700 text-sm font-semibold rounded-full">
                {assignments.length}
              </span>
            </div>
          </div>

          <div className="p-6">
            {loadingAssignments ? (
              <div className="text-center py-16">
                <div className="inline-block w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 text-sm font-medium">Loading assignments...</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-xl">
                <span className="text-6xl mb-4 block opacity-50">📋</span>
                <p className="text-slate-600 font-medium mb-1">No assignments found</p>
                <p className="text-slate-400 text-sm">There are no {tab} assignments at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((a, idx) => (
                  <div
                    key={a._id}
                    className="group p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200"
                    style={{
                      animation: `fadeIn 0.4s ease-out ${idx * 0.05}s forwards`,
                      opacity: 0
                    }}
                  >
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {a.title.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-base text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                              {a.title}
                            </h3>
                            <div className="flex flex-wrap gap-3 text-xs mb-2">
                              <span className="flex items-center gap-1.5 text-slate-600">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {a.studentName}
                              </span>
                              <span className="flex items-center gap-1.5 text-slate-500">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {a.studentEmail}
                              </span>
                            </div>
                            {a.reviewerName && (
 <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
  {a.reviewerId === user.id ? (
    <>
      <span
        className={
          a.status === "rejected" ? "text-red-600" : "text-emerald-600"
        }
      >
        {a.status === "rejected" ? "✕" : "✔"}
      </span>
      {a.status.charAt(0).toUpperCase() + a.status.slice(1)} by you
    </>
  ) : (
    <>
      <span
        className={
          a.status === "rejected" ? "text-red-600" : "text-emerald-600"
        }
      >
        {a.status === "rejected" ? "✕" : "✔"}
      </span>
      {a.status.charAt(0).toUpperCase() + a.status.slice(1)} by {a.reviewerName}
    </>
  )}
</p>


)}


                            {a.status === "rechecking" && (
                              <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-xs font-medium text-amber-700 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  HOD sent this assignment for rechecking
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap lg:flex-nowrap gap-2 lg:items-start">
                        <button
                          onClick={() => openFile(a.fileUrl)}
                          className="flex-1 lg:flex-none px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded-lg font-medium shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Open File
                        </button>

                      {(a.status === "pending" ||
  a.status === "rechecking" ||
  a.reviewerId === user.id) && (
  <>
    <button
      onClick={() => changeStatus(a._id, "approve")}
      className="flex-1 lg:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs rounded-lg font-medium"
    >
      Approve
    </button>

    <button
      onClick={() => changeStatus(a._id, "reject")}
      className="flex-1 lg:flex-none px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-lg font-medium"
    >
      Reject
    </button>
  </>
)}

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
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

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}