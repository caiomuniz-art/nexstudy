"use client";

import { useSyncExternalStore } from "react";

import { getSupabasePublicEnv } from "@/lib/env";
import { readBrowserBook, type LocalBook } from "@/lib/local-workspace";

function subscribe(onChange: () => void) {
  window.addEventListener("nexstudy-dados", onChange);
  window.addEventListener("nexstudy-account", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("nexstudy-dados", onChange);
    window.removeEventListener("nexstudy-account", onChange);
    window.removeEventListener("storage", onChange);
  };
}

let cacheKey = "";
let cache: LocalBook | null = null;

function snapshot(): LocalBook | null {
  if (getSupabasePublicEnv()) return null;
  const book = readBrowserBook();
  const key = JSON.stringify(book);
  if (key === cacheKey && cache) return cache;
  cacheKey = key;
  cache = book;
  return cache;
}

function serverSnapshot() {
  return null;
}

export function useLocalBook() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
