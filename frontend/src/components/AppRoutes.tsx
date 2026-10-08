import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { ProfilePage } from '../pages/ProfilePage';
import { OperatorPage } from '../pages/OperatorPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { SurveyConstructor } from '../pages/SurveyConstructor';
import { LoginPage } from '../pages/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';
import { MyReportsPage } from '../pages/MyReportsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/login" element={<LoginPage />} />


      {/* Защищённые маршруты — все требуют авторизацию */}
      <Route
        path="/reports/my"
        element={
          <ProtectedRoute>
            <MyReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents"
        element={
          <ProtectedRoute>
            <OperatorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/surveys"
        element={
          <ProtectedRoute>
            <SurveyConstructor />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}