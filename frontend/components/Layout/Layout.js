import Navigation from './Navigation';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navigation />}
      <main className={isAuthenticated ? 'pt-0' : ''}>
        {children}
      </main>
    </div>
  );
}