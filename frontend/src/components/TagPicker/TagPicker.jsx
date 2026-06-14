import styles from './TagPicker.module.css';

export default function TagPicker({ etiketler, seciliIds, onChange }) {
  const toggle = (id) => {
    const next = seciliIds.includes(id) ? seciliIds.filter(t => t !== id) : [...seciliIds, id];
    onChange(next);
  };

  return (
    <div className={styles.root}>
      {etiketler.map(t => (
        <button
          key={t.id}
          className={`${styles.tag} ${seciliIds.includes(t.id) ? styles.secili : ''}`}
          onClick={() => toggle(t.id)}
          type="button"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
