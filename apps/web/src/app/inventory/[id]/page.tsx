import { notFound } from "next/navigation";
import Link from "next/link";
import { getVehicleById, formatPrice } from "@/lib/vehicles";

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const vehicle = getVehicleById(params.id);
  if (!vehicle) {
    notFound();
  }

  const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE || "";
  const phoneHref = contactPhone.replace(/\D/g, "");
  const maskedVin = vehicle.vin.slice(-6).padStart(vehicle.vin.length, "*");

  return (
    <main className="section">
      <div className="vehicle-hero">
        <img src={vehicle.image} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} className="vehicle-hero-image" />
      </div>

      <div className="grid-2" style={{ gap: "2rem", alignItems: "start" }}>
        <div>
          <p className="hero-eyebrow">{vehicle.badge}</p>
          <h1 className="sectionHeading" style={{ fontSize: "4rem", marginTop: "0.5rem" }}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="feature-copy" style={{ color: "var(--color-silver)", marginTop: "1rem" }}>
            {vehicle.color} · {vehicle.miles.toLocaleString()} mi · VIN {maskedVin}
          </p>
          <p className="cardPrice" style={{ margin: "1.5rem 0" }}>
            {formatPrice(vehicle.price)}
          </p>
          <p className="feature-copy" style={{ marginBottom: "2rem", maxWidth: "42rem" }}>
            {vehicle.description}
          </p>
          <div className="hero-actions" style={{ flexWrap: "wrap" }}>
            <Link href={`/contact?vehicle=${vehicle.id}`} className="btn btnPrimary">
              Request More Info
            </Link>
            <Link href="/contact" className="btn btnGhost">
              Schedule Viewing
            </Link>
          </div>
        </div>

        <aside className="contact-card">
          <p className="feature-title">Seller Info</p>
          <div className="badge" style={{ marginTop: "1rem", display: "inline-flex" }}>
            Verified Seller
          </div>
          <p className="feature-copy" style={{ marginTop: "1.2rem" }}>
            Member since {vehicle.sellerSince}
          </p>
          <p className="feature-copy" style={{ marginTop: "1rem" }}>
            Discreet service with direct vehicle introductions and individual support.
          </p>
          {phoneHref ? (
            <a href={`tel:${phoneHref}`} className="btn btnGhost" style={{ width: "100%", justifyContent: "center", marginTop: "1.6rem" }}>
              {contactPhone}
            </a>
          ) : (
            <p className="feature-copy" style={{ marginTop: "1.6rem" }}>
              Contact number is not configured.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
