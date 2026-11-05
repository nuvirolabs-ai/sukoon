"use client";

import { useEffect, useState } from "react";

export const INDIAN_CITIES = [
  "Indore",
  "Bhopal",
  "Ujjain",
  "Mumbai",
  "Delhi-NCR",
  "Bengaluru",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
] as const;

export type IndianCity = (typeof INDIAN_CITIES)[number] | string;

const CITY_STORAGE_KEY = "sukoon_user_selected_city_v1";
export const DEFAULT_CITY: IndianCity = "Indore";

export function getSelectedCity(): string {
  if (typeof window === "undefined") return DEFAULT_CITY;
  try {
    const saved = localStorage.getItem(CITY_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return DEFAULT_CITY;
}

export function setSelectedCity(city: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CITY_STORAGE_KEY, city);
    window.dispatchEvent(new CustomEvent("sukoon-city-changed", { detail: city }));
  } catch {}
}

export function useSelectedCity() {
  const [city, setCityState] = useState<string>(DEFAULT_CITY);

  useEffect(() => {
    setCityState(getSelectedCity());
    const handler = (e: any) => {
      if (e?.detail) {
        setCityState(e.detail);
      } else {
        setCityState(getSelectedCity());
      }
    };
    window.addEventListener("sukoon-city-changed", handler as EventListener);
    window.addEventListener("storage", handler as EventListener);
    return () => {
      window.removeEventListener("sukoon-city-changed", handler as EventListener);
      window.removeEventListener("storage", handler as EventListener);
    };
  }, []);

  const changeCity = (newCity: string) => {
    setSelectedCity(newCity);
    setCityState(newCity);
  };

  return {
    city,
    changeCity,
    allCities: INDIAN_CITIES,
  };
}
