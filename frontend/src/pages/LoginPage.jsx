import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (em, pw) => {
    setEmail(em);
    setPassword(pw);
  };

  const inputStyle = {
    width: '100%', padding: 12, borderRadius: 10, fontSize: 14,
    background: 'var(--bg-secondary)', color: 'var(--text-primary)',
    border: '1px solid var(--border)', boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: 13, color: 'var(--text-secondary)',
    display: 'block', marginBottom: 6,
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
        <h1 style={{ fontSize: 24, marginBottom: 8, color: 'var(--text-primary)' }}>
          Вход в EcoCity
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Войдите, чтобы отправлять жалобы и участвовать в опросах
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {/* Пароль с глазом */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Пароль</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ ...inputStyle, padding: '12px 44px 12px 12px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', padding: 4,
                  display: 'flex', alignItems: 'center',
                  color: 'var(--text-muted)',
                }}
                tabIndex={-1}
                title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        {/* Ссылка на регистрацию */}
        <p style={{
          marginTop: 20, textAlign: 'center',
          fontSize: 13, color: 'var(--text-secondary)',
        }}>
          Нет аккаунта?{' '}
          <Link to="/register" style={{ color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>
            Зарегистрироваться
          </Link>
        </p>

        {/* Тестовые аккаунты */}
        <div style={{
          marginTop: 24, paddingTop: 24,
          borderTop: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Тестовые аккаунты (нажми, чтобы подставить):
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Житель',        email: 'resident@ecocity.local', pw: 'Resident123!' },
              { label: 'Автор опросов', email: 'author@ecocity.local',   pw: 'Author123!'   },
              { label: 'Админ',         email: 'admin@ecocity.local',    pw: 'Admin123!'    },
            ].map(({ label, email: em, pw }) => (
              <button
                key={em}
                type="button"
                onClick={() => quickLogin(em, pw)}
                style={{
                  padding: 10, borderRadius: 8, fontSize: 12,
                  background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <b>{label}</b> · {em}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}