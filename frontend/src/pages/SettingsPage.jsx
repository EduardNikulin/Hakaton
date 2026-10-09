import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Palette, Check } from 'lucide-react';
import { authApi } from '../api/auth';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    authApi.me().then(setUser).catch(() => navigate('/login'));
  }, [navigate]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputStyle = {
    width: '100%', padding: '12px', borderRadius: 10, fontSize: 14,
    background: 'var(--bg-secondary)', color: 'var(--text-primary)',
    border: '1px solid var(--border)', boxSizing: 'border-box',
    opacity: 0.7, cursor: 'not-allowed',
  };

  const section = {
    background: 'var(--bg-card)', borderRadius: 16, padding: 24,
    border: '1px solid var(--border)', marginBottom: 16,
  };

  const sectionTitle = {
    fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
    color: 'var(--text-muted)', textTransform: 'uppercase',
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
  };

  const row = {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '14px 0', borderBottom: '1px solid var(--border)',
  };

  const label = {
    flex: 1, fontSize: 14, color: 'var(--text-primary)',
  };

  if (!user) {
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

  const roleLabel = {
    resident: 'Житель',
    author: 'Автор опросов',
    admin: 'Администратор',
  }[user.role] ?? user.role;

  return (
    <>
      <Header />
      <div style={{
        minHeight: 'calc(100vh - 64px)', background: 'var(--bg)',
        padding: '24px 24px 48px',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          <Link
            to="/profile"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--text-secondary)', fontSize: 13,
              textDecoration: 'none', marginBottom: 24,
            }}
          >
            <ArrowLeft size={16} /> Назад к профилю
          </Link>

          <h1 style={{
            fontSize: 28, fontWeight: 700, marginBottom: 24,
            color: 'var(--text-primary)',
          }}>
            ⚙️ Настройки
          </h1>

          {/* Профиль */}
          <div style={section}>
            <div style={sectionTitle}>
              <User size={14} /> Профиль
            </div>

            <div style={row}>
              <span style={label}>Email</span>
              <input
                type="text"
                value={user.email}
                readOnly
                style={{ ...inputStyle, width: 260 }}
              />
            </div>

            <div style={{ ...row, borderBottom: 'none' }}>
              <span style={label}>Роль</span>
              <input
                type="text"
                value={roleLabel}
                readOnly
                style={{ ...inputStyle, width: 260 }}
              />
            </div>
          </div>

          {/* Внешний вид */}
          <div style={section}>
            <div style={sectionTitle}>
              <Palette size={14} /> Внешний вид
            </div>

            <div style={{ ...row, borderBottom: 'none' }}>
              <span style={label}>Тема оформления</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { value: 'light', label: 'Светлая', emoji: '☀️' },
                  { value: 'dark',  label: 'Тёмная',  emoji: '🌙' },
                  { value: 'auto',  label: 'Авто',    emoji: '🌗' },
                ].map(({ value, label: lbl, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    type="button"
                    style={{
                      padding: '8px 14px', borderRadius: 10, fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: theme === value ? 'var(--accent, #22c55e)' : 'var(--bg-secondary)',
                      color: theme === value ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer', fontWeight: 500,
                    }}
                  >
                    <span>{emoji}</span> {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Кнопка Сохранить */}
          <button
            onClick={handleSave}
            style={{
              width: '100%', padding: 16, borderRadius: 14,
              background: saved
                ? '#22c55e'
                : 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)',
              color: '#fff', border: 'none', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .2s',
            }}
          >
            {saved ? (
              <>
                <Check size={18} /> Сохранено
              </>
            ) : (
              'Сохранить изменения'
            )}
          </button>

        </div>
      </div>
    </>
  );
}