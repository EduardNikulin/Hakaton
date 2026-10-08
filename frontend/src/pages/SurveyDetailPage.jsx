import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import { surveys, districts } from '../data/mockData';

export default function SurveyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const survey = surveys.find((s) => s.id === Number(id));
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!survey) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>Опрос не найден</h2>
        <Link to="/surveys" style={{ color: '#22c55e', marginTop: 16 }}>← Вернуться к опросам</Link>
      </div>
    );
  }

  const district = districts.find((d) => d.id === survey.districtId);
  const progress = Math.round((survey.responses / survey.targetResponses) * 100);
  const isActive = survey.status === 'active';

  const handleAnswer = (questionId, value) => setAnswers((prev) => ({ ...prev, [questionId]: value }));
  const handleSubmit = (e) => { e.preventDefault(); console.log('Ответы:', answers); setSubmitted(true); };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <CheckCircle size={48} color="#22c55e" />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Спасибо за участие!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 400 }}>Ваши ответы помогут улучшить экологическую обстановку</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/surveys" style={{ padding: '12px 24px', borderRadius: 12, textDecoration: 'none', background: '#22c55e', color: '#fff', fontWeight: 600 }}>Все опросы</Link>
          <button onClick={() => navigate('/')} style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>На главную</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', transition: 'background .3s' }}>
      <Header />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
        <Link to="/surveys" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, marginBottom: 20, fontWeight: 500 }}>
          <ArrowLeft size={16} /> Назад к опросам
        </Link>

        <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 32, boxShadow: '0 1px 3px var(--shadow)' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{survey.title}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 4, lineHeight: 1.5 }}>{survey.description}</p>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>📍 {district?.name || '—'}</div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>{survey.responses} из {survey.targetResponses} ответов</span><span>{progress}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-secondary)' }}>
              <div style={{ height: '100%', borderRadius: 4, width: `${Math.min(progress, 100)}%`, background: 'linear-gradient(90deg,#22c55e,#0ea5e9)' }} />
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', marginBottom: 32 }} />

          <form onSubmit={handleSubmit}>
            {survey.questions.map((q, qi) => (
              <div key={q.id} style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 15, marginBottom: 12, color: 'var(--text-primary)' }}>
                  {qi + 1}. {q.text}
                </label>
                {q.type === 'radio' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options.map((opt) => {
                      const isSelected = answers[q.id] === opt;
                      return (
                        <label key={opt} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${isSelected ? '#22c55e' : 'var(--border)'}`,
                          background: isSelected ? 'var(--green-bg)' : 'var(--bg-card)',
                          transition: 'all .15s',
                        }}>
                          <input type="radio" name={q.id} value={opt} checked={isSelected} onChange={() => handleAnswer(q.id, opt)} style={{ accentColor: '#22c55e' }} />
                          <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {q.type === 'text' && (
                  <textarea
                    value={answers[q.id] || ''} onChange={(e) => handleAnswer(q.id, e.target.value)}
                    rows={4} placeholder="Напишите ваш ответ..."
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 12,
                      border: '2px solid var(--border)', fontSize: 14, outline: 'none',
                      fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical',
                      background: 'var(--bg)', color: 'var(--text-primary)', transition: 'border-color .2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#22c55e')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                )}
              </div>
            ))}
            <button type="submit" disabled={!isActive} style={{
              width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
              background: isActive ? 'linear-gradient(135deg,#22c55e,#0ea5e9)' : '#d1d5db',
              color: '#fff', fontSize: 16, fontWeight: 700,
              cursor: isActive ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Send size={18} /> {isActive ? 'Отправить ответы' : 'Опрос завершён'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}