import dynamic from "next/dynamic";

const AppraisalsClient = dynamic(() => import("./AppraisalsClient").then((m) => m.AppraisalsClient), {
  loading: () => (
    <main style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      <p style={{ color: "var(--text-muted)" }}>Loading appraisals…</p>
    </main>
  ),
  ssr: false,
});

export default function AppraisalsListPage() {
  return <AppraisalsClient />;
}
