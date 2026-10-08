import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { ProfilePage } from '../pages/ProfilePage';
import { OperatorPage } from '../pages/OperatorPage';
import { IncidentDetailPage } from '../pages/IncidentDetailPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { SurveysPage } from '../pages/SurveysPage';
import { SurveyDetailPage } from '../pages/SurveyDetailPage';
import { SurveyWizard } from '../pages/SurveyWizard';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProtectedRoute } from './ProtectedRoute';
import { MyReportsPage } from '../pages/MyReportsPage';
import { IncidentsPage } from '../pages/incidents/IncidentsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Защищённые маршруты — требуют авторизацию */}
      <Route path="/reports/my" element={<ProtectedRoute><MyReportsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Инциденты — просмотр для всех авторизованных (приоритет: отслеживание жителем) */}
      <Route path="/incidents" element={<ProtectedRoute><IncidentsPage /></ProtectedRoute>} />
      <Route path="/incidents/:id" element={<ProtectedRoute><IncidentDetailPage /></ProtectedRoute>} />

      {/* === LEGACY: /analytics без проверки роли (любой залогиненный) === */}
      {/* <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} /> */}
      {/* Аналитика — только author/admin (на бэке dashboard требует этих ролей) */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRoles={['author', 'admin']}>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />

            {/* Опросы — список и прохождение для всех авторизованных */}
      <Route
        path="/surveys"
        element={
          <ProtectedRoute allowedRoles={['resident', 'author', 'admin']}>
            <SurveysPage />
          </ProtectedRoute>
        }
      />

      {/* Конструктор опросов — только author/admin */}
      <Route
        path="/surveys/new"
        element={
          <ProtectedRoute allowedRoles={['author', 'admin']}>
            <SurveyWizard />
          </ProtectedRoute>
        }
      />

      {/* Прохождение опроса */}
      <Route
        path="/surveys/:id"
        element={
          <ProtectedRoute allowedRoles={['resident', 'author', 'admin']}>
            <SurveyDetailPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}