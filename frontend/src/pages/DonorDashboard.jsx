import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import NotificationBell from '../components/NotificationBell';

export default function DonorDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [agents, setAgents] = useState([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    title: '', category: '', quantity: '', expiryTime: '',
    pickupLocation: '', description: '', isUrgent: false
  });

  const load = async () => {
    const d = await api.get('/donation/mine');
    setDonations(d.data);
    const r = await api.get('/request/incoming');
    setRequests(r.data);
    const a = await api.get('/deliveries/agents/available');
    setAgents(a.data);
  };

  useEffect(() => { load(); }, []);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const postFood = async (e) => {
    e.preventDefault();
    try {
      await api.post('/donation', { ...form, quantity: Number(form.quantity) });
      setMsg('Donation posted');
      setForm({ title: '', category: '', quantity: '', expiryTime: '', pickupLocation: '', description: '', isUrgent: false });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  const decide = async (id, action) => {
    try {
      await api.put(`/request/${id}/${action}`);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  const assign = async (requestId, agentId) => {
    if (!agentId) return;
    try {
      await api.post('/deliveries', { requestId, agentId });
      setMsg('Agent assigned');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  const removeDonation = async (id) => {
    await api.delete(`/donation/${id}`);
    load();
  };

  const logout = () => { localStorage.clear(); navigate('/login'); };

  return (
    <div style={{ maxWidth: 800, margin: '20px auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <h2>Donor Dashboard - {user.name}</h2>
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <NotificationBell />
    <button onClick={logout}>Logout</button>
  </div>
</div>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}

      <h3>Post Food</h3>
      <form onSubmit={postFood} style={{ display: 'grid', gap: 8 }}>
        <input name="title" placeholder="Title" value={form.title} onChange={change} required />
        <input name="category" placeholder="Category (e.g. Cooked food)" value={form.category} onChange={change} required />
        <input name="quantity" type="number" placeholder="Quantity" value={form.quantity} onChange={change} required />
        <label>Expiry time</label>
        <input name="expiryTime" type="datetime-local" value={form.expiryTime} onChange={change} required />
        <input name="pickupLocation" placeholder="Pickup location" value={form.pickupLocation} onChange={change} required />
        <input name="description" placeholder="Description" value={form.description} onChange={change} />
        <label><input name="isUrgent" type="checkbox" checked={form.isUrgent} onChange={change} /> Urgent</label>
        <button type="submit">Post</button>
      </form>

      <h3>My Donations</h3>
      {donations.length === 0 && <p>No donations yet.</p>}
      {donations.map((d) => (
        <div key={d._id} style={{ border: '1px solid #ccc', padding: 8, marginBottom: 6 }}>
          <b>{d.title}</b> ({d.category}) - Qty {d.quantity} {d.isUrgent && '🔥 URGENT'}
          <br />Status: {d.status} | Expires: {new Date(d.expiryTime).toLocaleString()}
          {d.status === 'available' && <button style={{ marginLeft: 8 }} onClick={() => removeDonation(d._id)}>Delete</button>}
        </div>
      ))}

      <h3>Incoming Requests</h3>
      {requests.length === 0 && <p>No requests yet.</p>}
      {requests.map((r) => (
        <div key={r._id} style={{ border: '1px solid #ccc', padding: 8, marginBottom: 6 }}>
          <b>{r.donation?.title}</b> requested by {r.receiver?.name} ({r.receiver?.phone})
          <br />Message: {r.message} | Status: {r.status}
          {r.status === 'pending' && (
            <div>
              <button onClick={() => decide(r._id, 'approve')}>Approve</button>
              <button onClick={() => decide(r._id, 'reject')} style={{ marginLeft: 6 }}>Reject</button>
            </div>
          )}
          {r.status === 'approved' && (
            <select defaultValue="" onChange={(e) => assign(r._id, e.target.value)}>
              <option value="">Assign agent...</option>
              {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}