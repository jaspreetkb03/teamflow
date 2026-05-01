import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const chartOpts = {
  plugins: {
    legend: { labels: { color:'#8080a0', font:{ family:'Inter' }, boxWidth:10 } },
    tooltip: { backgroundColor:'#15152a', borderColor:'rgba(255,255,255,0.08)', borderWidth:1, titleColor:'#eeeeff', bodyColor:'#8080a0' }
  }
};

const StatCard = ({ label, value, icon, color, sub, delay }) => (
  <div className="stat-card fade-up" style={{ animationDelay: delay, borderColor:`${color}25` }}>
    <div className="stat-icon" style={{ background:`${color}18`, color }}>{icon}</div>
    <div>
      <div className="stat-val" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    api.get('/stats/dashboard').then(r => setStats(r.data.stats)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="center-spin"><div className="spinner"/></div>;

  const s = stats;
  const donutData = {
    labels: ['To Do','In Progress','In Review','Done'],
    datasets: [{ data: [s.byStatus.todo, s.byStatus['in-progress'], s.byStatus['in-review'], s.byStatus.completed], backgroundColor:['rgba(128,128,160,.7)','rgba(245,158,11,.7)','rgba(167,139,250,.7)','rgba(132,204,22,.7)'], borderColor:['#8080a0','#f59e0b','#a78bfa','#84cc16'], borderWidth:2, hoverOffset:5 }]
  };

  const barData = {
    labels: ['Critical','High','Medium','Low'],
    datasets: [{ label:'Tasks', data:[s.byPriority.critical,s.byPriority.high,s.byPriority.medium,s.byPriority.low], backgroundColor:['rgba(244,63,94,.7)','rgba(249,115,22,.7)','rgba(245,158,11,.7)','rgba(0,229,255,.7)'], borderColor:['#f43f5e','#f97316','#f59e0b','#00e5ff'], borderWidth:2, borderRadius:6 }]
  };

  const total = s.byStatus.todo + s.byStatus['in-progress'] + s.byStatus['in-review'] + s.byStatus.completed;
  const pct = total > 0 ? Math.round((s.byStatus.completed / total) * 100) : 0;

  return (
    <div className="dash-page">
      <div className="dash-header fade-up">
        <div>
          <h1>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p>{new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <Link to="/projects" className="btn btn-primary">+ New Project</Link>
      </div>

      <div className="stat-row">
        <StatCard label="My Projects" value={s.totalProjects} icon="◈" color="#00e5ff" delay="0s" />
        <StatCard label="My Tasks"    value={s.myTasks}      icon="✓"  color="#84cc16" delay=".05s" />
        <StatCard label="Total Tasks" value={s.totalTasks}   icon="⊞"  color="#7c3aed" delay=".1s"  />
        <StatCard label="Overdue"     value={s.overdueTasks} icon="⚠"  color="#f43f5e" delay=".15s" sub="Needs attention" />
        {isAdmin && s.adminStats && <>
          <StatCard label="All Users"    value={s.adminStats.totalUsers}    icon="👥" color="#f59e0b" delay=".2s" />
          <StatCard label="All Projects" value={s.adminStats.totalProjects} icon="📁" color="#f97316" delay=".25s" />
        </>}
      </div>

      <div className="dash-charts">
        <div className="chart-card fade-up" style={{animationDelay:'.2s'}}>
          <h3>Task Status</h3>
          {total > 0 ? (
            <div className="donut-wrap">
              <Doughnut data={donutData} options={{...chartOpts, cutout:'68%', plugins:{...chartOpts.plugins,legend:{...chartOpts.plugins.legend,position:'bottom'}}}} />
              <div className="donut-center"><span className="donut-pct">{pct}%</span><span>done</span></div>
            </div>
          ) : <div className="empty-chart">No tasks yet</div>}
        </div>

        <div className="chart-card fade-up" style={{animationDelay:'.25s'}}>
          <h3>Priority Breakdown</h3>
          {total > 0 ? (
            <Bar data={barData} options={{...chartOpts, scales:{x:{ticks:{color:'#8080a0'},grid:{color:'rgba(255,255,255,0.04)'}},y:{ticks:{color:'#8080a0',stepSize:1},grid:{color:'rgba(255,255,255,0.04)'}}}}} />
          ) : <div className="empty-chart">No tasks yet</div>}
        </div>
      </div>

      {/* Projects quick view */}
      {s.projects?.length > 0 && (
        <div className="dash-section fade-up" style={{animationDelay:'.3s'}}>
          <div className="section-hdr">
            <h3>Your Projects</h3>
            <Link to="/projects" className="see-all">View all →</Link>
          </div>
          <div className="project-cards">
            {s.projects.slice(0,4).map(p => {
              const done = p.completedCount || 0;
              const total = p.taskCount || 0;
              const pct = total > 0 ? Math.round((done/total)*100) : 0;
              return (
                <Link to={`/projects/${p._id}`} key={p._id} className="proj-mini">
                  <div className="proj-mini-dot" style={{background: p.color||'var(--cyan)'}} />
                  <div className="proj-mini-info">
                    <span className="proj-mini-name">{p.name}</span>
                    <span className="proj-mini-tasks">{done}/{total} tasks done</span>
                    <div className="proj-mini-bar">
                      <div className="proj-mini-fill" style={{width:`${pct}%`, background: p.color||'var(--cyan)'}} />
                    </div>
                  </div>
                  <span className={`badge badge-${p.status==='active'?'done':p.status==='completed'?'done':'todo'}`}>{p.status}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent tasks */}
      {s.recentTasks?.length > 0 && (
        <div className="dash-section fade-up" style={{animationDelay:'.35s'}}>
          <div className="section-hdr">
            <h3>My Recent Tasks</h3>
            <Link to="/my-tasks" className="see-all">View all →</Link>
          </div>
          <div className="recent-tasks">
            {s.recentTasks.map(t => (
              <div key={t._id} className="recent-task-row">
                <span className={`p-dot p-${t.priority}`}/>
                <span className="rt-title">{t.title}</span>
                <span className="rt-project" style={{color:t.project?.color||'var(--cyan)'}}>{t.project?.name}</span>
                <span className={`badge badge-${t.status==='todo'?'todo':t.status==='in-progress'?'progress':t.status==='in-review'?'review':'done'}`}>
                  {t.status}
                </span>
                {t.dueDate && <span className={`rt-due ${new Date(t.dueDate)<new Date()&&t.status!=='completed'?'overdue':''}`}>
                  {new Date(t.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                </span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
