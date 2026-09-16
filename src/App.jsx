import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { AppThemeProvider } from './utils/theme';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '175493040671-ic9a0aod0uv3053p5q491qm0sf8oagnp.apps.googleusercontent.com';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppThemeProvider>
        <AuthProvider>
          <Router>
            <Layout>
            <Routes>
              <Route path="/login" element={<Login />} />
              {/* Signup route hidden - redirects to login. Re-enable <Signup /> if needed later */}
              <Route path="/signup" element={<Navigate to="/login" replace />} />

              {/* Protected Admin Routes */}
              <Route element={<PrivateRoute requiredRole="ROLE_ADMIN" />}>
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Route>

              {/* Protected Employee Routes */}
              <Route element={<PrivateRoute requiredRole="ROLE_EMPLOYEE" />}>
                <Route path="/employee/*" element={<EmployeeDashboard />} />
              </Route>

              <Route path="/" element={<PrivateRoute />}>
                <Route index element={<Navigate to="/employee" replace />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Layout>
        </Router>
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </AppThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
