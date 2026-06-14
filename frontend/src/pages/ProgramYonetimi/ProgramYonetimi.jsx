import { useState, useEffect } from 'react';
import { gunTipleri as gtApi, varyasyonlar as varApi, egzersizler as egzApi } from '../../api/client';
import Modal from '../../components/Modal/Modal';
import styles from './ProgramYonetimi.module.css';

const DT_FIELDS = [
  { key: 'name', label: 'Gün tipi adı', placeholder: 'örn: Göğüs/Sırt', autoFocus: true },
  { key: 'short_label', label: 'Kısa etiket', placeholder: 'örn: GS' },
];
const VAR_FIELDS = [
  { key: 'code', label: 'Varyasyon kodu', placeholder: 'örn: 1A, 2B', autoFocus: true },
];
const EGZ_FIELDS = [
  { key: 'name', label: 'Egzersiz adı', placeholder: 'örn: Bench Press', autoFocus: true },
  { key: 'planned_sets', label: 'Set sayısı', type: 'number', min: 1, placeholder: '3' },
];

export default function ProgramYonetimi() {
  const [liste, setListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [modal, setModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const yukle = () => gtApi.liste().then(r => setListe(r.data)).finally(() => setYukleniyor(false));
  useEffect(() => { yukle(); }, []);

  const acModal = (config) => setModal(config);
  const kapat = () => { if (!modalLoading) setModal(null); };

  const kaydet = async (values) => {
    setModalLoading(true);
    try {
      await modal.onConfirm(values);
      setModal(null);
      yukle();
    } finally {
      setModalLoading(false);
    }
  };

  const dtSil = async (id) => {
    if (!window.confirm('Bu gün tipini ve tüm içeriğini silmek istiyor musun?')) return;
    await gtApi.sil(id);
    yukle();
  };

  const varSil = async (id) => {
    if (!window.confirm('Bu varyasyonu silmek istiyor musun?')) return;
    await varApi.sil(id);
    yukle();
  };

  const egzSil = async (id) => {
    if (!window.confirm('Bu egzersizi silmek istiyor musun?')) return;
    await egzApi.sil(id);
    yukle();
  };

  if (yukleniyor) return <div className={styles.yukleniyor}>Yükleniyor...</div>;

  return (
    <div className="page">
      <h1 className={styles.baslik}>PROGRAM YÖNETİMİ</h1>

      {liste.map(dt => (
        <div key={dt.id} className={styles.dtKart}>
          <div className={styles.dtHeader}>
            <div className={styles.dtSol}>
              <span className={styles.dtEtiket}>{dt.short_label}</span>
              <span className={styles.dtAd}>{dt.name}</span>
            </div>
            <div className={styles.aksiyonlar}>
              <button className={styles.ekleBtn} onClick={() => acModal({
                title: 'Varyasyon Ekle',
                fields: VAR_FIELDS,
                values: { code: '' },
                onConfirm: (v) => varApi.ekle({ day_type_id: dt.id, code: v.code }),
              })}>+ Varyasyon</button>
              <button className={styles.duzBtn} onClick={() => acModal({
                title: 'Gün Tipini Düzenle',
                fields: DT_FIELDS,
                values: { name: dt.name, short_label: dt.short_label },
                onConfirm: (v) => gtApi.guncelle(dt.id, v),
              })}>✎</button>
              <button className={styles.silBtn} onClick={() => dtSil(dt.id)}>×</button>
            </div>
          </div>

          {dt.variations.map(v => (
            <div key={v.id} className={styles.varKart}>
              <div className={styles.varHeader}>
                <span className={styles.varKod}>{v.code}</span>
                <div className={styles.aksiyonlar}>
                  <button className={styles.ekleBtn} onClick={() => acModal({
                    title: 'Egzersiz Ekle',
                    fields: EGZ_FIELDS,
                    values: { name: '', planned_sets: 3 },
                    onConfirm: (val) => egzApi.ekle({ variation_id: v.id, name: val.name, planned_sets: val.planned_sets }),
                  })}>+ Egzersiz</button>
                  <button className={styles.silBtn} onClick={() => varSil(v.id)}>×</button>
                </div>
              </div>
              {v.exercises?.map(e => (
                <div key={e.id} className={styles.egzSatir}>
                  <span className={styles.egzAd}>{e.name}</span>
                  <span className={styles.egzSet}>{e.planned_sets} set</span>
                  <button className={styles.duzBtn} onClick={() => acModal({
                    title: 'Egzersizi Düzenle',
                    fields: EGZ_FIELDS,
                    values: { name: e.name, planned_sets: e.planned_sets },
                    onConfirm: (val) => egzApi.guncelle(e.id, val),
                  })}>✎</button>
                  <button className={styles.silBtn} onClick={() => egzSil(e.id)}>×</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      <button className={styles.buyukEkleBtn} onClick={() => acModal({
        title: 'Gün Tipi Ekle',
        fields: DT_FIELDS,
        values: { name: '', short_label: '' },
        onConfirm: (v) => gtApi.ekle(v),
      })}>+ GÜN TİPİ EKLE</button>

      {modal && (
        <Modal
          title={modal.title}
          fields={modal.fields}
          values={modal.values}
          onChange={(key, val) => setModal(m => ({ ...m, values: { ...m.values, [key]: val } }))}
          onConfirm={kaydet}
          onCancel={kapat}
          loading={modalLoading}
        />
      )}
    </div>
  );
}
