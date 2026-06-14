import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gunTipleri } from '../../api/client';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [liste, setListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aktifSeans, setAktifSeans] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    gunTipleri.liste().then(r => setListe(r.data)).finally(() => setYukleniyor(false));
    const saved = JSON.parse(localStorage.getItem('checkfit_active_seans') || 'null');
    if (saved?.seansId) setAktifSeans(saved);
  }, []);

  if (yukleniyor) return <div className={styles.yukleniyor}>Yükleniyor...</div>;

  if (liste.length === 0) return (
    <div className={styles.bos}>
      <p>Henüz program eklemedin.</p>
      <button className={styles.btn} onClick={() => navigate('/program')}>PROGRAM OLUŞTUR</button>
    </div>
  );

  return (
    <div className="page">
      {aktifSeans && (
        <div className={styles.devamBanner}>
          <span>Yarım kalan seans var</span>
          <button
            className={styles.devamBtn}
            onClick={() => navigate(`/seans/${aktifSeans.variationId}?seansId=${aktifSeans.seansId}`)}
          >
            DEVAM ET →
          </button>
        </div>
      )}
      <h1 className={styles.baslik}>ANTRENMAN</h1>
      <div className={styles.liste}>
        {liste.map(dt => (
          <div key={dt.id} className={styles.kart} onClick={() => navigate(`/gun/${dt.id}`)}>
            <div className={styles.kartUst}>
              <span className={styles.etiket}>{dt.short_label}</span>
              <span className={styles.ad}>{dt.name}</span>
            </div>
            {dt.nextVariation && (
              <div className={styles.siradaki}>
                <span className={styles.siradakiEtiket}>SIRADAKI</span>
                <span className={styles.varyasyon}>{dt.nextVariation.code}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
