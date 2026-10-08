export default function StatCard({ icon, label, value, color = '#3b82f6' }) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 16, padding: '20px 24px',
      boxShadow: '0 1px 3px var(--shadow)',
      display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 200,
      transition: 'background .3s',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, fontSize: 22,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}