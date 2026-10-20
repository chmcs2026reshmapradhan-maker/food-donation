import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DonorDashboard from './pages/DonorDashboard';
import ReceiverDashboard from './pages/ReceiverDashboard';
import AgentDashboard from './pages/AgentDashboard';

function Protected({ role, children }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user || user.role !== role) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/donor" element={<Protected role="donor"><DonorDashboard /></Protected>} />
        <Route path="/receiver" element={<Protected role="receiver"><ReceiverDashboard /></Protected>} />
        <Route path="/agent" element={<Protected role="agent"><AgentDashboard/></Protected>} />
        {[ 'admin'].map((r) => (
          <Route key={r} path={`/${r}`
        } element={<Protected role={r}><Dashboard role={r} /></Protected>} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}