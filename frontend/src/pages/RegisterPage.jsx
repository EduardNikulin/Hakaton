import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Не удалось зарегистрироваться');
      }

      const loginBody = new URLSearchParams();
      loginBody.append('username', email);
      loginBody.append('password', password);

      const loginRes = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody.toString(),
      });

      if (loginRes.ok) {
        const data = await loginRes.json();
        localStorage.setItem('token', data.access_token);
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 44px 12px 12px', borderRadius: 10, fontSize: 14,
    background: 'var(--bg-secondary)', color: 'var(--text-primary)',
    border: '1px solid var(--border)', boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: 13, color: 'var(--text-secondary)',
    display: 'block', marginBottom: 6,
  };

  const eyeButtonStyle = {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 20, padding: 32,
        width: 420, maxWidth: '100%',
        boxShadow: '0 8px 32px var(--shadow-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#22c55e,#0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <Leaf size={20} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            Eco<span style={{ color: '#22c55e' }}>City</span>
          </span>
        </div>

        <h1 style={{ fontSize: 24, marginBottom: 8, marginTop: 16, color: 'var(--text-primary)' }}>
          Регистрация
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Создайте аккаунт жителя, чтобы отправлять жалобы и участвовать в опросах
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ ...inputStyle, paddingRight: 12 }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Пароль</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
                placeholder="минимум 6 символов"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={eyeButtonStyle}
                tabIndex={-1}
                title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Повторите пароль</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                style={eyeButtonStyle}
                tabIndex={-1}
                title={showConfirm ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'var(--red-bg)', color: '#ef4444',
              padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 14, borderRadius: 10,
              background: '#22c55e', color: 'white',
              border: 'none', fontSize: 15, fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p style={{
          marginTop: 20, textAlign: 'center',
          fontSize: 13, color: 'var(--text-secondary)',
        }}>
          Уже есть аккаунт?{' '}
          <Link to="/login" style={{ color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}