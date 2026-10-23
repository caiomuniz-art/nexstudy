"use client";

import { useEffect } from "react";

import { translateText } from "@/lib/i18n-phrases";
import { setLanguage, useLanguage, type Language } from "@/lib/language";

const ATTRS = ["placeholder", "aria-label", "title", "alt"] as const;
const originals = new WeakMap<Text, string>();

function skipped(node: Node) {
  const element = node instanceof Element ? node : node.parentElement;
  if (!element) return true;
  if (element.closest("[data-i18n-skip], script, style, noscript")) return true;
  const tag = element.tagName;
  return tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT";
}

function applyText(node: Text, language: Language) {
  if (skipped(node)) return;
  const current = node.nodeValue ?? "";
  let base = originals.get(node);
  if (base == null) {
    originals.set(node, current);
    base = current;
  } else if (current !== base && current !== translateText(base)) {
    originals.set(node, current);
    base = current;
  }
  const next = language === "en" ? translateText(base) : base;
  if (next !== current) node.nodeValue = next;
}

function applyElement(element: Element, language: Language) {
  if (skipped(element)) return;
  for (const attr of ATTRS) {
    const current = element.getAttribute(attr);
    if (current == null) continue;
    const key = `data-i18n-${attr}`;
    let base = element.getAttribute(key);
    if (base == null || (current !== base && current !== translateText(base))) {
      base = current;
      element.setAttribute(key, base);
    }
    const next = language === "en" ? translateText(base) : base;
    if (next !== current) element.setAttribute(attr, next);
  }
}

function applyDocument(root: ParentNode, language: Language) {
  if (root instanceof Element) applyElement(root, language);
  const elements = root.querySelectorAll("*");
  elements.forEach((element) => applyElement(element, language));
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    applyText(node as Text, language);
    node = walker.nextNode();
  }
}

export function LanguageBridge() {
  const language = useLanguage();

  useEffect(() => {
    const root = document.body;
    let frame = 0;
    const run = () => {
      observer.disconnect();
      document.documentElement.lang = language === "en" ? "en" : "pt-BR";
      applyDocument(root, language);
      observer.observe(root, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["placeholder", "aria-label", "title", "alt"],
      });
    };
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(run);
    });
    run();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [language]);

  const english = language === "en";
  return (
    <button
      type="button"
      data-i18n-skip
      className="fixed top-2 right-2 z-[70] inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-card px-3 text-sm font-extrabold text-foreground shadow-sm"
      onClick={() => setLanguage(english ? "pt" : "en")}
      aria-label={english ? "Switch the language to Portuguese" : "Mudar o idioma para inglês"}
    >
      {english ? "Português" : "English"}
    </button>
  );
}
