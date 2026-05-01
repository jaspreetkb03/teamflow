import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPage.css';

function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'', role:'member' });

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Fill in all fields');
    if (!isLogin && form.password !== form.confirm) return toast.error('Passwords do not match');
    if (!isLogin && form.password.length < 6) return toast.error('Password min 6 chars');

    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        await register(form.name, form.email, form.password, form.role);
        toast.success('Account created!');
      }
      navigate('/dashboard');
    } catch(err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const fillDemo = () => setForm(f => ({ ...f, email: 'admin@ethara.com', password: 'admin123' }));

  return (
    <div className="auth-wrap">
      <div className="auth-bg">
        <div className="orb orb1"/><div className="orb orb2"/>
        <div className="grid-bg"/>
      </div>

      <div className="auth-box fade-up">
        <div className="auth-brand">
          <span className="brand-mark">E</span>
          <span className="brand-name">Ethara</span>
        </div>
        <p className="auth-tagline">Team Task Manager</p>

        <form onSubmit={submit} className="auth-form">
          <h2>{isLogin ? 'Sign in' : 'Create account'}</h2>
          <p className="auth-sub">{isLogin ? 'Access your workspace' : 'Start collaborating with your team'}</p>

          {!isLogin && (
            <div className="field">
              <label className="form-label">Full name</label>
              <input name="name" value={form.name} onChange={set} placeholder="John Doe" className="input" required />
            </div>
          )}

          <div className="field">
            <label className="form-label">Email</label>
            <input name="email" type="email" value={form.email} onChange={set} placeholder="you@company.com" className="input" required />
          </div>

          <div className="field">
            <label className="form-label">Password</label>
            <input name="password" type="password" value={form.password} onChange={set} placeholder="Min. 6 characters" className="input" required />
          </div>

          {!isLogin && (
            <>
              <div className="field">
                <label className="form-label">Confirm Password</label>
                <input name="confirm" type="password" value={form.confirm} onChange={set} placeholder="Repeat password" className="input" />
              </div>
              <div className="field">
                <label className="form-label">Role</label>
                <select name="role" value={form.role} onChange={set} className="input">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="spinner" style={{width:16,height:16,borderWidth:2}} /> : isLogin ? 'Sign in' : 'Create account'}
          </button>

          {isLogin && (
            <button type="button" className="btn btn-ghost" style={{width:'100%'}} onClick={fillDemo}>
              Fill Demo Credentials
            </button>
          )}
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <Link to={isLogin ? '/register' : '/login'} style={{color:'var(--cyan)',marginLeft:6,fontWeight:600}}>
            {isLogin ? 'Register' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export const LoginPage    = () => <AuthPage mode="login" />;
export const RegisterPage = () => <AuthPage mode="register" />;

export default AuthPage;
