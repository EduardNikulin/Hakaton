import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return <div style={{ color: 'var(--text-secondary)', padding: 40 }}>Загрузка...</div>;
  }

  const roleLabels: Record<string, string> = {
    resident: 'Житель',
    author: 'Автор / Эколог',
    admin: 'Администратор',
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, color: 'var(--text-primary)' }}>
      <h2 style={{ marginBottom: 24 }}>Профиль</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>ID</div>
          <div style={{ fontSize: 15 }}>{user.id}</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Email</div>
          <div style={{ fontSize: 15 }}>{user.email}</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Роль</div>
          <div style={{ fontSize: 15 }}>
            {roleLabels[user.role?.toLowerCase()] ?? user.role}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Статус</div>
          <div style={{ fontSize: 15, color: user.is_active ? '#22c55e' : '#ef4444' }}>
            {user.is_active ? 'Активен' : 'Заблокирован'}
          </div>
        </div>
      </div>

      <button
        onClick={logout}
        style={{ marginTop: 24, width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--red-bg)', color: '#fca5a5', cursor: 'pointer' }}
      >
        Выйти
      </button>
    </div>
  );
}