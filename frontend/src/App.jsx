import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import Giris from './pages/Giris/Giris';
import Kayit from './pages/Kayit/Kayit';
import Dashboard from './pages/Dashboard/Dashboard';
import VaryasyonSecimi from './pages/VaryasyonSecimi/VaryasyonSecimi';
import AktifSeans from './pages/AktifSeans/AktifSeans';
import EgzersizGecmisi from './pages/EgzersizGecmisi/EgzersizGecmisi';
import ProgramYonetimi from './pages/ProgramYonetimi/ProgramYonetimi';
import EtiketYonetimi from './pages/EtiketYonetimi/EtiketYonetimi';

function Protected({ children }) {
  const { user } = useAuth();
  if (user === undefined) return null;
  if (!user) return <Navigate to="/giris" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/giris" element={<Giris />} />
          <Route path="/kayit" element={<Kayit />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/gun/:dayTypeId" element={<Protected><VaryasyonSecimi /></Protected>} />
            <Route path="/seans/:variationId" element={<Protected><AktifSeans /></Protected>} />
            <Route path="/gecmis/:exerciseId" element={<Protected><EgzersizGecmisi /></Protected>} />
            <Route path="/program" element={<Protected><ProgramYonetimi /></Protected>} />
            <Route path="/etiketler" element={<Protected><EtiketYonetimi /></Protected>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
