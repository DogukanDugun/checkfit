import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { seanslar } from '../../api/client';
import styles from './EgzersizGecmisi.module.css';

export default function EgzersizGecmisi() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const [gecmis, setGecmis] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    seanslar.gecmis(exerciseId).then(r => setGecmis(r.data)).finally(() => setYukleniyor(false));
  }, [exerciseId]);

  if (yukleniyor) return <div className={styles.yukleniyor}>Yükleniyor...</div>;

  return (
    <div className="page">
      <button className={styles.geri} onClick={() => navigate(-1)}>← Geri</button>
      <h1 className={styles.baslik}>GEÇMİŞ</h1>
      {gecmis.length === 0 && <p className={styles.bos}>Henüz seans kaydı yok.</p>}
      {gecmis.map((kayit, i) => (
        <div key={i} className={styles.kart}>
          <p className={styles.tarih}>
            {new Date(kayit.performed_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {kayit.substituted_name && <p className={styles.sub}>Yerine: {kayit.substituted_name}</p>}
          <div className={styles.setler}>
            {kayit.sets.filter(s => s.completed).map((s, j) => (
              <span key={j} className={styles.set}>{s.weight_kg ?? 'bw'} × {s.reps}</span>
            ))}
          </div>
          {kayit.note && <p className={styles.not}>{kayit.note}</p>}
          {kayit.tags?.length > 0 && (
            <div className={styles.tags}>
              {kayit.tags.map(t => <span key={t.id} className={styles.tag}>{t.label}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
