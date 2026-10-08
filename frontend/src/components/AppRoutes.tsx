import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { ProfilePage } from '../pages/ProfilePage';
import { OperatorPage } from '../pages/OperatorPage';
import { IncidentDetailPage } from '../pages/IncidentDetailPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { SurveyConstructor } from '../pages/SurveyConstructor';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProtectedRoute } from './ProtectedRoute';
import { MyReportsPage } from '../pages/MyReportsPage';

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
      <Route path="/incidents" element={<ProtectedRoute><OperatorPage /></ProtectedRoute>} />
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

      {/* === LEGACY: /surveys без проверки роли === */}
      {/* <Route path="/surveys" element={<ProtectedRoute><SurveyConstructor /></ProtectedRoute>} /> */}
      {/* Конструктор опросов — только author/admin (позже добавим отдельную страницу прохождения для жителя) */}
      <Route
        path="/surveys"
        element={
          <ProtectedRoute allowedRoles={['author', 'admin']}>
            <SurveyConstructor />
          </ProtectedRoute>
        }
      />

      {/* Операторская доска — только admin */}
      <Route
        path="/operator"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <OperatorPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}