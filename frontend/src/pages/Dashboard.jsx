import { useNavigate } from 'react-router-dom';

export default function Dashboard({ role }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>{role} Dashboard</h2>
      <p>Welcome, {user.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}