import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: 10, borderRadius: 8, border: '1px solid #334155',
    background: '#0f172a', color: '#f1f5f9', marginBottom: 16,
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, background: '#1e293b', borderRadius: 16, color: '#f1f5f9' }}>
      <h2 style={{ marginBottom: 20 }}>Регистрация</h2>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />

        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Пароль</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} />

        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>Повторите пароль</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} style={inputStyle} />

        {error && <div style={{ color: '#ef4444', marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <button type="submit" disabled={loading}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none',
            background: loading ? '#475569' : '#22c55e', color: '#fff', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 12 }}>
          {loading ? 'Подождите...' : 'Зарегистрироваться'}
        </button>
      </form>

      <Link to="/login" style={{ display: 'block', textAlign: 'center', color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>
        Уже есть аккаунт? Войти
      </Link>
    </div>
  );
}