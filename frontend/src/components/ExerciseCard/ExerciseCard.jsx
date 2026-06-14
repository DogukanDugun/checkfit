import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SetGrid from '../SetGrid/SetGrid';
import TagPicker from '../TagPicker/TagPicker';
import styles from './ExerciseCard.module.css';

export default function ExerciseCard({ egzersiz, onceki, etiketler, data, onChange }) {
  const [acik, setAcik] = useState(true);
  const navigate = useNavigate();

  return (
    <div className={`${styles.root} ${data.flagged ? styles.flagged : ''}`}>
      <div className={styles.header} onClick={() => setAcik(a => !a)}>
        <div className={styles.headerSol}>
          <span className={styles.ad}>{data.substituted_name || egzersiz.name}</span>
          {data.substituted_name && <span className={styles.sub}>({egzersiz.name})</span>}
        </div>
        <div className={styles.headerSag}>
          <button
            className={styles.gecmisBtn}
            onClick={e => { e.stopPropagation(); navigate(`/gecmis/${egzersiz.id}`); }}
            type="button"
          >
            Geçmiş
          </button>
          <span className={styles.acikKapat}>{acik ? '▲' : '▼'}</span>
        </div>
      </div>

      {acik && (
        <div className={styles.icerik}>
          {onceki && (
            <p className={styles.oncekiInfo}>
              Önceki: {new Date(onceki.performed_at).toLocaleDateString('tr-TR')}
            </p>
          )}

          <SetGrid sets={data.sets} onceki={onceki} onChange={sets => onChange({ ...data, sets })} />

          <div className={styles.bolum}>
            <label className={styles.etiketBaslik}>ETİKETLER</label>
            <TagPicker
              etiketler={etiketler}
              seciliIds={data.tag_ids}
              onChange={tag_ids => onChange({ ...data, tag_ids })}
            />
          </div>

          <div className={styles.bolum}>
            <label className={styles.etiketBaslik}>NOT</label>
            <textarea
              className={styles.textarea}
              placeholder="Bu seans için not..."
              value={data.note}
              onChange={e => onChange({ ...data, note: e.target.value })}
              rows={2}
            />
          </div>

          <div className={styles.bolum}>
            <label className={styles.etiketBaslik}>EGZERSİZ DEĞİŞİKLİĞİ</label>
            <input
              className={styles.inputField}
              placeholder="Farklı egzersiz yaptıysan yaz..."
              value={data.substituted_name}
              onChange={e => onChange({ ...data, substituted_name: e.target.value })}
            />
          </div>

          <div className={styles.bolum}>
            <button
              className={`${styles.flagBtn} ${data.flagged ? styles.flagAktif : ''}`}
              onClick={() => onChange({ ...data, flagged: !data.flagged })}
              type="button"
            >
              {data.flagged ? '⚠ Flaglendi' : '⚠ Flagle'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
