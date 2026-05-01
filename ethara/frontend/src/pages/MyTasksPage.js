import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './MyTasksPage.css';

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/tasks/my').then(r => setTasks(r.data.tasks)).finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/tasks/${id}/status`, { status });
      setTasks(prev => prev.map(t => t._id===id ? {...t, status: data.task.status} : t));
    } catch { toast.error('Failed to update'); }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t =>
    filter === 'overdue'
      ? t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
      : t.status === filter
  );

  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate)<new Date() && t.status!=='completed').length;

  return (
    <div className="my-tasks-page">
      <div className="page-hdr fade-up">
        <div>
          <h1>My Tasks</h1>
          <p>{tasks.length} assigned · {overdue > 0 ? <span style={{color:'var(--rose)'}}>⚠ {overdue} overdue</span> : 'all on track'}</p>
        </div>
      </div>

      <div className="filter-tabs fade-up">
        {[
          {key:'all',label:`All (${tasks.length})`},
          {key:'todo',label:'To Do'},
          {key:'in-progress',label:'In Progress'},
          {key:'in-review',label:'In Review'},
          {key:'completed',label:'Done'},
          {key:'overdue',label:`⚠ Overdue (${overdue})`},
        ].map(f => (
          <button key={f.key} className={`tab-btn ${filter===f.key?'active':''} ${f.key==='overdue'?'overdue-tab':''}`}
            onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="mt-list">{[1,2,3,4,5].map(i=><div key={i} className="skeleton" style={{height:72}}/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty fade-up">
          <div style={{fontSize:40}}>✓</div>
          <h3>No tasks here</h3>
          <p>You're all caught up!</p>
        </div>
      ) : (
        <div className="mt-list">
          {filtered.map((t,i) => {
            const isOverdue = t.dueDate && new Date(t.dueDate)<new Date() && t.status!=='completed';
            return (
              <div key={t._id} className="mt-row fade-up" style={{animationDelay:`${i*.03}s`}}>
                <span className={`p-dot p-${t.priority}`}/>
                <div className="mt-main">
                  <span className="mt-title">{t.title}</span>
                  {t.description && <span className="mt-desc">{t.description}</span>}
                </div>
                {t.project && (
                  <Link to={`/projects/${t.project._id}`} className="mt-project" style={{color:t.project.color||'var(--cyan)'}}>
                    {t.project.name}
                  </Link>
                )}
                <span className={`badge badge-${t.status==='todo'?'todo':t.status==='in-progress'?'progress':t.status==='in-review'?'review':'done'}`}>
                  {t.status}
                </span>
                {t.dueDate && (
                  <span className={`mt-due ${isOverdue?'overdue':''}`}>
                    {isOverdue?'⚠ ':''}{new Date(t.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </span>
                )}
                <select className="status-select2" value={t.status} onChange={e=>handleStatus(t._id,e.target.value)}>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="in-review">In Review</option>
                  <option value="completed">Done</option>
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
