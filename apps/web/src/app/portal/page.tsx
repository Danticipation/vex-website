"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import {
  getOrders,
  getSavedVehicles,
  getNotifications,
  markNotificationRead,
  type OrderItem,
  type SavedVehicleItem,
  type NotificationItem,
} from "@/lib/api";
import { formatUsd } from "@/lib/formatCurrency";
import styles from "./portal.module.css";

export default function PortalPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [saved, setSaved] = useState<SavedVehicleItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/portal");
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getOrders(token).then((r) => setOrders(r.items)),
      getSavedVehicles(token).then(setSaved),
      getNotifications(token).then((r) => setNotifications(r.items)),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    try {
      await markNotificationRead(id, token);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    } catch {
      // ignore
    }
  };

  if (authLoading || !user) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <p className={styles.loading}>Loading…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>My account</h1>
        <p className={styles.greeting}>Welcome back{user.name ? `, ${user.name}` : ""}</p>

        {loading ? (
          <p className={styles.loading}>Loading your data…</p>
        ) : (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Orders</h2>
              {orders.length === 0 ? (
                <p className={styles.empty}>No orders yet. <Link href="/inventory">Browse inventory</Link> or <Link href="/build">build your ride</Link>.</p>
              ) : (
                <ul className={styles.list}>
                  {orders.map((o) => (
                    <li key={o.id} className={styles.card}>
                      <div className={styles.cardRow}>
                        <span className={styles.orderId}>{o.id.slice(0, 8)}…</span>
                        <span className={styles.badge}>{o.status}</span>
                      </div>
                      <p className={styles.cardMeta}>
                        {o.type} · {o.totalAmount != null ? formatUsd(o.totalAmount) : "—"}
                      </p>
                      {o.shipments && o.shipments.length > 0 && (
                        <div className={styles.shipment}>
                          {o.shipments.map((s) => (
                            <p key={s.id} className={styles.shipmentLine}>
                              Shipping: {s.status}
                              {s.trackingUrl && (
                                <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>Track</a>
                              )}
                              {s.estimatedDelivery && ` · Est. ${new Date(s.estimatedDelivery).toLocaleDateString()}`}
                            </p>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Saved vehicles</h2>
              {saved.length === 0 ? (
                <p className={styles.empty}>No saved vehicles.</p>
              ) : (
                <ul className={styles.list}>
                  {saved.map((s) => (
                    <li key={s.id} className={styles.card}>
                      {s.inventory?.vehicle ? (
                        <Link href={s.inventoryId ? `/inventory/${s.inventoryId}` : "/build"} className={styles.cardLink}>
                          {s.inventory.vehicle.make} {s.inventory.vehicle.model} {s.inventory.vehicle.year}
                          {s.inventory.listPrice != null && ` · ${formatUsd(s.inventory.listPrice)}`}
                        </Link>
                      ) : (
                        <Link href="/build" className={styles.cardLink}>Custom build</Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Notifications</h2>
              {notifications.length === 0 ? (
                <p className={styles.empty}>No notifications.</p>
              ) : (
                <ul className={styles.list}>
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`${styles.card} ${n.readAt ? styles.read : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => !n.readAt && handleMarkRead(n.id)}
                      onKeyDown={(e) => e.key === "Enter" && !n.readAt && handleMarkRead(n.id)}
                    >
                      <p className={styles.notifTitle}>{n.title}</p>
                      <p className={styles.notifBody}>{n.body}</p>
                      <p className={styles.notifMeta}>{new Date(n.createdAt).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
