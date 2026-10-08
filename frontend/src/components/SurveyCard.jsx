import { Link } from 'react-router-dom';
import { Users, Clock, CheckCircle } from 'lucide-react';
import { districts } from '../data/mockData';

export default function SurveyCard({ survey }) {
  const district = districts.find((d) => d.id === survey.districtId);
  const progress = Math.round((survey.responses / survey.targetResponses) * 100);
  const isActive = survey.status === 'active';

  return (
    <Link to={`/surveys/${survey.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          background: 'var(--bg-card)', borderRadius: 16, padding: 24,
          boxShadow: '0 1px 3px var(--shadow)', border: '1px solid var(--border)',
          transition: 'all .2s', cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow-lg)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 3px var(--shadow)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
            {survey.title}
          </h3>
          <span style={{
            padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: isActive ? 'var(--green-bg)' : 'var(--bg-secondary)',
            color: isActive ? '#22c55e' : 'var(--text-muted)', whiteSpace: 'nowrap',
          }}>
            {isActive ? 'Активен' : 'Завершён'}
          </span>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {survey.description}
        </p>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          <span>📍 {district?.name || '—'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} /> {survey.responses} ответов</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isActive ? <Clock size={14} /> : <CheckCircle size={14} />}
            {isActive ? 'Активен' : 'Завершён'}
          </span>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>Прогресс</span><span>{progress}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-secondary)' }}>
            <div style={{
              height: '100%', borderRadius: 3, width: `${Math.min(progress, 100)}%`,
              background: 'linear-gradient(90deg,#22c55e,#0ea5e9)',
            }} />
          </div>
        </div>
      </div>
    </Link>
  );
}