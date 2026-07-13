import styles from "./loading.module.css";

export default function Loading({ message = "Loading content" }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner} />
        <div className={styles.pulseRing} />
      </div>
      <p className={styles.text}>{message}...</p>
    </div>
  );
}