export interface Vehicle {
  id: string;
  make: string;
  model: string;
  trimLevel: string;
  year: number;
  basePrice: number;
  bodyType: string | null;
  imageUrls: string[] | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum OptionCategory {
  TYRES = "TYRES",
  PAINT = "PAINT",
  ACCESSORIES = "ACCESSORIES",
  STYLING = "STYLING",
}

export interface ConfigurationOption {
  id: string;
  vehicleId: string | null;
  category: OptionCategory;
  name: string;
  priceDelta: number;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}
