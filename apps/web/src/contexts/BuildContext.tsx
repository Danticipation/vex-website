"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { Vehicle } from "@/lib/api";
import type { ConfigOption } from "@/lib/api";

export interface BuildState {
  vehicle: Vehicle | null;
  inventoryId: string | null;
  selectedOptions: Record<string, string>;
  options: ConfigOption[];
}

const defaultState: BuildState = {
  vehicle: null,
  inventoryId: null,
  selectedOptions: {},
  options: [],
};

type BuildContextValue = BuildState & {
  setVehicle: (v: Vehicle | null) => void;
  setInventoryId: (id: string | null) => void;
  setSelectedOption: (category: string, optionId: string) => void;
  setOptions: (opts: ConfigOption[]) => void;
  totalPrice: number;
  reset: () => void;
};

const BuildContext = createContext<BuildContextValue | null>(null);

export function BuildProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BuildState>(defaultState);

  const setVehicle = useCallback((vehicle: Vehicle | null) => {
    setState((s) => ({ ...s, vehicle, options: [], selectedOptions: {} }));
  }, []);

  const setInventoryId = useCallback((inventoryId: string | null) => {
    setState((s) => ({ ...s, inventoryId }));
  }, []);

  const setSelectedOption = useCallback((category: string, optionId: string) => {
    setState((s) => ({
      ...s,
      selectedOptions: { ...s.selectedOptions, [category]: optionId },
    }));
  }, []);

  const setOptions = useCallback((options: ConfigOption[]) => {
    setState((s) => ({ ...s, options }));
  }, []);

  const basePrice = state.vehicle?.basePrice ?? 0;
  const optionsTotal = state.options
    .filter((o) => state.selectedOptions[o.category] === o.id)
    .reduce((sum, o) => sum + o.priceDelta, 0);
  const totalPrice = basePrice + optionsTotal;

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  const value: BuildContextValue = {
    ...state,
    setVehicle,
    setInventoryId,
    setSelectedOption,
    setOptions,
    totalPrice,
    reset,
  };

  return <BuildContext.Provider value={value}>{children}</BuildContext.Provider>;
}

export function useBuild() {
  const ctx = useContext(BuildContext);
  if (!ctx) throw new Error("useBuild must be used within BuildProvider");
  return ctx;
}
