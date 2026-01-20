import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { TTSProvider } from '@/contexts/TTSContext';
import Landing from '@/pages/Landing';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import Assessment from '@/pages/Assessment';
import PathSelection from '@/pages/PathSelection';
import AtBat from '@/pages/AtBat';
import FirstBase from '@/pages/FirstBase';
import Report from '@/pages/Report';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-homerun-blue"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <TTSProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route
          path="/assessment"
          element={
            <ProtectedRoute>
              <Assessment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/path-selection"
          element={
            <ProtectedRoute>
              <PathSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/at-bat"
          element={
            <ProtectedRoute>
              <AtBat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/first-base"
          element={
            <ProtectedRoute>
              <FirstBase />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <Report />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TTSProvider>
  );
}

export default App;