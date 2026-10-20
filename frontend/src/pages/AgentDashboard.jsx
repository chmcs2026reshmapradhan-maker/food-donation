import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import NotificationBell from '../components/NotificationBell';

const STAGES = ['assigned', 'going_to_pickup', 'arrived_at_pickup', 'collected', 'out_for_delivery', 'arrived_at_receiver', 'delivered'];
const NEXT_LABEL = {
  assigned: 'Start: Going to pickup',
  going_to_pickup: 'Arrived at pickup',
  arrived_at_pickup: 'Food collected',
  collected: 'Out for delivery',
  out_for_delivery: 'Arrived at receiver'
};

export default function AgentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [deliveries, setDeliveries] = useState([]);
  const [otps, setOtps] = useState({});
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data } = await api.get('/deliveries/mine');
    setDeliveries(data);
  };

  useEffect(() => { load(); }, []);

  const next = async (id) => {
    try {
      await api.put(`/deliveries/${id}/next`);
      setMsg('Status updated');
      load();
    } catch (err) {
      setMsg('Error: ' + (err.response?.data?.message || 'failed'));
    }
  };

  const verify = async (id) => {
    try {
      await api.post(`/deliveries/${id}/verify-otp`, { otp: otps[id] });
      setMsg('Delivered successfully');
      load();
    } catch (err) {
      setMsg('Error: ' + (err.response?.data?.message || 'failed'));
    }
  };

  const logout = () => { localStorage.clear(); navigate('/login'); };
  const box = { border: '1px solid #ccc', padding: 8, marginBottom: 6 };

  return (
    <div style={{ maxWidth: 800, margin: '20px auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Agent Dashboard - {user.name}</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <NotificationBell />
          <button onClick={logout}>Logout</button>
        </div>
      </div>
      {msg && <p style={{ color: msg.startsWith('Error') ? 'red' : 'green' }}>{msg}</p>}

      <h3>My Deliveries</h3>
      {deliveries.length === 0 && <p>No deliveries assigned yet.</p>}
      {deliveries.map((d) => (
        <div key={d._id} style={box}>
          <b>{d.donation?.title}</b> - Qty {d.donation?.quantity}
          <br />Pickup: {d.donation?.pickupLocation}
          <br />Status: <b>{d.status}</b> ({STAGES.indexOf(d.status) + 1}/{STAGES.length})

          {NEXT_LABEL[d.status] && (
            <div><button onClick={() => next(d._id)}>{NEXT_LABEL[d.status]}</button></div>
          )}

          {d.status === 'arrived_at_receiver' && (
            <div>
              <input
                placeholder="Enter receiver OTP"
                value={otps[d._id] || ''}
                onChange={(e) => setOtps({ ...otps, [d._id]: e.target.value })}
              />
              <button onClick={() => verify(d._id)}>Confirm delivery</button>
            </div>
          )}

          {d.status === 'delivered' && <p>Delivered</p>}
        </div>
      ))}
    </div>
  );
}