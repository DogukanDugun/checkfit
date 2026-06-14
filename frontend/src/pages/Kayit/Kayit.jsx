import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from '../Giris/Giris.module.css';

export default function Kayit() {
  const { kayit } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const gonder = async (e) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);
    try {
      await kayit(form);
      navigate('/');
    } catch (err) {
      setHata(err.response?.data?.error ?? 'Bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className={styles.root}>
      <h1 className={styles.logo}>CHECKFIT</h1>
      <form onSubmit={gonder} className={styles.form}>
        <h2 className={styles.baslik}>KAYIT OL</h2>
        {hata && <p className={styles.hata}>{hata}</p>}
        <input
          className={styles.input}
          placeholder="Kullanıcı adı"
          value={form.username}
          onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
          required
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Şifre (en az 6 karakter)"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          required
          minLength={6}
        />
        <button className={styles.btn} disabled={yukleniyor}>
          {yukleniyor ? 'KAYIT YAPILIYOR...' : 'KAYIT OL'}
        </button>
        <p className={styles.link}>Hesabın var mı? <Link to="/giris">Giriş yap</Link></p>
      </form>
    </div>
  );
}
