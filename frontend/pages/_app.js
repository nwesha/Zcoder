import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;