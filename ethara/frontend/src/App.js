import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import MyTasksPage from './pages/MyTasksPage';

const Guard = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PubGuard = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/login"    element={<PubGuard><LoginPage /></PubGuard>} />
    <Route path="/register" element={<PubGuard><RegisterPage /></PubGuard>} />
    <Route element={<Guard><Layout /></Guard>}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/projects"  element={<ProjectsPage />} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route path="/my-tasks"  element={<MyTasksPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: { background:'#15152a', color:'#eeeeff', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', fontSize:'13px', fontFamily:'Inter, sans-serif' },
          success: { iconTheme: { primary:'#84cc16', secondary:'#070711' } },
          error:   { iconTheme: { primary:'#f43f5e', secondary:'#070711' } },
        }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
