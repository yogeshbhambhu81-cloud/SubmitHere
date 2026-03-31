import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./autharisation/signup";
import Login from "./autharisation/login";
import Admin from "./pages/admin";
import StudentAssignment from "./pages/student";
import ProfessorDashboard from "./pages/professor";
import DepartmentManagement from "./pages/departmentpage";
import ProtectedRoute from "./protectroutes";
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
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute>
                <DepartmentManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student"
            element={
              <ProtectedRoute>
                <StudentAssignment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/professor"
            element={
              <ProtectedRoute>
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
           <Route path="/my-assignments" element={<MyAssignments />} />
        </Routes>
       
    
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
