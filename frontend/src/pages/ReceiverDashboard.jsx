import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import NotificationBell from '../components/NotificationBell';

export default function ReceiverDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const d = await api.get('/donation');
    setDonations(d.data);
    const r = await api.get('/request/mine');
    setRequests(r.data);
    const v = await api.get('/deliveries/receiver');
    setDeliveries(v.data);
  };

  useEffect(() => { load(); }, []);

  const requestFood = async (donationId) => {
    const message = window.prompt('Message for the donor (optional):', 'We need this food');
    if (message === null) return;
    try {
      await api.post('/request', { donation: donationId, message });
      setMsg('Request sent');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  const cancel = async (id) => {
    try {
      await api.delete(`/request/${id}`);
      setMsg('Request cancelled');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  const logout = () => { localStorage.clear(); navigate('/login'); };

  const box = { border: '1px solid #ccc', padding: 8, marginBottom: 6 };
  const isError = msg.includes('Error') || msg.includes('not') || msg.includes('E11000');

  return (
    <div style={{ maxWidth: 800, margin: '20px auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Agent Dashboard - {user.name}</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <NotificationBell />
          <button onClick={logout}>Logout</button>
        </div>
      </div>
      {msg && <p style={{ color: isError ? 'red' : 'green' }}>{msg}</p>}

      <h3>Available Food</h3>
      {donations.length === 0 && <p>No food available right now.</p>}
      {donations.map((d) => (
        <div key={d._id} style={box}>
          <b>{d.title}</b> ({d.category}) - Qty {d.quantity} {d.isUrgent && '🔥 URGENT'}
          <br />Pickup: {d.pickupLocation} | Donor: {d.donor?.name}
          <br />Expires: {new Date(d.expiryTime).toLocaleString()}
          <div><button onClick={() => requestFood(d._id)}>Request this food</button></div>
        </div>
      ))}

      <h3>My Requests</h3>
      {requests.length === 0 && <p>No requests yet.</p>}
      {requests.map((r) => (
        <div key={r._id} style={box}>
          <b>{r.donation?.title}</b> - Status: {r.status}
          {r.status === 'pending' && (
            <button style={{ marginLeft: 8 }} onClick={() => cancel(r._id)}>Cancel</button>
          )}
        </div>
      ))}

      <h3>My Deliveries</h3>
      {deliveries.length === 0 && <p>No deliveries yet.</p>}
      {deliveries.map((v) => (
        <div key={v._id} style={box}>
          <b>{v.donation?.title}</b> - Agent: {v.agent?.name} ({v.agent?.phone})
          <br />Status: {v.status}
          {v.status !== 'delivered'
            ? <p>Give this OTP to the agent on delivery: <b style={{ fontSize: 20 }}>{v.otp}</b></p>
            : <p>Delivered successfully</p>}
        </div>
      ))}
    </div>
  );
}