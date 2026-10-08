import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './components/AppRoutes';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <AppRoutes />
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}