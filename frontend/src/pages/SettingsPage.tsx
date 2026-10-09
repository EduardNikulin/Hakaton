import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme, type ThemeMode } from '../context/ThemeContext';

const THEME_OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: 'light', label: '☀️ Светлая' },
  { key: 'dark', label: '🌙 Тёмная' },
  { key: 'auto', label: '🔄 Авто' },
];

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [notify, setNotify] = useState({
    notify_new_surveys: user?.notify_new_surveys ?? true,
    notify_results: user?.notify_results ?? true,
    notify_pollution: user?.notify_pollution ?? false,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg('');
    setProfileError('');
    try {
      const updated = await authApi.updateMe({ full_name: fullName.trim() || null, ...notify });
      updateUser(updated);
      setProfileMsg('Изменения сохранены');
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPassMsg('');
    setPassError('');
    if (newPass.length < 6) { setPassError('Новый пароль — минимум 6 символов'); return; }
    setSavingPass(true);
    try {
      await authApi.changePassword(oldPass, newPass);
      setPassMsg('Пароль успешно изменён');
      setOldPass(''); setNewPass('');
    } catch (e) {
      setPassError(e instanceof Error ? e.message : 'Ошибка смены пароля');
    } finally {
      setSavingPass(false);
    }
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4,
  };
  const card: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 16, overflow: 'hidden', marginBottom: 28,
  };
  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', borderBottom: '1px solid var(--border)', gap: 12,
  };
  const rowLast: React.CSSProperties = { ...row, borderBottom: 'none' };
  const label: React.CSSProperties = { fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 };
  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--bg)', color: 'var(--text-primary)', fontSize: 14,
    outline: 'none', width: 220, boxSizing: 'border-box',
  };
  const hint: React.CSSProperties = { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Link to="/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
        color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, marginBottom: 20, fontWeight: 500 }}>
        <ArrowLeft size={16} /> Назад к профилю
      </Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 28, color: 'var(--text-primary)' }}>
        ⚙️ Настройки
      </h1>

      {/* Профиль */}
      <div style={sectionTitle}>👤 Профиль</div>
      <div style={card}>
        <div style={row}>
          <span style={label}>Имя</span>
          <input style={inputStyle} value={fullName} placeholder="Как к вам обращаться"
            onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div style={rowLast}>
          <span style={label}>Email</span>
          <span style={{ ...inputStyle, width: 'auto', textAlign: 'right', color: 'var(--text-secondary)' }}>
            {user?.email}
          </span>
        </div>
      </div>

      {/* Внешний вид */}
      <div style={sectionTitle}>🎨 Внешний вид</div>
      <div style={card}>
        <div style={rowLast}>
          <span style={label}>Тема оформления</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {THEME_OPTIONS.map((opt) => (
              <button key={opt.key} onClick={() => setTheme(opt.key)}
                style={{ padding: '8px 14px', borderRadius: 10, border: 'none', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer',
                  background: theme === opt.key ? '#22c55e' : 'var(--bg-secondary)',
                  color: theme === opt.key ? '#fff' : 'var(--text-secondary)', transition: 'all .2s' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Уведомления */}
      <div style={sectionTitle}>🔔 Уведомления</div>
      <div style={card}>
        {([
          ['notify_new_surveys', 'Новые опросы', 'Получать уведомления при публикации нового опроса'],
          ['notify_results', 'Результаты опросов', 'Уведомление, когда опрос завершён'],
          ['notify_pollution', 'Изменения загрязнения', 'Предупреждение при росте AQI'],
        ] as const).map(([key, title, desc], i, arr) => (
          <div key={key} style={i === arr.length - 1 ? rowLast : row}>
            <div>
              <div style={label}>{title}</div>
              <div style={hint}>{desc}</div>
            </div>
            <button
              className={`toggle ${notify[key] ? 'active' : ''}`}
              aria-pressed={notify[key]}
              onClick={() => setNotify((p) => ({ ...p, [key]: !p[key] }))}
            />
          </div>
        ))}
      </div>

      {profileMsg && <div style={{ color: '#22c55e', fontSize: 13, marginBottom: 12 }}>{profileMsg}</div>}
      {profileError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{profileError}</div>}

      <button onClick={handleSaveProfile} disabled={savingProfile}
        style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
          background: savingProfile ? 'var(--bg-secondary)' : 'linear-gradient(135deg,#22c55e,#0ea5e9)',
          color: '#fff', fontSize: 16, fontWeight: 700, cursor: savingProfile ? 'not-allowed' : 'pointer',
          marginBottom: 32 }}>
        {savingProfile ? 'Сохранение…' : '💾 Сохранить изменения'}
      </button>

      {/* Смена пароля */}
      <div style={sectionTitle}>🔒 Смена пароля</div>
      <div style={card}>
        <div style={row}>
          <span style={label}>Старый пароль</span>
          <div style={{ position: 'relative' }}>
            <input type={showOld ? 'text' : 'password'} value={oldPass}
              onChange={(e) => setOldPass(e.target.value)} placeholder="••••••••"
              style={{ ...inputStyle, paddingRight: 36 }} />
            <button type="button" onClick={() => setShowOld(!showOld)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div style={rowLast}>
          <span style={label}>Новый пароль</span>
          <div style={{ position: 'relative' }}>
            <input type={showNew ? 'text' : 'password'} value={newPass}
              onChange={(e) => setNewPass(e.target.value)} placeholder="••••••••"
              style={{ ...inputStyle, paddingRight: 36 }} />
            <button type="button" onClick={() => setShowNew(!showNew)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {passMsg && <div style={{ color: '#22c55e', fontSize: 13, marginBottom: 12 }}>{passMsg}</div>}
      {passError && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{passError}</div>}

      <button onClick={handleChangePassword} disabled={savingPass || !oldPass || !newPass}
        style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: '1px solid var(--border)',
          background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 15, fontWeight: 600,
          cursor: savingPass || !oldPass || !newPass ? 'not-allowed' : 'pointer' }}>
        {savingPass ? 'Смена…' : 'Изменить пароль'}
      </button>
    </div>
  );
}