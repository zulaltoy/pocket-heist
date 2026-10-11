import styles from "./HeistCardSkeleton.module.css";

export default function HeistCardSkeleton() {
  return (
    <div
      className={styles.card}
      role="status"
      aria-busy="true"
      aria-label="Loading heist"
    >
      <div className={styles.header}>
        <div className={styles.titleLines}>
          <div className={`${styles.line} ${styles.lineLong}`} />
          <div className={`${styles.line} ${styles.lineMedium}`} />
        </div>
        <div className={styles.icon} />
      </div>
      <div className={styles.meta}>
        <div className={`${styles.line} ${styles.lineShort}`} />
        <div className={`${styles.line} ${styles.lineShort}`} />
        <div className={`${styles.line} ${styles.lineMedium}`} />
      </div>
    </div>
  );
}
