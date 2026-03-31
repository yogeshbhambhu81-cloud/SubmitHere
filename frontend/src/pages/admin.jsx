import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


export default function Admin() {
  const [users, setUsers] = useState({ student: [], professor: [], counts: {} });
  const [pending, setPending] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [showFacultyModal, setShowFacultyModal] = useState(false);
const [facultyForm, setFacultyForm] = useState({
  name: "",
  email: "",
  password: "",
  department: "",
  role: "professor",
});


  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleManageDepartments = () => {
    navigate("/admin/departments");
  };

  const fetchApprovedUsers = async () => {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  const data = await res.json();
  setUsers(data);
};

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/department`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch {}
  };

  const fetchPending = async () => {
    const res = await fetch(`${API_BASE_URL}/api/admin/pending`, {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
    const data = await res.json();
    setPending(data);
  };

  const approveUser = async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/approve/${id}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
    if (res.ok) showToast("User approved successfully!");
    else showToast("Error approving user.", true);
    fetchPending();
    fetchApprovedUsers();
  };

  const rejectUser = async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/admin/reject/${id}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
    if (res.ok) showToast("User request rejected.");
    else showToast("Error rejecting user.", true);
    fetchPending();
  };

  const deleteUser = async (id) => {
    setConfirmDelete(null);
    const res = await fetch(`${API_BASE_URL}/api/admin/delete/${id}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
    if (res.ok) showToast("User deleted successfully.");
    else showToast("Error deleting user.", true);
    fetchApprovedUsers();
  };
  const createFaculty = async () => {
  const res = await fetch(`${API_BASE_URL}/api/admin/create-faculty`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
  body: JSON.stringify(facultyForm),
});
  const data = await res.json();

  if (res.ok) {
    showToast("Faculty created & email sent!");
    setShowFacultyModal(false);
    setFacultyForm({
      name: "",
      email: "",
      password: "",
      department: "",
      role: "professor",
    });
    fetchApprovedUsers();
  } else {
    showToast(data.message || "Failed to create faculty", true);
  }
};


  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await fetchApprovedUsers();
      await fetchPending();
      await fetchDepartments();
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(selectedRole === role ? null : role);
    setSelectedDepartment("all");
  };

  const filteredUsers = selectedRole
    ? users[selectedRole].filter((user) =>
        selectedDepartment === "all" ? true : user.department === selectedDepartment
      )
    : [];

  const roleColors = {
    professor: "from-blue-50 to-indigo-50 border-blue-200",
    student: "from-emerald-50 to-teal-50 border-emerald-200",
    // hod: "from-slate-50 to-gray-100 border-slate-300",
  };

  const roleIcons = {
    professor: "👨‍🏫",
    student: "🎓",
    // hod: "👔",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 text-slate-800 p-6">
      {/* Toast notification */}
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

      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 sm:gap-0">
          <div className="space-y-1 w-full">
            <h1 className="text-3xl font-semibold text-slate-800">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Manage users and oversee university operations
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
            <button
  onClick={() => setShowFacultyModal(true)}
  className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
  title="Create Faculty"
>
  👨‍🏫
</button>

            <button
              onClick={handleManageDepartments}
              className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
              title="Manage Departments"
            >
              <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all"
              title="Logout"
            >
              <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {["professor", "student"].map((role, idx) => (
            <div
              key={role}
              className={`relative p-5 rounded-xl bg-gradient-to-br ${roleColors[role]} border shadow-sm cursor-pointer overflow-hidden group transition-all hover:shadow-md hover:-translate-y-1`}
              onClick={() => handleRoleSelect(role)}
              style={{
                animation: `fadeInUp 0.4s ease-out ${0.1 + idx * 0.1}s forwards`,
                opacity: 0
              }}
            >
              <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-1">
                    <div className="text-3xl mb-1">{roleIcons[role]}</div>
                    <h3 className="text-lg font-semibold text-slate-700 capitalize">{role}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {role === "student"
                        ? "Enrolled learners"
                        : role === "professor"
                        ? "Course evaluators"
                        : "Department heads"}
                    </p>
                  </div>
                  <div className="text-right bg-white/60 px-3 py-2 rounded-lg">
                    <div className="text-3xl font-bold text-slate-700">
                      {users.counts?.[role] ?? 0}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">Total</div>
                  </div>
                </div>

                <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400"
                    style={{
                      animation: `progress 1s ease-out ${0.2 + idx * 0.1}s forwards`,
                      width: 0
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-5 gap-4 sm:gap-0">
            <div className="space-y-2 w-full sm:w-auto overflow-x-auto">
              <h2 className="text-xl font-semibold text-slate-800">
                {selectedRole ? (
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">{roleIcons[selectedRole]}</span>
                    {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Directory
                  </span>
                ) : (
                  "User Management"
                )}
              </h2>
              {selectedRole && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 animate-slide-in">
                  <label className="text-sm text-slate-600 font-medium whitespace-nowrap">
                    Filter by Department:
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-3 py-1.5 rounded-md border border-slate-300 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.slug} value={dept.slug}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
``
            {selectedRole && (
              <button
                onClick={() => setSelectedRole(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-sm font-medium transition-all"
              >
                Clear Filter
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              <p className="text-slate-500 mt-3 text-sm font-medium">Loading data...</p>
            </div>
          ) : selectedRole ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500 border-b-2 border-slate-200">
                    <th className="py-3 px-4 font-semibold">Name</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Department</th>
                    <th className="py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredUsers.map((u, idx) => (
                    <tr
                      key={u._id}
                      className="hover:bg-slate-50 transition-colors border-b border-slate-100"
                      style={{
                        animation: `fadeIn 0.3s ease-out ${idx * 0.03}s forwards`,
                        opacity: 0
                      }}
                    >
                      <td className="py-3 px-4 font-medium text-slate-700">{u.name}</td>
                      <td className="py-3 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {departments.find((d) => d.slug === u.department)?.name ||
                          u.department ||
                          "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setConfirmDelete(u)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-md text-xs font-medium transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-10 pt-6 border-t border-slate-200">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
              <span className="text-xl">⏳</span>
              Pending Approvals
            </h3>

            {pending.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-4xl mb-2 block">✓</span>
                <p className="text-slate-500 text-sm font-medium">
                  No pending requests at this time
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-500 border-b-2 border-slate-200">
                      <th className="py-3 px-4 font-semibold">Name</th>
                      <th className="py-3 px-4 font-semibold">Email</th>
                      <th className="py-3 px-4 font-semibold">Role</th>
                      <th className="py-3 px-4 font-semibold">Department</th>
                      <th className="py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {pending.map((u, idx) => (
                      <tr
                        key={u._id}
                        className="hover:bg-slate-50 transition-colors border-b border-slate-100"
                        style={{
                          animation: `fadeIn 0.3s ease-out ${idx * 0.03}s forwards`,
                          opacity: 0
                        }}
                      >
                        <td className="py-3 px-4 font-medium text-slate-700">{u.name}</td>
                        <td className="py-3 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3 px-4 capitalize text-slate-600">{u.role}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {departments.find((d) => d.slug === u.department)?.name ||
                            u.department ||
                            "N/A"}
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          <button
                            onClick={() => approveUser(u._id)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-md text-xs font-medium transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectUser(u._id)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-md text-xs font-medium transition-all"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-[400px] shadow-xl border border-slate-200 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl mb-3 text-center">⚠️</div>
            <h3 className="text-xl font-semibold mb-2 text-slate-800 text-center">
              Confirm Deletion
            </h3>
            <p className="text-sm text-slate-600 text-center mb-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-800">{confirmDelete.name}</span>{" "}
              <span className="text-slate-500">({confirmDelete.role})</span>?
            </p>
            <div className="text-xs text-red-600 font-medium text-center bg-red-50 p-3 rounded-lg border border-red-200 mt-3">
              This will permanently delete the user and all associated data.
            </div>

            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(confirmDelete._id)}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all shadow-sm"
              >
                Delete Permanently
              </button>
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

        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
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

        .animate-slide-in {
          animation: slideInRight 0.3s ease-out forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
     {showFacultyModal && (
  <div 
    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
    onClick={() => setShowFacultyModal(false)}
  >
    <div
      className="bg-white rounded-2xl p-6 w-full max-w-[440px] shadow-2xl border border-slate-200 animate-scale-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800">
            Create Faculty Member
          </h2>
        </div>
        <button
          onClick={() => setShowFacultyModal(false)}
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
            Full Name
          </label>
          <input
            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all outline-none"
            placeholder="e.g., Dr. John Smith"
            value={facultyForm.name}
            onChange={(e) =>
              setFacultyForm({ ...facultyForm, name: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all outline-none"
            placeholder="john.smith@university.edu"
            value={facultyForm.email}
            onChange={(e) =>
              setFacultyForm({ ...facultyForm, email: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Temporary Password
          </label>
          <input
            type="password"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all outline-none"
            placeholder="Enter temporary password"
            value={facultyForm.password}
            onChange={(e) =>
              setFacultyForm({ ...facultyForm, password: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Role
          </label>
          <select
            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all outline-none"
            value={facultyForm.role}
            onChange={(e) =>
              setFacultyForm({ ...facultyForm, role: e.target.value })
            }
          >
            <option value="professor">👨‍🏫 Professor</option>
            {/* <option value="hod">👔 Head of Department (HOD)</option> */}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Department
          </label>
          <select
            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all outline-none"
            value={facultyForm.department}
            onChange={(e) =>
              setFacultyForm({ ...facultyForm, department: e.target.value })
            }
          >
            <option value="">Select a department</option>
            {departments.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
        <button
          onClick={() => setShowFacultyModal(false)}
          className="flex-1 px-4 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all"
        >
          Cancel
        </button>
        <button
          onClick={createFaculty}
          className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Create & Send Email
        </button>
      </div>
    </div>
  </div>
)}

<style>{`
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
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
    animation: fadeIn 0.2s ease-out forwards;
  }

  .animate-scale-in {
    animation: scaleIn 0.3s ease-out forwards;
  }
`}</style>
  </div>
)}
