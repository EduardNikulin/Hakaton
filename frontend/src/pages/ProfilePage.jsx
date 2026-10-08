import { Link } from 'react-router-dom';
import { User, Mail, Calendar, Shield, ClipboardList, MessageSquare, Settings } from 'lucide-react';
import Header from '../components/Header';
import { user, surveys, districts } from '../data/mockData';

export default function ProfilePage() {
  const mySurveys = surveys.filter((s) => user.mySurveys.includes(s.id));
  const myResponses = surveys.filter((s) => user.myResponses.includes(s.id));
  const getDistrictName = (id) => districts.find((d) => d.id === id)?.name || '—';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', transition: 'background .3s' }}>
      <Header />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Шапка профиля */}
        <div style={{
          background: 'linear-gradient(135deg,#22c55e,#0ea5e9)',
          borderRadius: 20, padding: '40px 32px', color: '#fff',
          display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32,
          boxShadow: '0 4px 24px rgba(0,0,0,.1)', position: 'relative',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <User size={40} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{user.name}</h1>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 14, opacity: 0.95, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={14} /> {user.email}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} /> С {new Date(user.joinedAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={14} /> {user.role}</span>
            </div>
          </div>

          {/* Кнопка настроек */}
          <Link to="/profile/settings" style={{
            position: 'absolute', top: 16, right: 16,
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', textDecoration: 'none', transition: 'background .2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.35)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.2)'}
          >
            <Settings size={20} />
          </Link>
        </div>

        {/* Две колонки */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Мои опросы */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px var(--shadow)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
              <ClipboardList size={18} color="#22c55e" /> Мои опросы
            </h3>
            {mySurveys.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 20 }}>Вы ещё не создали опросов</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {mySurveys.map((s) => (
                  <Link key={s.id} to={`/surveys/${s.id}`} style={{
                    display: 'block', padding: '14px 16px', borderRadius: 12,
                    background: 'var(--bg-hover)', textDecoration: 'none', transition: 'all .2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--green-bg)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                      <span>📍 {getDistrictName(s.districtId)}</span>
                      <span>· {s.responses} ответов</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Мои ответы */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px var(--shadow)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
              <MessageSquare size={18} color="#0ea5e9" /> Мои ответы
            </h3>
            {myResponses.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 20 }}>Вы ещё не участвовали в опросах</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myResponses.map((s) => (
                  <Link key={s.id} to={`/surveys/${s.id}`} style={{
                    display: 'block', padding: '14px 16px', borderRadius: 12,
                    background: 'var(--bg-hover)', textDecoration: 'none', transition: 'all .2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--blue-bg)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                      <span>📍 {getDistrictName(s.districtId)}</span>
                      <span>· {s.status === 'active' ? 'Активен' : 'Завершён'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}