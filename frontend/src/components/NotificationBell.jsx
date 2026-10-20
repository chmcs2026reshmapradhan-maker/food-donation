import { useEffect, useState } from 'react';
import api from '../api';

export default function NotificationBell() {
  const [data, setData] = useState({ items: [], unread: 0 });
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/notifications');
      setData(res.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && data.unread > 0) {
      await api.put('/notifications/read-all');
      setTimeout(load, 1500); // keep "new" highlight visible briefly
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={toggle}>
        🔔{data.unread > 0 && <b style={{ color: 'red' }}> {data.unread}</b>}
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 34, width: 300, maxHeight: 320, overflowY: 'auto',
          background: '#fff', color: '#000', border: '1px solid #ccc', padding: 8, zIndex: 10
        }}>
          {data.items.length === 0 && <p>No notifications</p>}
          {data.items.map((n) => (
            <div key={n._id} style={{ borderBottom: '1px solid #eee', padding: '6px 0', background: n.read ? 'transparent' : '#fff7d6' }}>
              <div>{n.message}</div>
              <small>{new Date(n.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}