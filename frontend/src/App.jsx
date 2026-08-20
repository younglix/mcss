import { Navigate, Route, Routes } from 'react-router-dom';
import { routes } from './routes.jsx';

export default function App() {
  return (
    <Routes>
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      <Route path="/super-admin/*" element={<Navigate to="/super-admin" replace />} />
      <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      <Route path="/student/*" element={<Navigate to="/student" replace />} />
      <Route path="/parent/*" element={<Navigate to="/parent" replace />} />
      <Route path="/bursary/*" element={<Navigate to="/bursary" replace />} />
      <Route path="/staff/*" element={<Navigate to="/staff/teacher" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
