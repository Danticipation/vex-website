import { Header } from "@/components/Header";

export default function BuildLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
