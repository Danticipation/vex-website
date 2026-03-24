import styles from "./PrestigeMarquee.module.css";

const ITEMS = [
  "Private treaty",
  "Sealed bid",
  "Verified provenance",
  "Concierge intake",
  "Enclosed transport",
  "Global network",
  "Limited production",
  "Factory allocation",
] as const;

export function PrestigeMarquee() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div id="discover" className={styles.wrap} aria-hidden>
      <div className={styles.track}>
        {doubled.map((label, i) => (
          <span key={`${label}-${i}`} className={styles.item}>
            <span className={styles.hex} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
