import { loginLocalPart } from "@/lib/identity";

const ACCOUNTS_KEY = "nexstudy.contas";
const SESSION_KEY = "nexstudy.sessao";

export type LocalAccount = {
  key: string;
  name: string;
  secretHash: string;
  notificationContact: string;
};

type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type AccountBook = {
  register(input: { name: string; secret: string; notificationContact?: string }): Promise<{ ok: true } | { ok: false; error: string }>;
  login(input: { name: string; secret: string }): Promise<{ ok: true; account: LocalAccount } | { ok: false; error: string }>;
  current(): LocalAccount | null;
  saveContact(contact: string): { ok: true } | { ok: false; error: string };
  logout(): void;
  removeCurrent(): void;
};

function readAccounts(store: KeyValueStore): LocalAccount[] {
  try {
    const parsed = JSON.parse(store.getItem(ACCOUNTS_KEY) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is LocalAccount => {
      if (!item || typeof item !== "object") return false;
      const account = item as Partial<LocalAccount>;
      return typeof account.key === "string" && typeof account.name === "string" && typeof account.secretHash === "string";
    }).map((account) => ({
      key: account.key,
      name: account.name,
      secretHash: account.secretHash,
      notificationContact: typeof account.notificationContact === "string" ? account.notificationContact : "",
    }));
  } catch {
    return [];
  }
}

function notifyAccounts() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("nexstudy-account"));
}

function writeAccounts(store: KeyValueStore, accounts: LocalAccount[]) {
  store.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  notifyAccounts();
}

async function hashSecret(key: string, secret: string) {
  const data = new TextEncoder().encode(`${key}\n${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createAccountBook(store: KeyValueStore): AccountBook {
  return {
    async register(input) {
      const name = input.name.trim();
      const key = loginLocalPart(name);
      if (!key) return { ok: false, error: "Use letras ou números no nome." };
      const contact = (input.notificationContact ?? "").trim();
      if (contact.length > 320) return { ok: false, error: "Use no máximo 320 caracteres." };
      const accounts = readAccounts(store);
      if (accounts.some((account) => account.key === key)) {
        return { ok: false, error: "Já existe uma conta com este nome." };
      }
      const account: LocalAccount = {
        key,
        name,
        secretHash: await hashSecret(key, input.secret),
        notificationContact: contact,
      };
      writeAccounts(store, [...accounts, account]);
      store.setItem(SESSION_KEY, key);
      notifyAccounts();
      return { ok: true };
    },
    async login(input) {
      const key = loginLocalPart(input.name);
      const account = key ? readAccounts(store).find((item) => item.key === key) : undefined;
      if (!account) return { ok: false, error: "Não foi possível entrar. Confira os dados e tente de novo." };
      const secretHash = await hashSecret(key, input.secret);
      if (secretHash !== account.secretHash) {
        return { ok: false, error: "Não foi possível entrar. Confira os dados e tente de novo." };
      }
      store.setItem(SESSION_KEY, account.key);
      notifyAccounts();
      return { ok: true, account };
    },
    current() {
      const key = store.getItem(SESSION_KEY);
      if (!key) return null;
      return readAccounts(store).find((account) => account.key === key) ?? null;
    },
    saveContact(contact) {
      const trimmed = contact.trim();
      if (trimmed.length > 320) return { ok: false, error: "Use no máximo 320 caracteres." };
      const currentKey = store.getItem(SESSION_KEY);
      if (!currentKey) return { ok: false, error: "Entre na sua conta para guardar este contato." };
      const accounts = readAccounts(store);
      const index = accounts.findIndex((account) => account.key === currentKey);
      if (index < 0) return { ok: false, error: "Entre na sua conta para guardar este contato." };
      const current = accounts[index];
      if (!current) return { ok: false, error: "Entre na sua conta para guardar este contato." };
      accounts[index] = { ...current, notificationContact: trimmed };
      writeAccounts(store, accounts);
      return { ok: true };
    },
    logout() {
      store.removeItem(SESSION_KEY);
      notifyAccounts();
    },
    removeCurrent() {
      const key = store.getItem(SESSION_KEY);
      if (!key) return;
      writeAccounts(store, readAccounts(store).filter((account) => account.key !== key));
      store.removeItem(SESSION_KEY);
      notifyAccounts();
    },
  };
}

export function browserAccounts() {
  if (typeof localStorage === "undefined") return null;
  return createAccountBook(localStorage);
}
