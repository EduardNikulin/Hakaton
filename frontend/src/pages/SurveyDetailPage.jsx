import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import { surveysApi } from '../api/surveys';
import { useAuth } from '../hooks/useAuth';

export default function SurveyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // answers: { [questionId]: optionId (для radio) | text (для text) }
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    surveysApi.getAll()
      .then((list) => {
        const found = Array.isArray(list)
          ? list.find((s) => String(s.id) === String(id))
          : null;
        if (!found) throw new Error('Опрос не найден');
        setSurvey(found);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // Для radio — храним option.id
  const handleOptionAnswer = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  // Для text — храним строку
  const handleTextAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        answers: survey.questions.map((q) => {
          const value = answers[q.id];

          if (q.question_type === 'text') {
            return {
              question_id: q.id,
              option_id: null,
              text_answer: (value ?? '').trim() || null,
            };
          }

          // single_choice / multi_choice (пока только один вариант)
          return {
            question_id: q.id,
            option_id: typeof value === 'number' ? value : null,
            text_answer: null,
          };
        }),
      };

      await surveysApi.submitAnswers(survey.id, payload);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div style={{
          minHeight: 'calc(100vh - 64px)', background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}>
          Загрузка...
        </div>
      </>
    );
  }

  if (error || !survey) {
    return (
      <>
        <Header />
        <div style={{
          minHeight: 'calc(100vh - 64px)', background: 'var(--bg)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <h2 style={{ color: 'var(--text-primary)' }}>Опрос не найден</h2>
          <Link to="/surveys" style={{ color: '#22c55e', marginTop: 16 }}>
            ← Вернуться к опросам
          </Link>
        </div>
      </>
    );
  }

  const isActive = survey.is_active;

  if (submitted) {
    return (
      <>
        <Header />
        <div style={{
          minHeight: 'calc(100vh - 64px)', background: 'var(--bg)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 24, textAlign: 'center',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--green-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}>
            <CheckCircle size={48} color="#22c55e" />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Спасибо за участие!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 400 }}>
            Ваши ответы помогут улучшить экологическую обстановку
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/surveys" style={{
              padding: '12px 24px', borderRadius: 12, textDecoration: 'none',
              background: '#22c55e', color: '#fff', fontWeight: 600,
            }}>
              Все опросы
            </Link>
            <button onClick={() => navigate('/')} style={{
              padding: '12px 24px', borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              fontWeight: 600, cursor: 'pointer',
            }}>
              На главную
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--bg)', transition: 'background .3s' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
          <Link to="/surveys" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'var(--text-secondary)', textDecoration: 'none',
            fontSize: 14, marginBottom: 20, fontWeight: 500,
          }}>
            <ArrowLeft size={16} /> Назад к опросам
          </Link>

          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: 32,
            border: '1px solid var(--border)',
          }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
              {survey.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 24, lineHeight: 1.5 }}>
              {survey.description}
            </p>

            <div style={{ height: 1, background: 'var(--border)', marginBottom: 32 }} />

            <form onSubmit={handleSubmit}>
              {survey.questions.map((q, qi) => (
                <div key={q.id} style={{ marginBottom: 28 }}>
                  <label style={{
                    display: 'block', fontWeight: 600, fontSize: 15,
                    marginBottom: 12, color: 'var(--text-primary)',
                  }}>
                    {qi + 1}. {q.text}
                  </label>

                  {(q.question_type === 'single_choice' || q.question_type === 'multi_choice') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.options.map((opt) => {
                        const isSelected = answers[q.id] === opt.id;
                        return (
                          <label key={opt.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                            border: `2px solid ${isSelected ? '#22c55e' : 'var(--border)'}`,
                            background: isSelected ? 'var(--green-bg)' : 'var(--bg-card)',
                            transition: 'all .15s',
                          }}>
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={isSelected}
                              onChange={() => handleOptionAnswer(q.id, opt.id)}
                              style={{ accentColor: '#22c55e' }}
                            />
                            <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                              {opt.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.question_type === 'text' && (
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                      rows={4}
                      maxLength={1000}
                      placeholder="Напишите ваш ответ..."
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        border: '2px solid var(--border)', fontSize: 14, outline: 'none',
                        fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical',
                        background: 'var(--bg)', color: 'var(--text-primary)',
                      }}
                    />
                  )}
                </div>
              ))}

              {submitError && (
                <div style={{
                  background: 'var(--red-bg)', color: '#ef4444',
                  padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 16,
                }}>
                  {submitError}
                </div>
              )}

              {!isAuthenticated && (
                <div style={{
                  background: 'var(--blue-bg)', color: '#1e40af',
                  padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 16,
                }}>
                  Войдите, чтобы отправить ответы.{' '}
                  <Link to="/login" style={{ color: '#1e40af', fontWeight: 600 }}>
                    Войти
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={!isActive || submitting}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                  background: isActive && !submitting
                    ? 'linear-gradient(135deg,#22c55e,#0ea5e9)'
                    : '#d1d5db',
                  color: '#fff', fontSize: 16, fontWeight: 700,
                  cursor: isActive && !submitting ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Send size={18} />
                {submitting ? 'Отправляем...' : isActive ? 'Отправить ответы' : 'Опрос завершён'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}