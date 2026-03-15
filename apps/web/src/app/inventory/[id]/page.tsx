"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getInventoryItem, type InventoryItem } from "@/lib/api";
import styles from "./detail.module.css";

export default function InventoryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getInventoryItem(id)
      .then((data) => {
        if (!cancelled) setItem(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <p className={styles.error}>{error}</p>
          <Link href="/inventory" className={styles.back}>
            ← Back to inventory
          </Link>
        </main>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <p className={styles.loading}>Loading…</p>
        </main>
      </>
    );
  }

  const imageUrls = item.imageUrls ?? (Array.isArray(item.vehicle?.imageUrls) ? item.vehicle?.imageUrls : null) ?? [];
  const primaryImage = imageUrls[0];

  return (
    <>
      <Header />
      <main className={styles.main}>
        <Link href="/inventory" className={styles.back}>
          ← Back to inventory
        </Link>

        <div className={styles.content}>
          <div className={styles.gallery}>
            {primaryImage ? (
              <img src={primaryImage} alt="" className={styles.heroImage} />
            ) : (
              <div className={styles.placeholder}>No image</div>
            )}
            {imageUrls.length > 1 && (
              <div className={styles.thumbnails}>
                {imageUrls.slice(1, 5).map((url, i) => (
                  <img key={i} src={url} alt="" />
                ))}
              </div>
            )}
          </div>

          <div className={styles.details}>
            <span className={styles.badge}>{item.source === "PRIVATE_SELLER" ? "Private seller" : "Company"}</span>
            <h1 className={styles.title}>
              {item.vehicle?.make} {item.vehicle?.model}
            </h1>
            <p className={styles.meta}>
              {item.vehicle?.year} · {item.vehicle?.trimLevel}
              {item.location ? ` · ${item.location}` : ""}
            </p>
            <p className={styles.price}>£{item.listPrice.toLocaleString()}</p>
            {item.mileage != null && (
              <p className={styles.spec}>Mileage: {item.mileage.toLocaleString()} mi</p>
            )}
            {item.vin && (
              <p className={styles.spec}>VIN: {item.vin}</p>
            )}
            {item.specs && Object.keys(item.specs).length > 0 && (
              <div className={styles.specs}>
                <h3 className={styles.specsTitle}>Specs</h3>
                <dl className={styles.specList}>
                  {Object.entries(item.specs).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className={styles.ctas}>
              <Link href={`/build?inventoryId=${item.id}`} className={styles.ctaPrimary}>
                Configure & buy
              </Link>
              <Link href={`/checkout?inventoryId=${item.id}`} className={styles.ctaSecondary}>
                Reserve / Pay deposit
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
