// import React, { useEffect, useState, useCallback } from "react";
// export default function HodDashboard() {
//   const user = JSON.parse(localStorage.getItem("user"));
//   const token = localStorage.getItem("token");

//   const [tab, setTab] = useState("approved");
//   const [counts, setCounts] = useState({ approved: 0, rechecking: 0 });
//   const [assignments, setAssignments] = useState([]);
//   const [students, setStudents] = useState([]);
//   const [showStudents, setShowStudents] = useState(false);
//   const [studentView, setStudentView] = useState(null);
//     const API = import.meta.env.VITE_API_BASE_URL;


//   const loadCounts = useCallback(async () => {
//     const r = await fetch(`${API}/counts`, {
//       headers: { Authorization: "Bearer " + token }
//     });
//     setCounts(await r.json());
//   }, [token]);

//   const loadAssignments = useCallback(async () => {
//     const r = await fetch(`${API}/assignments/${tab}`, {
//       headers: { Authorization: "Bearer " + token }
//     });
//     setAssignments(await r.json());
//   }, [tab, token]);

//   const loadStudents = useCallback(async () => {
//     const r = await fetch(`${API}/students`, {
//       headers: { Authorization: "Bearer " + token }
//     });
//     setStudents(await r.json());
//   }, [token]);

//   const openFile = async (id) => {
//     const r = await fetch(`${API}/assignment/file/${id}`, {
//       headers: { Authorization: "Bearer " + token }
//     });
//     const b = await r.blob();
//     window.open(URL.createObjectURL(b), "_blank");
//   };

//   const submit = async (id) => {
//     await fetch(`${API}/assignments/${id}/submit`, {
//       method: "PATCH",
//       headers: { Authorization: "Bearer " + token }
//     });
//     loadAssignments();
//     loadCounts();
//   };

//   const recheck = async (id) => {
//     await fetch(`${API}/assignments/${id}/recheck`, {
//       method: "PATCH",
//       headers: { Authorization: "Bearer " + token }
//     });
//     loadAssignments();
//     loadCounts();
//   };

//   const logout = () => {
//     localStorage.clear();
//     window.location.href = "/";
//   };

//   useEffect(() => {
//     loadCounts();
//     loadAssignments();
//     loadStudents();
//   }, [tab, loadCounts, loadAssignments, loadStudents]);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 font-sans">
//       <header className="w-full bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center shadow-sm sticky top-0 z-10">
//         <div>
//           <h1 className="text-lg font-semibold text-slate-800">
//             👔 {user?.name?.toUpperCase()}
//           </h1>
//           <p className="text-xs text-slate-500 mt-0.5">
//             {user?.email} • HOD • {user?.department?.toUpperCase()}
//           </p>
//         </div>

//         <div className="flex gap-2">
//           <button
//             onClick={() => setShowStudents(!showStudents)}
//             className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white shadow-sm transition-all"
//           >
//             {showStudents ? "Close Students" : "View Students"}
//           </button>

//           <button
//             onClick={logout}
//             className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-medium text-white shadow-sm transition-all"
//           >
//             Logout
//           </button>
//         </div>
//       </header>

//       <div className="p-4 sm:p-6 max-w-6xl mx-auto animate-fade-in">
//         <h1 className="text-3xl font-semibold mb-6 text-slate-800">
//           Assignment Dashboard
//         </h1>

//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
//           <div
//             onClick={() => setTab("approved")}
//             className={`p-5 rounded-xl cursor-pointer shadow-sm border transition-all ${
//               tab === "approved"
//                 ? "bg-blue-600 text-white border-blue-600"
//                 : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:shadow-md"
//             }`}
//           >
//             <h2 className="text-3xl font-bold mb-1">{counts.approved}</h2>
//             <p className="text-sm font-medium opacity-90">Professor Approved</p>
//           </div>

//           <div
//             onClick={() => setTab("rechecking")}
//             className={`p-5 rounded-xl cursor-pointer shadow-sm border transition-all ${
//               tab === "rechecking"
//                 ? "bg-amber-600 text-white border-amber-600"
//                 : "bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:shadow-md"
//             }`}
//           >
//             <h2 className="text-3xl font-bold mb-1">{counts.rechecking}</h2>
//             <p className="text-sm font-medium opacity-90">Sent for Rechecking</p>
//           </div>
//         </div>

//         <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
//           <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center gap-2 border-b pb-3">
//             <span className="text-2xl">{tab === "approved" ? "✅" : "🔁"}</span>
//             {tab === "approved" ? "Approved Assignments" : "Rechecking Assignments"}
//             <span className="text-sm font-normal text-slate-500 ml-auto">
//               ({assignments.length})
//             </span>
//           </h2>

//           <div className="space-y-3">
//             {assignments.length === 0 ? (
//               <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
//                 <span className="text-4xl mb-2 block">📋</span>
//                 <p className="text-slate-500 text-sm font-medium">
//                   No assignments available
//                 </p>
//               </div>
//             ) : (
//               assignments.map((a, idx) => (
//                 <div
//                   key={a._id}
//                   className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
//                   style={{
//                     animation: `fadeIn 0.3s ease-out ${idx * 0.05}s forwards`,
//                     opacity: 0
//                   }}
//                 >
//                   <div className="flex flex-col md:flex-row justify-between gap-3">
//                     <div className="flex-1">
//                       <h3 className="font-semibold text-base text-slate-800">{a.title}</h3>
//                       <p className="text-sm text-blue-600 mt-1 font-medium">
//                         Student: {a.studentName} ({a.studentEmail})
//                       </p>
//                       <p className="text-xs text-slate-500 mt-1">
//                         Approved by: {a.reviewerName}
//                       </p>
//                     </div>

//                     <div className="flex gap-2 items-start">
//                       <button
//                         onClick={() => openFile(a.fileUrl)}
//                         className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded-lg font-medium shadow-sm transition-all"
//                       >
//                         📂 Open
//                       </button>

//                       <button
//                         onClick={() => submit(a._id)}
//                         className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-medium shadow-sm transition-all"
//                       >
//                         ✓ Submit
//                       </button>

//                       <button
//                         onClick={() => recheck(a._id)}
//                         className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-lg font-medium shadow-sm transition-all"
//                       >
//                         ↻ Recheck
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>

//         {showStudents && (
//           <div
//             className="mt-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-slide-in"
//           >
//             <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center gap-2">
//               <span className="text-2xl">🎓</span>
//               Department Students
//               <span className="text-sm font-normal text-slate-500 ml-auto">
//                 ({students.length})
//               </span>
//             </h2>

//             <div className="space-y-2">
//               {students.map((s, idx) => (
//                 <div
//                   key={s._id}
//                   onClick={async () => {
//                     const r = await fetch(`${API}/student/${s._id}/assignments`, {
//                       headers: { Authorization: "Bearer " + token }
//                     });
//                     setStudentView({ name: s.name, data: await r.json() });
//                   }}
//                   className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all"
//                   style={{
//                     animation: `fadeIn 0.3s ease-out ${idx * 0.03}s forwards`,
//                     opacity: 0
//                   }}
//                 >
//                   <span className="font-medium text-sm text-slate-700">{s.name}</span>
//                   <span className="text-sm font-semibold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md">
//                     {s.total}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {studentView && (
//           <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-scale-in">
//             <h3 className="font-semibold text-lg mb-4 text-slate-800 flex items-center gap-2">
//               <span>📊</span>
//               {studentView.name}'s Assignments
//               <span className="text-sm font-normal text-slate-500 ml-auto">
//                 ({studentView.data.length})
//               </span>
//             </h3>

//             <div className="space-y-2">
//               {studentView.data.map((a, idx) => (
//                 <div 
//                   key={a._id} 
//                   className="p-3 border-b border-slate-200 last:border-0 text-sm flex justify-between items-center"
//                   style={{
//                     animation: `fadeIn 0.3s ease-out ${idx * 0.03}s forwards`,
//                     opacity: 0
//                   }}
//                 >
//                   <span className="text-slate-700 font-medium">{a.title}</span>
//                   <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
//                     a.status === 'submitted' ? 'bg-emerald-100 text-emerald-700' :
//                     a.status === 'approved' ? 'bg-blue-100 text-blue-700' :
//                     a.status === 'rechecking' ? 'bg-amber-100 text-amber-700' :
//                     'bg-slate-100 text-slate-700'
//                   }`}>
//                     {a.status.toUpperCase()}
//                   </span>
//                 </div>
//               ))}
//             </div>

//             <button
//               onClick={() => setStudentView(null)}
//               className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-all"
//             >
//               Close
//             </button>
//           </div>
//         )}
//       </div>

//       <style>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//             transform: translateY(10px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes slideIn {
//           from {
//             opacity: 0;
//             transform: translateY(-10px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes scaleIn {
//           from {
//             opacity: 0;
//             transform: scale(0.95);
//           }
//           to {
//             opacity: 1;
//             transform: scale(1);
//           }
//         }

//         .animate-fade-in {
//           animation: fadeIn 0.4s ease-out forwards;
//         }

//         .animate-slide-in {
//           animation: slideIn 0.3s ease-out forwards;
//         }

//         .animate-scale-in {
//           animation: scaleIn 0.3s ease-out forwards;
//         }
//       `}</style>
//     </div>
//   );
// }
