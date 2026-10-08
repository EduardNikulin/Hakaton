import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import {
  fetchSurvey, submitSurveyAnswers, type Survey, type SingleAnswerSubmit,
} from '../api/surveys';
import { ApiError } from '../api';

export function SurveyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number | number[] | string>>({});
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetchSurvey(Number(id))
      .then((s) => { if (alive) setSurvey(s); })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
        else setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  const setSingle = (qid: number, optionId: number) =>
    setAnswers((p) => ({ ...p, [qid]: optionId }));

  const toggleMulti = (qid: number, optionId: number) =>
    setAnswers((p) => {
      const cur = Array.isArray(p[qid]) ? (p[qid] as number[]) : [];
      const next = cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId];
      return { ...p, [qid]: next };
    });

  const setText = (qid: number, value: string) =>
    setAnswers((p) => ({ ...p, [qid]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;
    setError('');

    // Проверяем, что отвечены все вопросы
    const unanswered = survey.questions.some((q) => {
      const v = answers[q.id];
      if (q.question_type === 'text') return !(typeof v === 'string' && v.trim());
      if (q.question_type === 'multi_choice') return !(Array.isArray(v) && v.length > 0);
      return typeof v !== 'number';
    });
    if (unanswered) {
      setError('Ответьте, пожалуйста, на все вопросы');
      return;
    }

    const payload: SingleAnswerSubmit[] = [];
    for (const q of survey.questions) {
      const v = answers[q.id];
      if (q.question_type === 'text') {
        payload.push({ question_id: q.id, text_answer: (v as string).trim() });
      } else if (q.question_type === 'multi_choice') {
        for (const oid of v as number[]) payload.push({ question_id: q.id, option_id: oid });
      } else {
        payload.push({ question_id: q.id, option_id: v as number });
      }
    }

    setSending(true);
    try {
      await submitSurveyAnswers(survey.id, payload);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: 40, textAlign: 'center' }}>Загрузка…</div>;

  if (notFound) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>Опрос не найден или завершён</h2>
        <Link to="/surveys" style={{ color: '#22c55e', marginTop: 16 }}>← Вернуться к опросам</Link>
      </div>
    );
  }

  if (!survey) return null;

  if (submitted) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
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
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <Link to="/surveys" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, marginBottom: 20, fontWeight: 500 }}>
        <ArrowLeft size={16} /> Назад к опросам
      </Link>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{survey.title}</h1>
        {survey.description && (
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>{survey.description}</p>
        )}

        <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />

        <form onSubmit={handleSubmit}>
          {survey.questions.map((q, qi) => (
            <div key={q.id} style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 15, marginBottom: 12, color: 'var(--text-primary)' }}>
                {qi + 1}. {q.text}
              </label>

              {(q.question_type === 'single_choice' || q.question_type === 'multi_choice') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.options.map((opt) => {
                    const isMulti = q.question_type === 'multi_choice';
                    const isSelected = isMulti
                      ? Array.isArray(answers[q.id]) && (answers[q.id] as number[]).includes(opt.id)
                      : answers[q.id] === opt.id;
                    return (
                      <label key={opt.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                        border: `2px solid ${isSelected ? '#22c55e' : 'var(--border)'}`,
                        background: isSelected ? 'var(--green-bg)' : 'var(--bg-card)',
                        transition: 'all .15s',
                      }}>
                        <input
                          type={isMulti ? 'checkbox' : 'radio'}
                          name={`q-${q.id}`}
                          checked={isSelected}
                          onChange={() => isMulti ? toggleMulti(q.id, opt.id) : setSingle(q.id, opt.id)}
                          style={{ accentColor: '#22c55e' }}
                        />
                        <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {q.question_type === 'text' && (
                <textarea
                  value={(answers[q.id] as string) ?? ''}
                  onChange={(e) => setText(q.id, e.target.value)}
                  rows={4}
                  placeholder="Напишите ваш ответ..."
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

          {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <button type="submit" disabled={sending} style={{
            width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
            background: sending ? 'var(--bg-secondary)' : 'linear-gradient(135deg,#22c55e,#0ea5e9)',
            color: '#fff', fontSize: 16, fontWeight: 700,
            cursor: sending ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Send size={18} /> {sending ? 'Отправка…' : 'Отправить ответы'}
          </button>
        </form>
      </div>
    </div>
  );
}