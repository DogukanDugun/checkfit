import { useState, useEffect } from 'react';
import { etiketler as etApi } from '../../api/client';
import styles from './EtiketYonetimi.module.css';

export default function EtiketYonetimi() {
  const [liste, setListe] = useState([]);
  const [yeniLabel, setYeniLabel] = useState('');

  const yukle = () => etApi.liste().then(r => setListe(r.data));
  useEffect(() => { yukle(); }, []);

  const ekle = async (e) => {
    e.preventDefault();
    if (!yeniLabel.trim()) return;
    await etApi.ekle({ label: yeniLabel.trim() });
    setYeniLabel('');
    yukle();
  };

  const sil = async (id) => {
    await etApi.sil(id);
    yukle();
  };

  return (
    <div className="page">
      <h1 className={styles.baslik}>ETİKETLER</h1>
      <form onSubmit={ekle} className={styles.form}>
        <input
          className={styles.input}
          placeholder="Yeni etiket..."
          value={yeniLabel}
          onChange={e => setYeniLabel(e.target.value)}
        />
        <button className={styles.ekleBtn} type="submit">Ekle</button>
      </form>
      <div className={styles.liste}>
        {liste.map(t => (
          <div key={t.id} className={styles.kart}>
            <span className={styles.label}>{t.label}</span>
            <button className={styles.silBtn} onClick={() => sil(t.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
