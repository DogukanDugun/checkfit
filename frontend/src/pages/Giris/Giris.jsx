import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Giris.module.css';

export default function Giris() {
  const { giris } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const gonder = async (e) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);
    try {
      await giris(form);
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
        <h2 className={styles.baslik}>GİRİŞ</h2>
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
          placeholder="Şifre"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          required
        />
        <button className={styles.btn} disabled={yukleniyor}>
          {yukleniyor ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
        </button>
        <p className={styles.link}>Hesabın yok mu? <Link to="/kayit">Kayıt ol</Link></p>
      </form>
    </div>
  );
}
