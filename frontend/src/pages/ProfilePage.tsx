import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return <div style={{ color: '#94a3b8', padding: 40 }}>Загрузка...</div>;
  }

  const roleLabels: Record<string, string> = {
    resident: 'Житель',
    author: 'Автор / Эколог',
    admin: 'Администратор',
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', background: '#1e293b', borderRadius: 16, padding: 24, color: '#f1f5f9' }}>
      <h2 style={{ marginBottom: 24 }}>Профиль</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>ID</div>
          <div style={{ fontSize: 15 }}>{user.id}</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Email</div>
          <div style={{ fontSize: 15 }}>{user.email}</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Роль</div>
          <div style={{ fontSize: 15 }}>
            {roleLabels[user.role?.toLowerCase()] ?? user.role}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Статус</div>
          <div style={{ fontSize: 15, color: user.is_active ? '#22c55e' : '#ef4444' }}>
            {user.is_active ? 'Активен' : 'Заблокирован'}
          </div>
        </div>
      </div>

      <button
        onClick={logout}
        style={{ marginTop: 24, width: '100%', padding: 12, borderRadius: 8, border: '1px solid #334155', background: '#7f1d1d', color: '#fca5a5', cursor: 'pointer' }}
      >
        Выйти
      </button>
    </div>
  );
}