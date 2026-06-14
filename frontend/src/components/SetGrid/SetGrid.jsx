import styles from './SetGrid.module.css';

export default function SetGrid({ sets, onceki, onChange }) {
  const updateSet = (i, field, val) => {
    const next = sets.map((s, idx) => idx === i ? { ...s, [field]: val } : s);
    onChange(next);
  };

  const toggleTamamla = (i) => updateSet(i, 'completed', !sets[i].completed);

  return (
    <div className={styles.root}>
      <div className={styles.baslikSatir}>
        <span className={styles.setNo}>#</span>
        <span className={styles.onceki}>Önceki</span>
        <span className={styles.kg}>KG</span>
        <span className={styles.tekrar}>TEKRAR</span>
        <span className={styles.check}></span>
      </div>
      {sets.map((set, i) => {
        const ref = onceki?.sets?.[i];
        const prVar = ref && set.completed &&
          (set.weight_kg > ref.weight_kg || (set.weight_kg === ref.weight_kg && set.reps > ref.reps));
        return (
          <div key={i} className={`${styles.satir} ${set.completed ? styles.tamamlandi : ''} ${prVar ? styles.pr : ''}`}>
            <span className={styles.setNo}>{i + 1}</span>
            <span className={styles.oncekiVal}>
              {ref ? <>{ref.weight_kg ?? 'bw'} × {ref.reps ?? '-'}</> : '-'}
            </span>
            <input
              className={styles.input}
              type="number"
              placeholder="0"
              value={set.weight_kg ?? ''}
              onChange={e => updateSet(i, 'weight_kg', e.target.value === '' ? null : Number(e.target.value))}
              min="0"
            />
            <input
              className={styles.input}
              type="number"
              placeholder="0"
              value={set.reps ?? ''}
              onChange={e => updateSet(i, 'reps', e.target.value === '' ? null : Number(e.target.value))}
              min="0"
            />
            <button
              className={`${styles.checkBtn} ${set.completed ? styles.checkAktif : ''}`}
              onClick={() => toggleTamamla(i)}
              type="button"
            >
              {set.completed ? '✓' : '○'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
