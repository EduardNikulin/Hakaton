import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Calendar, Settings, FileText, CheckCircle } from 'lucide-react';
import { authApi } from '../api/auth';
import { api } from '../api/client';
import Header from '../components/Header';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authApi.me(),
      api.get('/feedback/reports/my').catch(() => []),
    ])
      .then(([me, reports]) => {
        setUser(me);
        setMyReports(Array.isArray(reports) ? reports : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (err.message?.includes('401')) navigate('/login');
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <>
        <Header />
        <div style={{
          minHeight: 'calc(100vh - 64px)', background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}>
          Загрузка профиля...
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <div style={{
          minHeight: 'calc(100vh - 64px)', background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}>
          Не удалось загрузить профиль.{' '}
          <a href="/login" style={{ color: '#22c55e', marginLeft: 8 }}>Войти</a>
        </div>
      </>
    );
  }

  const roleLabel = {
    resident: 'Житель',
    author: 'Автор опросов',
    admin: 'Администратор',
    guest: 'Гость',
  }[user.role] ?? user.role;

  const formatDate = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <Header />
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        background: 'var(--bg)',
        padding: '24px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Шапка профиля */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)',
            borderRadius: 20,
            padding: '28px 32px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            color: '#fff',
            boxShadow: '0 8px 24px rgba(34, 197, 94, 0.25)',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: 'rgba(255,255,255,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Mail size={32} />
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingRight: 60 }}>
              <h1 style={{
                fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 10,
                letterSpacing: '-0.01em',
              }}>
                {user.email?.split('@')[0] ?? 'Пользователь'}
              </h1>
              <div style={{
                display: 'flex', gap: 18, flexWrap: 'wrap',
                fontSize: 13, opacity: 0.95,
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} /> {user.email}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} /> {roleLabel}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/profile/settings')}
              style={{
                position: 'absolute', top: 20, right: 20,
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(255,255,255,0.22)',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff',
                transition: 'background .2s',
              }}
              title="Настройки"
            >
              <Settings size={18} />
            </button>
          </div>

          {/* Две колонки */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
            gap: 20,
          }}>
            {/* Мои жалобы */}
            <div style={{
              background: 'var(--bg-card)', borderRadius: 20, padding: 24,
              border: '1px solid var(--border)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
              }}>
                <FileText size={18} color="#22c55e" />
                <h2 style={{
                  fontSize: 16, fontWeight: 600, margin: 0,
                  color: 'var(--text-primary)',
                }}>
                  Мои жалобы
                </h2>
                <span style={{
                  fontSize: 12, padding: '2px 10px', borderRadius: 8,
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)', fontWeight: 600,
                }}>
                  {myReports.length}
                </span>
              </div>

              {myReports.length === 0 ? (
                <p style={{
                  fontSize: 13, color: 'var(--text-muted)',
                  padding: '16px 0', margin: 0,
                }}>
                  Пока нет жалоб. Нажмите «Сообщить о проблеме» на карте.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {myReports.map((r) => (
                    <div key={r.id} style={{
                      padding: 14, borderRadius: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: 6,
                      }}>
                        <div style={{
                          fontSize: 14, fontWeight: 600,
                          color: 'var(--text-primary)', textTransform: 'capitalize',
                        }}>
                          {r.category}
                        </div>
                        <div style={{
                          fontSize: 10, fontWeight: 600,
                          padding: '2px 8px', borderRadius: 6,
                          background: r.status === 'NEW' ? '#dbeafe'
                            : r.status === 'IN_PROGRESS' ? '#fef3c7'
                            : '#dcfce7',
                          color: r.status === 'NEW' ? '#1e40af'
                            : r.status === 'IN_PROGRESS' ? '#92400e'
                            : '#166534',
                        }}>
                          {r.status}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
                      }}>
                        {r.description || r.text}
                      </div>
                      <div style={{
                        fontSize: 11, color: 'var(--text-muted)', marginTop: 8,
                      }}>
                        {formatDate(r.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* О вас */}
            <div style={{
              background: 'var(--bg-card)', borderRadius: 20, padding: 24,
              border: '1px solid var(--border)', alignSelf: 'start',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
              }}>
                <CheckCircle size={18} color="#0ea5e9" />
                <h2 style={{
                  fontSize: 16, fontWeight: 600, margin: 0,
                  color: 'var(--text-primary)',
                }}>
                  О вас
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    РОЛЬ
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {roleLabel}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    СТАТУС
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    color: user.is_active ? '#22c55e' : '#ef4444',
                  }}>
                    ● {user.is_active ? 'Активен' : 'Заблокирован'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    ID ПОЛЬЗОВАТЕЛЯ
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    #{user.id}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}