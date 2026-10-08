import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './components/AppRoutes';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <AppRoutes />
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}