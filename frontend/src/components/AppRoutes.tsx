import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { ProfilePage } from '../pages/ProfilePage';
import { OperatorPage } from '../pages/OperatorPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { SurveyConstructor } from '../pages/SurveyConstructor';
import { LoginPage } from '../pages/LoginPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/incidents" element={<OperatorPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/surveys" element={<SurveyConstructor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}