import { Link } from 'react-router-dom';
import { MapPin, Users, CheckCircle, Clock } from 'lucide-react';

export default function SurveyCard({ survey }) {
  const isActive = survey.is_active;
  const questionsCount = survey.questions?.length ?? 0;

  return (
    <Link
      to={`/surveys/${survey.id}`}
      style={{
        display: 'block',
        background: 'var(--bg-card)',
        borderRadius: 20,
        padding: 24,
        border: '1px solid var(--border)',
        textDecoration: 'none',
        transition: 'border-color .2s, transform .15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#22c55e';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
        <h3 style={{
          fontSize: 18, fontWeight: 700, margin: 0, flex: 1,
          color: 'var(--text-primary)', lineHeight: 1.35,
        }}>
          {survey.title}
        </h3>

        <div style={{
          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
          background: isActive ? 'var(--green-bg)' : 'var(--bg-secondary)',
          color: isActive ? '#166534' : 'var(--text-secondary)',
          border: `1px solid ${isActive ? 'var(--green-border)' : 'var(--border)'}`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {isActive ? 'Активен' : 'Завершён'}
        </div>
      </div>

      <p style={{
        fontSize: 14, color: 'var(--text-secondary)',
        margin: '0 0 16px 0', lineHeight: 1.5,
      }}>
        {survey.description}
      </p>

      <div style={{
        display: 'flex', gap: 20, fontSize: 13,
        color: 'var(--text-muted)', flexWrap: 'wrap',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle size={14} /> {questionsCount} {questionsCount === 1 ? 'вопрос' : questionsCount < 5 ? 'вопроса' : 'вопросов'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} />
          {new Date(survey.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </Link>
  );
}