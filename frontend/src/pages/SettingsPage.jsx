import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Palette, Bell, Lock, Eye, EyeOff } from 'lucide-react';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { user as mockUser } from '../data/mockData';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  // Состояние профиля
  const [name, setName] = useState(mockUser.name);
  const [email, setEmail] = useState(mockUser.email);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  // Состояние уведомлений
  const [notif, setNotif] = useState({
    newSurveys: true,
    results: true,
    pollution: false,
  });

  // Сохранение
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleNotif = (key) => {
    setNotif((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Стили
  const sectionTitle = {
    fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 8, paddingLeft: 4,
  };

  const card = {
    background: 'var(--bg-card)', borderRadius: 16,
    boxShadow: `0 1px 3px var(--shadow)`,
    overflow: 'hidden', marginBottom: 28,
  };

  const row = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', borderBottom: '1px solid var(--border)',
  };

  const rowLast = { ...row, borderBottom: 'none' };

  const label = { fontSize: 15, color: 'var(--text-primary)', fontWeight: 500 };

  const inputStyle = {
    padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--bg)', color: 'var(--text-primary)',
    fontSize: 14, outline: 'none', width: 220, textAlign: 'right',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', transition: 'background .3s' }}>
      <Header />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px' }}>
        {/* Навигация */}
        <Link to="/profile" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--text-secondary)', textDecoration: 'none',
          fontSize: 14, marginBottom: 20, fontWeight: 500,
        }}>
          <ArrowLeft size={16} /> Назад к профилю
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 28, color: 'var(--text-primary)' }}>
          ⚙️ Настройки
        </h1>

        {/* ===== СЕКЦИЯ 1: ПРОФИЛЬ ===== */}
        <div style={sectionTitle}>👤 Профиль</div>
        <div style={card}>
          <div style={row}>
            <span style={label}>Имя</span>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div style={row}>
            <span style={label}>Email</span>
            <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div style={row}>
            <span style={label}>Старый пароль</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showOldPass ? 'text' : 'password'}
                style={{ ...inputStyle, paddingRight: 36 }}
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowOldPass(!showOldPass)}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                }}
              >
                {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div style={rowLast}>
            <span style={label}>Новый пароль</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPass ? 'text' : 'password'}
                style={{ ...inputStyle, paddingRight: 36 }}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                }}
              >
                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* ===== СЕКЦИЯ 2: ВНЕШНИЙ ВИД ===== */}
        <div style={sectionTitle}>🎨 Внешний вид</div>
        <div style={card}>
          <div style={rowLast}>
            <span style={label}>Тема оформления</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { key: 'light', label: '☀️ Светлая' },
                { key: 'dark', label: '🌙 Тёмная' },
                { key: 'auto', label: '🔄 Авто' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  style={{
                    padding: '8px 14px', borderRadius: 10, border: 'none',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: theme === opt.key ? '#22c55e' : 'var(--bg-secondary)',
                    color: theme === opt.key ? '#fff' : 'var(--text-secondary)',
                    transition: 'all .2s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== СЕКЦИЯ 3: УВЕДОМЛЕНИЯ ===== */}
        <div style={sectionTitle}>🔔 Уведомления</div>
        <div style={card}>
          <div style={row}>
            <div>
              <div style={label}>Новые опросы в моём районе</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Получать email при публикации нового опроса
              </div>
            </div>
            <button
              className={`toggle ${notif.newSurveys ? 'active' : ''}`}
              onClick={() => toggleNotif('newSurveys')}
            />
          </div>
          <div style={row}>
            <div>
              <div style={label}>Результаты моих опросов</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Уведомление когда опрос завершён
              </div>
            </div>
            <button
              className={`toggle ${notif.results ? 'active' : ''}`}
              onClick={() => toggleNotif('results')}
            />
          </div>
          <div style={rowLast}>
            <div>
              <div style={label}>Изменения загрязнения</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Предупреждение при росте AQI
              </div>
            </div>
            <button
              className={`toggle ${notif.pollution ? 'active' : ''}`}
              onClick={() => toggleNotif('pollution')}
            />
          </div>
        </div>

        {/* Кнопка сохранения */}
        <button
          onClick={handleSave}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
            background: saved ? '#22c55e' : 'linear-gradient(135deg,#22c55e,#0ea5e9)',
            color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            transition: 'all .3s',
          }}
        >
          {saved ? '✅ Сохранено!' : '💾 Сохранить изменения'}
        </button>
      </div>
    </div>
  );
}