import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

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
  );
}

export default App;
