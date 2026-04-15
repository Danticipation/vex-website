import Image from "next/image";
import Link from "next/link";
import type { Vehicle } from "@/lib/vehicles";
import { formatPrice } from "@/lib/vehicles";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link href={`/inventory/${vehicle.id}`} className="card">
      <div className="cardImage">
        <Image
          src={vehicle.image}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          fill
          sizes="(max-width: 980px) 100vw, 33vw"
        />
        <span className="badge">{vehicle.badge}</span>
      </div>
      <div className="cardBody">
        <p className="cardTitle">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
        <p className="cardMeta">
          {vehicle.color} · {vehicle.miles.toLocaleString()} mi
        </p>
        <p className="cardPrice">{formatPrice(vehicle.price)}</p>
        <span className="cardButton">View Details</span>
      </div>
    </Link>
  );
}
