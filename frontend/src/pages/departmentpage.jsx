import React, { useState, useEffect } from "react";

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2000);
  };

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/department`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      } else {
        showToast("Failed to load departments.", true);
      }
    } catch (error) {
      showToast("Network error fetching departments.", true);
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = async () => {
    if (!newDepartmentName.trim()) return;
    
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/department`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name: newDepartmentName }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Department added successfully!");
        setNewDepartmentName("");
        fetchDepartments();
      } else {
        showToast(data.message || "Failed to add department.", true);
      }
    } catch {
      showToast("Network error while adding department.", true);
    } finally {
      setAdding(false);
    }
  };

  const deleteDepartment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/department/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Department deleted successfully.");
        fetchDepartments();
      } else {
        showToast(data.message || "Failed to delete department.", true);
      }
    } catch {
      showToast("Network error while deleting department.", true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addDepartment();
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

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

      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 sm:gap-0">
          <div className="flex items-start sm:items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-semibold text-slate-800">
                Department Management
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Add and organize university departments
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Add New Department</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Computer Science"
              className="flex-grow w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none text-slate-700 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 transition-all"
            />
            <button
              onClick={addDepartment}
              disabled={adding || !newDepartmentName.trim()}
              className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white shadow-sm flex items-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {adding ? "Adding..." : "Add Department"}
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">
            Existing Departments 
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({departments.length} {departments.length === 1 ? 'department' : 'departments'})
            </span>
          </h2>
          
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-10 h-10 border-3 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              <p className="text-slate-500 mt-3 text-sm font-medium">Loading departments...</p>
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-4xl mb-2 block">📚</span>
              <p className="text-slate-500 text-sm font-medium">No departments added yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {departments.map((dept, idx) => (
                <div
                  key={dept._id}
                  className="flex items-center justify-between p-4 border border-slate-200 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  style={{
                    animation: `fadeIn 0.3s ease-out ${idx * 0.05}s forwards`,
                    opacity: 0
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-slate-800">{dept.name}</span>
                    <span className="text-xs text-slate-500 mt-0.5">Slug: {dept.slug}</span>
                  </div>
                  <button
                    onClick={() => deleteDepartment(dept._id)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                    title="Delete department"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
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
    </div>
  );
}
