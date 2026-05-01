import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './ProjectsPage.css';

const COLORS = ['#00e5ff','#7c3aed','#84cc16','#f59e0b','#f43f5e','#f97316','#06b6d4','#8b5cf6'];

function ProjectModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:'', description:'', priority:'medium', deadline:'', color: COLORS[0] });
  const [loading, setLoading] = useState(false);
  const set = e => setForm(f => ({...f, [e.target.name]: e.target.value}));

  const submit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name required');
    setLoading(true);
    try {
      const { data } = await api.post('/projects', form);
      toast.success('Project created!');
      onSave(data.project);
    } catch(err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-bg" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal fade-up">
        <div className="modal-hdr">
          <h3>New Project</h3>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} className="modal-body">
          <div className="field"><label className="form-label">Project Name *</label>
            <input name="name" value={form.name} onChange={set} className="input" placeholder="e.g. Website Redesign" autoFocus />
          </div>
          <div className="field"><label className="form-label">Description</label>
            <textarea name="description" value={form.description} onChange={set} className="input" rows={2} placeholder="What is this project about?" />
          </div>
          <div className="field-row">
            <div className="field"><label className="form-label">Priority</label>
              <select name="priority" value={form.priority} onChange={set} className="input">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
            <div className="field"><label className="form-label">Deadline</label>
              <input type="date" name="deadline" value={form.deadline} onChange={set} className="input" />
            </div>
          </div>
          <div className="field"><label className="form-label">Color</label>
            <div className="color-row">
              {COLORS.map(c => (
                <button key={c} type="button" className={`color-dot ${form.color===c?'active':''}`}
                  style={{background:c}} onClick={() => setForm(f=>({...f,color:c}))} />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data.projects)).finally(() => setLoading(false));
  }, []);

  const handleSave = proj => { setProjects(p => [proj, ...p]); setShowModal(false); };

  return (
    <div className="projects-page">
      <div className="page-hdr fade-up">
        <div><h1>Projects</h1><p>{projects.length} project{projects.length!==1?'s':''}</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {loading ? (
        <div className="proj-grid">{[1,2,3,4].map(i=><div key={i} className="skeleton" style={{height:180}}/>)}</div>
      ) : projects.length === 0 ? (
        <div className="empty fade-up">
          <div style={{fontSize:48}}>◈</div>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{marginTop:12}}>+ Create Project</button>
        </div>
      ) : (
        <div className="proj-grid">
          {projects.map((p,i) => {
            const done = p.completedTaskCount||0, total = p.taskCount||0;
            const pct = total>0 ? Math.round((done/total)*100) : 0;
            const isOverdue = p.deadline && new Date(p.deadline)<new Date() && p.status!=='completed';
            return (
              <Link to={`/projects/${p._id}`} key={p._id} className="proj-card fade-up" style={{animationDelay:`${i*0.05}s`, borderColor:`${p.color||'var(--cyan)'}22`}}>
                <div className="proj-card-top">
                  <div className="proj-avatar" style={{background:`${p.color||'var(--cyan)'}20`,color:p.color||'var(--cyan)'}}>
                    {p.name[0].toUpperCase()}
                  </div>
                  <span className={`badge badge-${p.status==='active'?'progress':p.status==='completed'?'done':'todo'}`}>{p.status}</span>
                </div>
                <h3 className="proj-name">{p.name}</h3>
                {p.description && <p className="proj-desc">{p.description}</p>}

                <div className="proj-progress">
                  <div className="proj-prog-bar">
                    <div className="proj-prog-fill" style={{width:`${pct}%`, background:p.color||'var(--cyan)'}} />
                  </div>
                  <span className="proj-prog-txt">{done}/{total} tasks</span>
                </div>

                <div className="proj-footer">
                  <div className="proj-members">
                    {p.members?.slice(0,4).map(m => (
                      <div key={m.user?._id} className="mini-avatar" title={m.user?.name}>
                        {m.user?.name?.[0]?.toUpperCase()||'?'}
                      </div>
                    ))}
                    {p.members?.length > 4 && <div className="mini-avatar">+{p.members.length-4}</div>}
                  </div>
                  <div className="proj-meta-right">
                    {p.priority && <span className={`priority-chip pc-${p.priority}`}>{p.priority}</span>}
                    {p.deadline && <span className={`proj-deadline ${isOverdue?'overdue':''}`}>
                      {isOverdue?'⚠ ':'📅 '}{new Date(p.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                    </span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
}
