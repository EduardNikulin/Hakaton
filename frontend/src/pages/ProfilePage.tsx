import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reportsApi } from '../api';

const ROLE_LABELS: Record<string, string> = {
  resident: 'Житель',
  author: 'Автор / Эколог',
  admin: 'Администратор',
};

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 15, color: color ?? 'var(--text-primary)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [reportsCount, setReportsCount] = useState<number | null>(null);

  useEffect(() => {
    reportsApi.fetchMyReports()
      .then((r) => setReportsCount(r.length))
      .catch(() => setReportsCount(null));
  }, []);

  if (!user) {
    return <div style={{ color: 'var(--text-secondary)', padding: 40 }}>Загрузка...</div>;
  }

  const role = (user.role ?? '').toLowerCase();
  const displayName = user.full_name || 'Без имени';

  return (
    <div style={{ maxWidth: 560, margin: '40px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Профиль</h2>
        <Link
          to="/profile/settings"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)',
            color: 'var(--text-primary)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
        >
          <Settings size={16} /> Настройки
        </Link>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 24, color: 'var(--text-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#22c55e' }}>
            {(user.full_name || user.email)[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{displayName}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Row label="ID" value={String(user.id)} />
          <Row label="Роль" value={ROLE_LABELS[role] ?? user.role} />
          <Row
            label="Статус"
            value={user.is_active ? 'Активен' : 'Заблокирован'}
            color={user.is_active ? '#22c55e' : '#ef4444'}
          />
          {user.created_at && (
            <Row label="Дата регистрации" value={new Date(user.created_at).toLocaleDateString('ru-RU')} />
          )}
          <Row label="Мои жалобы" value={reportsCount === null ? '…' : String(reportsCount)} />
        </div>
      </div>

      <Link
        to="/reports/my"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16,
          padding: 14, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)',
          color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}
      >
        <FileText size={16} /> Перейти к моим жалобам
      </Link>

      <button
        onClick={logout}
        style={{ marginTop: 16, width: '100%', padding: 12, borderRadius: 12,
          border: '1px solid var(--border)', background: 'var(--red-bg, #fef2f2)',
          color: '#fca5a5', cursor: 'pointer', fontWeight: 600 }}
      >
        Выйти
      </button>
    </div>
  );
}