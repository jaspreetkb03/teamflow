import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './ProjectDetailPage.css';

const STATUS_COLS = [
  { key:'todo',        label:'To Do',      cls:'todo' },
  { key:'in-progress', label:'In Progress', cls:'progress' },
  { key:'in-review',   label:'In Review',   cls:'review' },
  { key:'completed',   label:'Done',        cls:'done' },
];

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const isOverdue = task.dueDate && task.status !== 'completed' && new Date(task.dueDate) < new Date();
  return (
    <div className="task-card">
      <div className="tc-header">
        <span className={`p-dot p-${task.priority}`}/>
        <span className="tc-priority">{task.priority}</span>
        <div className="tc-actions">
          <button onClick={() => onEdit(task)} className="tc-btn">✏</button>
          <button onClick={() => onDelete(task._id)} className="tc-btn del">🗑</button>
        </div>
      </div>
      <p className="tc-title">{task.title}</p>
      {task.description && <p className="tc-desc">{task.description}</p>}
      <div className="tc-footer">
        {task.assignee
          ? <span className="tc-assignee" title={task.assignee.name}>{task.assignee.name[0].toUpperCase()}</span>
          : <span className="tc-assignee unassigned" title="Unassigned">?</span>}
        {task.dueDate && <span className={`tc-due ${isOverdue?'overdue':''}`}>
          {isOverdue?'⚠ ':''}{new Date(task.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
        </span>}
        <select className="status-select" value={task.status} onChange={e => onStatusChange(task._id, e.target.value)}>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="in-review">In Review</option>
          <option value="completed">Done</option>
        </select>
      </div>
    </div>
  );
}

function TaskModal({ task, projectId, members, onClose, onSave }) {
  const isEdit = !!task;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: task?.title||'', description: task?.description||'',
    status: task?.status||'todo', priority: task?.priority||'medium',
    assignee: task?.assignee?._id||task?.assignee||'', dueDate: task?.dueDate?new Date(task.dueDate).toISOString().split('T')[0]:''
  });
  const set = e => setForm(f => ({...f,[e.target.name]:e.target.value}));

  const submit = async e => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title required');
    setLoading(true);
    try {
      const payload = { ...form, project: projectId, assignee: form.assignee||null, dueDate: form.dueDate||null };
      const { data } = isEdit
        ? await api.put(`/tasks/${task._id}`, payload)
        : await api.post('/tasks', payload);
      toast.success(isEdit ? 'Task updated' : 'Task created');
      onSave(data.task, !isEdit);
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal fade-up">
        <div className="modal-hdr">
          <h3>{isEdit?'Edit Task':'New Task'}</h3>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} className="modal-body">
          <div className="field"><label className="form-label">Title *</label>
            <input name="title" value={form.title} onChange={set} className="input" placeholder="What needs to be done?" autoFocus />
          </div>
          <div className="field"><label className="form-label">Description</label>
            <textarea name="description" value={form.description} onChange={set} className="input" rows={2} placeholder="More details..." />
          </div>
          <div className="field-row">
            <div className="field"><label className="form-label">Priority</label>
              <select name="priority" value={form.priority} onChange={set} className="input">
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div className="field"><label className="form-label">Status</label>
              <select name="status" value={form.status} onChange={set} className="input">
                <option value="todo">To Do</option><option value="in-progress">In Progress</option>
                <option value="in-review">In Review</option><option value="completed">Done</option>
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field"><label className="form-label">Assign To</label>
              <select name="assignee" value={form.assignee} onChange={set} className="input">
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
              </select>
            </div>
            <div className="field"><label className="form-label">Due Date</label>
              <input type="date" name="dueDate" value={form.dueDate} onChange={set} className="input" />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : isEdit?'Save':'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberModal({ project, onClose, onUpdate }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const addMember = async e => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/projects/${project._id}/members`, { email, role });
      toast.success('Member added');
      onUpdate(data.project);
      setEmail(''); setRole('member');
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };

  const removeMember = async (userId) => {
    try {
      await api.delete(`/projects/${project._id}/members/${userId}`);
      toast.success('Member removed');
      const { data } = await api.get(`/projects/${project._id}`);
      onUpdate(data.project);
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal fade-up" style={{maxWidth:460}}>
        <div className="modal-hdr"><h3>Team Members</h3><button className="modal-x" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <form onSubmit={addMember} className="add-member-form">
            <input value={email} onChange={e=>setEmail(e.target.value)} className="input" placeholder="Email address" type="email" />
            <select value={role} onChange={e=>setRole(e.target.value)} className="input" style={{width:'auto'}}>
              <option value="member">Member</option><option value="admin">Admin</option>
            </select>
            <button type="submit" className="btn btn-primary" disabled={loading}>Add</button>
          </form>
          <div className="members-list">
            {project.members?.map(m => (
              <div key={m.user?._id} className="member-row">
                <div className="member-avatar">{m.user?.name?.[0]?.toUpperCase()||'?'}</div>
                <div className="member-info">
                  <span className="member-name">{m.user?.name}</span>
                  <span className="member-email">{m.user?.email}</span>
                </div>
                <span className={`badge ${m.role==='admin'?'badge-review':'badge-todo'}`}>{m.role}</span>
                {m.user?._id !== project.owner?._id && (
                  <button className="btn btn-danger" style={{padding:'4px 10px',fontSize:11}} onClick={() => removeMember(m.user._id)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [userRole, setUserRole] = useState('member');

  const loadData = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`, { params: { status: filterStatus||undefined, priority: filterPriority||undefined } })
      ]);
      setProject(pRes.data.project);
      setUserRole(pRes.data.userRole);
      setTasks(tRes.data.tasks);
    } catch { toast.error('Failed to load project'); navigate('/projects'); }
    finally { setLoading(false); }
  }, [id, filterStatus, filterPriority, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { data } = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id===taskId ? data.task : t));
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id!==taskId));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleSaveTask = (savedTask, isNew) => {
    setTasks(prev => isNew ? [savedTask, ...prev] : prev.map(t => t._id===savedTask._id ? savedTask : t));
    setShowTaskModal(false); setEditTask(null);
  };

  const deleteProject = async () => {
    if (!window.confirm('Delete this project and all tasks? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch { toast.error('Failed to delete project'); }
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'50vh'}}><div className="spinner"/></div>;
  if (!project) return null;

  const isProjectAdmin = userRole === 'admin' || isAdmin;
  const tasksByStatus = STATUS_COLS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {});

  return (
    <div className="proj-detail">
      {/* Header */}
      <div className="proj-detail-hdr fade-up">
        <button className="back-btn" onClick={() => navigate('/projects')}>← Projects</button>
        <div className="proj-detail-meta">
          <div className="proj-detail-avatar" style={{background:`${project.color||'var(--cyan)'}20`,color:project.color||'var(--cyan)'}}>
            {project.name[0].toUpperCase()}
          </div>
          <div>
            <h1>{project.name}</h1>
            {project.description && <p>{project.description}</p>}
          </div>
        </div>
        <div className="proj-detail-actions">
          <button className="btn btn-ghost" onClick={() => setShowMembers(true)}>👥 Team ({project.members?.length})</button>
          {isProjectAdmin && <button className="btn btn-primary" onClick={() => {setEditTask(null);setShowTaskModal(true);}}>+ Task</button>}
          {isProjectAdmin && <button className="btn btn-danger" onClick={deleteProject}>Delete</button>}
        </div>
      </div>

      {/* Filters */}
      <div className="proj-filters fade-up">
        <select className="input" style={{width:'auto'}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="todo">To Do</option><option value="in-progress">In Progress</option>
          <option value="in-review">In Review</option><option value="completed">Done</option>
        </select>
        <select className="input" style={{width:'auto'}} value={filterPriority} onChange={e=>setFilterPriority(e.target.value)}>
          <option value="">All Priority</option>
          <option value="critical">Critical</option><option value="high">High</option>
          <option value="medium">Medium</option><option value="low">Low</option>
        </select>
        <span className="task-count-badge">{tasks.length} task{tasks.length!==1?'s':''}</span>
      </div>

      {/* Kanban board */}
      <div className="kanban fade-up" style={{animationDelay:'.1s'}}>
        {STATUS_COLS.map(col => (
          <div key={col.key} className="kanban-col">
            <div className="kanban-col-hdr">
              <span className={`col-dot col-${col.cls}`}/>
              <span className="col-label">{col.label}</span>
              <span className="col-count">{tasksByStatus[col.key]?.length||0}</span>
            </div>
            <div className="kanban-cards">
              {tasksByStatus[col.key]?.length === 0
                ? <div className="empty-col">No tasks</div>
                : tasksByStatus[col.key].map(t => (
                    <TaskCard key={t._id} task={t}
                      onEdit={t => { setEditTask(t); setShowTaskModal(true); }}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  ))
              }
            </div>
          </div>
        ))}
      </div>

      {(showTaskModal) && (
        <TaskModal task={editTask} projectId={id} members={project.members||[]}
          onClose={() => {setShowTaskModal(false);setEditTask(null);}}
          onSave={handleSaveTask} />
      )}
      {showMembers && (
        <MemberModal project={project}
          onClose={() => setShowMembers(false)}
          onUpdate={updated => setProject(updated)} />
      )}
    </div>
  );
}
