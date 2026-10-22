const INTERNAL_DOMAIN = "conta.nexstudy.app";

export function loginLocalPart(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

export function internalEmail(name: string) {
  const local = loginLocalPart(name);
  return local ? `${local}@${INTERNAL_DOMAIN}` : "";
}

export function isInternalEmail(value: string | null | undefined) {
  return Boolean(value?.toLowerCase().endsWith(`@${INTERNAL_DOMAIN}`));
}
