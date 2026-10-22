"use client";

import { useSyncExternalStore } from "react";

import { browserAccounts, type LocalAccount } from "@/lib/local-account";

function subscribe(onChange: () => void) {
  window.addEventListener("nexstudy-account", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("nexstudy-account", onChange);
    window.removeEventListener("storage", onChange);
  };
}

let cachedKey = "";
let cached: LocalAccount | null = null;

function snapshot(): LocalAccount | null {
  const account = browserAccounts()?.current() ?? null;
  const key = account ? `${account.key}\n${account.name}\n${account.notificationContact}` : "";
  if (key === cachedKey) return cached;
  cachedKey = key;
  cached = account;
  return cached;
}

function serverSnapshot() {
  return null;
}

export function useLocalAccount() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
