import { Navigate, Route, Routes } from 'react-router-dom';
import { routes } from './routes.jsx';
import { UIPreferencesProvider } from './context/UIPreferences.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { BrandingProvider } from './context/BrandingContext.jsx';
import RequireAuth from './components/auth/RequireAuth.jsx';
import CursorGlow from './components/ui/CursorGlow.jsx';
import MaintenanceOverlay from './components/ui/MaintenanceOverlay.jsx';
import BrandColorSync from './components/ui/BrandColorSync.jsx';

export default function App() {
  return (
    <BrandingProvider>
      <AuthProvider>
        <UIPreferencesProvider>
          <BrandColorSync />
          <CursorGlow />
          <MaintenanceOverlay />
          <Routes>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.path.startsWith('/super-admin') ? <RequireAuth>{route.element}</RequireAuth> : route.element}
              />
            ))}
            <Route path="/super-admin/*" element={<Navigate to="/super-admin" replace />} />
            <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
            <Route path="/student/*" element={<Navigate to="/student" replace />} />
            <Route path="/parent/*" element={<Navigate to="/parent" replace />} />
            <Route path="/bursary/*" element={<Navigate to="/bursary" replace />} />
            <Route path="/staff/*" element={<Navigate to="/staff/teacher" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </UIPreferencesProvider>
      </AuthProvider>
    </BrandingProvider>
  );
}
