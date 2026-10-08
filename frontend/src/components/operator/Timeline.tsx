const TYPE_COLOR: Record<string, string> = {
  trigger: '#f87171',
  info: '#3b82f6',
  resolve: '#34d399',
  default: '#3b82f6',
};

export interface TimelineItem {
  time: string;
  event: string;
  type: string;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <div style={{ color: '#64748b', fontSize: 13 }}>Нет событий</div>;
  }
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, position: 'relative' }}>
      {/* Вертикальная линия */}
      <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: '#334155' }} />
      {items.map((it, idx) => (
        <li key={idx} style={{ position: 'relative', paddingLeft: 26, paddingBottom: 16 }}>
          <span style={{ position: 'absolute', left: 0, top: 3, width: 16, height: 16,
            borderRadius: '50%', background: TYPE_COLOR[it.type] ?? TYPE_COLOR.default,
            border: '3px solid #0f172a' }} />
          <div style={{ fontSize: 13, color: '#f1f5f9' }}>{it.event}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {new Date(it.time).toLocaleString('ru-RU')}
          </div>
        </li>
      ))}
    </ol>
  );
}