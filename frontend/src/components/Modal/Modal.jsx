import { useEffect } from 'react';
import styles from './Modal.module.css';

export default function Modal({ title, fields, values, onChange, onConfirm, onCancel, loading }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onCancel} type="button">×</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onConfirm(values); }}>
          {fields.map(f => (
            <div key={f.key} className={styles.field}>
              <label className={styles.label}>{f.label}</label>
              <input
                className={styles.input}
                type={f.type ?? 'text'}
                value={values[f.key] ?? ''}
                onChange={e => onChange(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                placeholder={f.placeholder ?? ''}
                min={f.min}
                required
                autoFocus={f.autoFocus}
              />
            </div>
          ))}
          <div className={styles.buttons}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>İptal</button>
            <button type="submit" className={styles.confirmBtn} disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
