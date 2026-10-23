"use client";

import { useSyncExternalStore } from "react";

const KEY = "nexstudy.idioma";

export type Language = "pt" | "en";

function readLanguage(): Language {
  try {
    return localStorage.getItem(KEY) === "en" ? "en" : "pt";
  } catch {
    return "pt";
  }
}

export function setLanguage(language: Language) {
  localStorage.setItem(KEY, language);
  window.dispatchEvent(new Event("nexstudy-idioma"));
}

function subscribe(onChange: () => void) {
  window.addEventListener("nexstudy-idioma", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("nexstudy-idioma", onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useLanguage() {
  return useSyncExternalStore(subscribe, readLanguage, () => "pt" as const);
}
