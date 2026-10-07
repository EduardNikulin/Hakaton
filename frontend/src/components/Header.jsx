import { Leaf } from 'lucide-react';

export default function Header() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #e5e7eb',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 24px',
        height: 64, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg,#22c55e,#0ea5e9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}>
          <Leaf size={20} />
        </div>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>
          Eco<span style={{ color: '#22c55e' }}>City</span>
        </span>
      </div>
    </header>
  );
}