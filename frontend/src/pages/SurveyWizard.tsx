import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { createSurvey, type QuestionCreate, type QuestionType } from '../api/surveys';

interface DraftOption { text: string }
interface DraftQuestion {
  text: string;
  question_type: QuestionType;
  options: DraftOption[];
}

const TYPE_LABEL: Record<QuestionType, string> = {
  single_choice: 'Один вариант',
  multi_choice: 'Несколько вариантов',
  text: 'Текстовый ответ',
};

export function SurveyWizard() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    { text: '', question_type: 'single_choice', options: [{ text: '' }, { text: '' }] },
  ]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateQuestion = (idx: number, patch: Partial<DraftQuestion>) =>
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));

  const addQuestion = () =>
    setQuestions((prev) => [...prev, { text: '', question_type: 'single_choice', options: [{ text: '' }, { text: '' }] }]);

  const removeQuestion = (idx: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const changeType = (idx: number, type: QuestionType) =>
    updateQuestion(idx, {
      question_type: type,
      options: type === 'text' ? [] : (questions[idx].options.length ? questions[idx].options : [{ text: '' }, { text: '' }]),
    });

  const addOption = (qIdx: number) =>
    updateQuestion(qIdx, { options: [...questions[qIdx].options, { text: '' }] });

  const removeOption = (qIdx: number, oIdx: number) =>
    updateQuestion(qIdx, { options: questions[qIdx].options.filter((_, i) => i !== oIdx) });

  const updateOption = (qIdx: number, oIdx: number, text: string) =>
    updateQuestion(qIdx, {
      options: questions[qIdx].options.map((o, i) => (i === oIdx ? { text } : o)),
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (title.trim().length < 2) { setError('Введите название опроса (мин. 2 символа)'); return; }
    if (questions.length === 0) { setError('Добавьте хотя бы один вопрос'); return; }

    for (const q of questions) {
      if (q.text.trim().length < 2) { setError('У каждого вопроса должен быть текст (мин. 2 символа)'); return; }
      if (q.question_type !== 'text') {
        const opts = q.options.map((o) => o.text.trim()).filter(Boolean);
        if (opts.length < 2) { setError('У вопроса с вариантами должно быть минимум 2 непустых варианта'); return; }
      }
    }

    const payload: QuestionCreate[] = questions.map((q) => ({
      text: q.text.trim(),
      question_type: q.question_type,
      options: q.question_type === 'text'
        ? []
        : q.options.map((o) => ({ text: o.text.trim() })).filter((o) => o.text),
    }));

    setSaving(true);
    try {
      await createSurvey({
        title: title.trim(),
        description: description.trim() || null,
        is_active: true,
        questions: payload,
      });
      navigate('/surveys');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания опроса');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)',
    background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14,
    fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <Link to="/surveys" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, marginBottom: 20, fontWeight: 500 }}>
        <ArrowLeft size={16} /> Назад к опросам
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>📋 Новый опрос</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Название</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Качество воздуха в вашем районе" style={{ ...inputStyle, marginBottom: 16 }} />

          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Описание</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="Кратко о цели опроса" style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {questions.map((q, qi) => (
          <div key={qi} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <GripVertical size={16} color="var(--text-muted)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Вопрос {qi + 1}</span>
              {questions.length > 1 && (
                <button type="button" onClick={() => removeQuestion(qi)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5' }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <input value={q.text} onChange={(e) => updateQuestion(qi, { text: e.target.value })}
              placeholder="Текст вопроса" style={{ ...inputStyle, marginBottom: 12 }} />

            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => (
                <button key={t} type="button" onClick={() => changeType(qi, t)}
                  style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                    border: q.question_type === t ? '1px solid #22c55e' : '1px solid var(--border)',
                    background: q.question_type === t ? 'var(--green-bg)' : 'transparent',
                    color: q.question_type === t ? '#22c55e' : 'var(--text-secondary)', fontWeight: 600 }}>
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>

            {q.question_type !== 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options.map((o, oi) => (
                  <div key={oi} style={{ display: 'flex', gap: 8 }}>
                    <input value={o.text} onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Вариант ${oi + 1}`} style={inputStyle} />
                    {q.options.length > 2 && (
                      <button type="button" onClick={() => removeOption(qi, oi)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', flexShrink: 0 }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addOption(qi)}
                  style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8, border: '1px dashed var(--border)',
                    background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
                  <Plus size={14} /> Добавить вариант
                </button>
              </div>
            )}
          </div>
        ))}

        <button type="button" onClick={addQuestion}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px',
            borderRadius: 10, border: '1px dashed var(--border)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, marginBottom: 24 }}>
          <Plus size={16} /> Добавить вопрос
        </button>

        {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <button type="submit" disabled={saving}
          style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
            background: saving ? 'var(--bg-secondary)' : 'linear-gradient(135deg,#22c55e,#0ea5e9)',
            color: '#fff', fontSize: 16, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Сохранение…' : 'Создать опрос'}
        </button>
      </form>
    </div>
  );
}