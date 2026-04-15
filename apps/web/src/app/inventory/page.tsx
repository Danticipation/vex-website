"use client";

import { useMemo, useState } from "react";
import { FEATURED_VEHICLES } from "@/lib/vehicles";
import { VehicleCard } from "@/components/VehicleCard";

const priceRanges = [
  { label: "All", value: "all" },
  { label: "Under $300k", value: "under-300" },
  { label: "$300k - $500k", value: "300-500" },
  { label: "$500k+", value: "500-plus" },
];

const mileageRanges = [
  { label: "All", value: "all" },
  { label: "Under 1,000 mi", value: "under-1000" },
  { label: "1,000 - 2,500 mi", value: "1000-2500" },
  { label: "2,500+ mi", value: "2500-plus" },
];

const sortOptions = [
  { label: "Newest arrivals", value: "newest" },
  { label: "Price: low to high", value: "price-asc" },
  { label: "Price: high to low", value: "price-desc" },
];

export default function InventoryPage() {
  const [make, setMake] = useState("All");
  const [priceRange, setPriceRange] = useState("all");
  const [mileage, setMileage] = useState("all");
  const [sort, setSort] = useState("newest");

  const makes = ["All", ...Array.from(new Set(FEATURED_VEHICLES.map((vehicle) => vehicle.make)))];

  const filtered = useMemo(() => {
    return FEATURED_VEHICLES.filter((vehicle) => {
      const matchMake = make === "All" || vehicle.make === make;
      const matchPrice =
        priceRange === "all" ||
        (priceRange === "under-300" && vehicle.price < 300000) ||
        (priceRange === "300-500" && vehicle.price >= 300000 && vehicle.price <= 500000) ||
        (priceRange === "500-plus" && vehicle.price > 500000);
      const matchMileage =
        mileage === "all" ||
        (mileage === "under-1000" && vehicle.miles < 1000) ||
        (mileage === "1000-2500" && vehicle.miles >= 1000 && vehicle.miles <= 2500) ||
        (mileage === "2500-plus" && vehicle.miles > 2500);
      return matchMake && matchPrice && matchMileage;
    });
  }, [make, priceRange, mileage]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return b.id - a.id;
    });
  }, [filtered, sort]);

  return (
    <main className="section">
      <div className="hero-strip" style={{ textAlign: "center", marginBottom: "2rem" }}>
        <p className="hero-eyebrow">Private Inventory</p>
        <h1 className="sectionHeading">Private Inventory</h1>
        <p className="sectionIntro">Currently showing {sorted.length} verified vehicles.</p>
      </div>

      <div className="filter-bar">
        <div className="filter-field">
          <label className="filter-label" htmlFor="make">Make</label>
          <select id="make" className="select" value={make} onChange={(event) => setMake(event.target.value)}>
            {makes.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label className="filter-label" htmlFor="price">Price Range</label>
          <select id="price" className="select" value={priceRange} onChange={(event) => setPriceRange(event.target.value)}>
            {priceRanges.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label className="filter-label" htmlFor="mileage">Mileage</label>
          <select id="mileage" className="select" value={mileage} onChange={(event) => setMileage(event.target.value)}>
            {mileageRanges.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label className="filter-label" htmlFor="sort">Sort By</label>
          <select id="sort" className="select" value={sort} onChange={(event) => setSort(event.target.value)}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-3">
        {sorted.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </main>
  );
}
