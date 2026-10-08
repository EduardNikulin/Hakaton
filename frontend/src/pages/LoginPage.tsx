import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--bg)', color: 'var(--text-primary)', marginBottom: 16,
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, color: 'var(--text-primary)' }}>
      <h2 style={{ marginBottom: 20 }}>Вход</h2>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          Email
        </label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />

        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          Пароль
        </label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} />

        {error && <div style={{ color: '#ef4444', marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <button type="submit" disabled={loading}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none',
            background: loading ? 'var(--bg-secondary)' : '#22c55e',
            color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 12 }}>
          {loading ? 'Подождите...' : 'Войти'}
        </button>
      </form>

      <Link to="/register"
        style={{ display: 'block', textAlign: 'center', padding: 10, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14 }}>
        Нет аккаунта? Зарегистрироваться
      </Link>
    </div>
  );
}