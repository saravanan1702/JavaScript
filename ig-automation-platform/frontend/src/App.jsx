import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import Settings from './pages/Settings.jsx';
import Comments from './pages/Comments.jsx';
import Logs from './pages/Logs.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="comments" element={<Comments />} />
          <Route path="campaigns" element={<ComingSoon title="Campaigns" phase={4} />} />
          <Route path="inbox" element={<ComingSoon title="Inbox" phase={7} />} />
          <Route path="knowledge" element={<ComingSoon title="Knowledge Base" phase={5} />} />
          <Route path="analytics" element={<ComingSoon title="Analytics" phase={7} />} />
          <Route path="logs" element={<Logs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
