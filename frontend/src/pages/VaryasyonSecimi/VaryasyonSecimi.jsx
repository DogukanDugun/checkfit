import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gunTipleri, seanslar } from '../../api/client';
import styles from './VaryasyonSecimi.module.css';

export default function VaryasyonSecimi() {
  const { dayTypeId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [secili, setSecili] = useState(null);
  const [baslatiliyor, setBaslatiliyor] = useState(false);

  useEffect(() => {
    gunTipleri.liste().then(r => {
      const dt = r.data.find(d => d.id === Number(dayTypeId));
      if (dt) {
        setData(dt);
        setSecili(dt.nextVariation?.id ?? dt.variations[0]?.id ?? null);
      }
    });
  }, [dayTypeId]);

  const baslat = async () => {
    if (!secili) return;
    setBaslatiliyor(true);
    try {
      const r = await seanslar.olustur({ variation_id: secili, day_type_id: Number(dayTypeId) });
      localStorage.setItem('checkfit_active_seans', JSON.stringify({
        seansId: r.data.id,
        variationId: secili,
        dayTypeId: Number(dayTypeId),
      }));
      navigate(`/seans/${secili}?seansId=${r.data.id}`);
    } catch {
      setBaslatiliyor(false);
    }
  };

  if (!data) return <div className={styles.yukleniyor}>Yükleniyor...</div>;

  return (
    <div className="page">
      <button className={styles.geri} onClick={() => navigate('/')}>← Geri</button>
      <h1 className={styles.baslik}>{data.name}</h1>
      <p className={styles.alt}>Hangi varyasyonu yapacaksın?</p>
      <div className={styles.liste}>
        {data.variations.map(v => (
          <div
            key={v.id}
            className={`${styles.kart} ${secili === v.id ? styles.secili : ''} ${data.nextVariation?.id === v.id ? styles.siradaki : ''}`}
            onClick={() => setSecili(v.id)}
          >
            <span className={styles.kod}>{v.code}</span>
            {data.nextVariation?.id === v.id && <span className={styles.siradakiBadge}>SIRADAKI</span>}
          </div>
        ))}
      </div>
      <button className={styles.btn} onClick={baslat} disabled={!secili || baslatiliyor}>
        {baslatiliyor ? 'BAŞLATILIYOR...' : 'ANTRENMANÍ BAŞLAT'}
      </button>
    </div>
  );
}
