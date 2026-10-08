import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Если уже залогинен — перенаправляем
  useEffect(() => {
    const token = localStorage.getItem('ecocity_token');
    if (token) navigate('/', { replace: true });
  }, [navigate]);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, background: '#1e293b', borderRadius: 16, color: '#f1f5f9' }}>
      <h2 style={{ marginBottom: 20 }}>{isRegister ? 'Регистрация' : 'Вход'}</h2>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', marginBottom: 16 }}
        />

        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>
          Пароль
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', marginBottom: 16 }}
        />

        {error && (
          <div style={{ color: '#ef4444', marginBottom: 16, fontSize: 13 }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: 12, borderRadius: 8, border: 'none',
            background: loading ? '#475569' : '#22c55e',
            color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 12,
          }}
        >
          {loading ? 'Подождите...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </form>

      <button
        onClick={() => { setIsRegister(!isRegister); setError(''); }}
        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
      >
        {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
      </button>
    </div>
  );
}