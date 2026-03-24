"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getInventory, type InventoryItem } from "@/lib/api";
import { formatUsd } from "@/lib/formatCurrency";
import styles from "./FeaturedInventory.module.css";

function imageUrl(item: InventoryItem): string | null {
  const urls = item.imageUrls ?? item.vehicle?.imageUrls;
  if (Array.isArray(urls) && urls[0]) return urls[0];
  return null;
}

export function FeaturedInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInventory({ limit: 6, offset: 0 })
      .then((data) => setItems(data.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section id="featured" className={styles.section}>
        <h2 className={styles.title}>Featured lots</h2>
        <p className={styles.subtitle}>Current listings on the exchange</p>
        <div className={styles.grid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.cardSkeleton} />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section id="featured" className={styles.section}>
      <h2 className={styles.title}>Featured lots</h2>
      <p className={styles.subtitle}>Current listings on the exchange</p>
      <div className={styles.grid}>
        {items.map((item, index) => {
          const url = imageUrl(item);
          const lot = String(index + 1).padStart(3, "0");
          return (
            <Link key={item.id} href={`/inventory/${item.id}`} className={styles.card}>
              <div className={styles.cardImage}>
                <span className={styles.lotTag}>LOT · {lot}</span>
                {url ? (
                  <img src={url} alt="" loading="lazy" className={styles.img} />
                ) : (
                  <div className={styles.placeholder}>No image</div>
                )}
              </div>
              <div className={styles.cardBody}>
                <span className={styles.badge}>{item.source === "PRIVATE_SELLER" ? "Private" : "Company"}</span>
                <h3 className={styles.cardTitle}>
                  {item.vehicle?.make} {item.vehicle?.model}
                </h3>
                <p className={styles.cardMeta}>
                  {item.vehicle?.year}
                  {item.location ? ` · ${item.location}` : ""}
                </p>
                <p className={styles.cardPrice}>{formatUsd(item.listPrice)}</p>
                <span className={styles.cta}>View details</span>
              </div>
            </Link>
          );
        })}
      </div>
      <Link href="/inventory" className={styles.viewAll}>
        View all exotics →
      </Link>
    </section>
  );
}
