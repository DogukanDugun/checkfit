import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { egzersizler, seanslar, etiketler as etiketApi } from '../../api/client';
import ExerciseCard from '../../components/ExerciseCard/ExerciseCard';
import styles from './AktifSeans.module.css';

function bosSetler(n) {
  return Array.from({ length: n }, (_, i) => ({
    set_number: i + 1,
    weight_kg: null,
    reps: null,
    completed: false,
  }));
}

function lsKey(seansId) {
  return `checkfit_seans_${seansId}`;
}

export default function AktifSeans() {
  const { variationId } = useParams();
  const [searchParams] = useSearchParams();
  const seansId = searchParams.get('seansId');
  const navigate = useNavigate();

  const [egzList, setEgzList] = useState([]);
  const [etiketList, setEtiketList] = useState([]);
  const [sesData, setSesData] = useState([]);
  const [oncekiler, setOncekiler] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bitiyor, setBitiyor] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!seansId) { navigate('/'); return; }

    Promise.all([
      egzersizler.liste(variationId),
      etiketApi.liste(),
    ]).then(([egzRes, etRes]) => {
      const egz = egzRes.data;
      setEgzList(egz);
      setEtiketList(etRes.data);

      const saved = JSON.parse(localStorage.getItem(lsKey(seansId)) || 'null');
      if (saved && saved.sesData?.length === egz.length) {
        setSesData(saved.sesData);
        setCurrentIdx(saved.currentIdx ?? 0);
      } else {
        setSesData(egz.map(e => ({
          exercise_id: e.id,
          sets: bosSetler(e.planned_sets),
          tag_ids: [],
          note: '',
          substituted_name: '',
          flagged: false,
        })));
      }

      Promise.all(egz.map(e => seanslar.onceki(variationId, e.id))).then(results => {
        const map = {};
        egz.forEach((e, i) => { map[e.id] = results[i].data; });
        setOncekiler(map);
      });

      initialized.current = true;
    }).finally(() => setYukleniyor(false));
  }, [variationId, seansId]);

  // localStorage'a kaydet — her değişiklikte
  useEffect(() => {
    if (!initialized.current || !seansId || sesData.length === 0) return;
    localStorage.setItem(lsKey(seansId), JSON.stringify({ seansId, variationId, sesData, currentIdx }));
  }, [sesData, currentIdx, seansId, variationId]);

  const updateEgz = (data) => {
    setSesData(s => s.map((d, idx) => idx === currentIdx ? data : d));
  };

  const bitirHareket = () => {
    setCurrentIdx(i => i + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bitirSeans = async () => {
    setBitiyor(true);
    try {
      await seanslar.tamamla(seansId, { exercises: sesData });
      localStorage.removeItem(lsKey(seansId));
      localStorage.removeItem('checkfit_active_seans');
      navigate('/');
    } catch {
      setBitiyor(false);
    }
  };

  if (yukleniyor) return <div className={styles.yukleniyor}>Yükleniyor...</div>;

  if (egzList.length === 0) return (
    <div className={styles.yukleniyor}>
      <p>Bu varyasyonda egzersiz yok.</p>
      <button onClick={() => navigate('/program')} style={{ marginTop: 16, color: 'var(--accent)', background: 'none', border: 'none', fontSize: 14 }}>
        Program yönetimine git →
      </button>
    </div>
  );

  const hepsiBitti = currentIdx >= egzList.length;

  return (
    <div className="page">
      <button className={styles.geri} onClick={() => navigate(-1)}>← Geri</button>

      <div className={styles.progress}>
        <span className={styles.progressText}>
          {hepsiBitti ? 'Tüm hareketler tamamlandı' : `${currentIdx + 1} / ${egzList.length} hareket`}
        </span>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${(hepsiBitti ? egzList.length : currentIdx) / egzList.length * 100}%` }}
          />
        </div>
      </div>

      {!hepsiBitti && (
        <>
          <ExerciseCard
            egzersiz={egzList[currentIdx]}
            onceki={oncekiler[egzList[currentIdx]?.id]}
            etiketler={etiketList}
            data={sesData[currentIdx]}
            onChange={updateEgz}
          />
          <div className={styles.altBar}>
            <button className={styles.bitirBtn} onClick={bitirHareket}>
              HAREKETİ BİTİR
            </button>
          </div>
        </>
      )}

      {hepsiBitti && (
        <div className={styles.ozet}>
          <h2 className={styles.ozetBaslik}>SEANS ÖZETİ</h2>
          {sesData.map((d, i) => {
            const tamamlanan = d.sets.filter(s => s.completed);
            return (
              <div key={i} className={styles.ozetKart}>
                <span className={styles.ozetAd}>{d.substituted_name || egzList[i]?.name}</span>
                <span className={styles.ozetSet}>{tamamlanan.length} set tamamlandı</span>
              </div>
            );
          })}
          <div className={styles.altBar}>
            <button className={styles.bitirBtn} onClick={bitirSeans} disabled={bitiyor}>
              {bitiyor ? 'KAYDEDİLİYOR...' : 'SEANSI BİTİR'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
