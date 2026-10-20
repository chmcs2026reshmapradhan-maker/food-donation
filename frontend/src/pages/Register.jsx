import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'donor', phone: '', address: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 16 }}>
      <h2>Register</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        <input name="name" placeholder="Name" onChange={change} required />
        <input name="email" type="email" placeholder="Email" onChange={change} required />
        <input name="password" type="password" placeholder="Password" onChange={change} required />
        <select name="role" value={form.role} onChange={change}>
          <option value="donor">Donor</option>
          <option value="receiver">Receiver / NGO</option>
          <option value="agent">Delivery Agent</option>
        </select>
        <input name="phone" placeholder="Phone" onChange={change} />
        <input name="address" placeholder="Address" onChange={change} />
        <button type="submit">Register</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}