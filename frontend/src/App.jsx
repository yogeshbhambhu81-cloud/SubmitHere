import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./autharisation/signup";
import Login from "./autharisation/login";
import Admin from "./pages/admin";
import StudentAssignment from "./pages/student";
import ProfessorDashboard from "./pages/professor";
import DepartmentManagement from "./pages/departmentpage";
import ProtectedRoute from "./protectroutes";
import Unauthorized from "./pages/Unauthorized";
import { ToastProvider } from "./components/Toast";
import "./App.css";
import MyAssignments from "./pages/MyAssignments";



function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Admin />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DepartmentManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentAssignment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/professor"
            element={
              <ProtectedRoute allowedRoles={["professor"]}>
                <ProfessorDashboard />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/hod"
            element={
              <ProtectedRoute>
                <HodDashboard />
              </ProtectedRoute>
            }
          /> */}
            <Route
            path="/my-assignments"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <MyAssignments />
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
       
    
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
