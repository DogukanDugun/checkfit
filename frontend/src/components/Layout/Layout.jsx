import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, cikis } = useAuth();
  const navigate = useNavigate();

  const handleCikis = async () => {
    await cikis();
    navigate('/giris');
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.logo}>CHECKFIT</span>
        <nav className={styles.nav}>
          <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : ''}>Antrenman</NavLink>
          <NavLink to="/program" className={({ isActive }) => isActive ? styles.active : ''}>Program</NavLink>
          <NavLink to="/etiketler" className={({ isActive }) => isActive ? styles.active : ''}>Etiketler</NavLink>
        </nav>
        <div className={styles.kullanici}>
          <span className={styles.username}>{user?.username}</span>
          <button className={styles.cikis} onClick={handleCikis}>Çıkış</button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
