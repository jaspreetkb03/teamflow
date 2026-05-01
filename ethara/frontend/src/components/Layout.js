import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Layout.css';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); toast.success('Signed out'); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U';

  return (
    <div className={`layout ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sb-top">
          <div className="sb-logo">
            <span className="sb-logo-mark">E</span>
            {!collapsed && <span className="sb-logo-text">Ethara</span>}
          </div>
          <button className="sb-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="sb-nav">
          <NavLink to="/dashboard" className={({isActive}) => `sb-link ${isActive?'active':''}`}>
            <span className="sb-icon">⊞</span>
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
          <NavLink to="/projects" className={({isActive}) => `sb-link ${isActive?'active':''}`}>
            <span className="sb-icon">◈</span>
            {!collapsed && <span>Projects</span>}
          </NavLink>
          <NavLink to="/my-tasks" className={({isActive}) => `sb-link ${isActive?'active':''}`}>
            <span className="sb-icon">✓</span>
            {!collapsed && <span>My Tasks</span>}
          </NavLink>
        </nav>

        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar">{initials}</div>
            {!collapsed && (
              <div className="sb-user-info">
                <span className="sb-user-name">{user?.name}</span>
                <span className="sb-user-role">{isAdmin ? '🛡 Admin' : '👤 Member'}</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button className="sb-logout" onClick={handleLogout}>Sign out</button>
          )}
        </div>
      </aside>

      <main className="main-area">
        <Outlet />
      </main>
    </div>
  );
}
