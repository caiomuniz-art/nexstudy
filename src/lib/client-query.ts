"use client";

import { useEffect, useRef } from "react";

import { defaultLocalDate } from "@/lib/labels";

export type PageQuery = {
  nova: boolean;
  editId: string;
  presetDate: string;
  presetDay: number | null;
  recuperacao: boolean;
  next: string;
  erro: string;
};

export function useApplyPageQuery(apply: (query: PageQuery) => void) {
  const applyRef = useRef(apply);
  applyRef.current = apply;
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if ([...params.keys()].length === 0) return;
    const day = Number(params.get("dia"));
    applyRef.current({
      nova: params.get("nova") === "1",
      editId: params.get("editar") ?? "",
      presetDate: defaultLocalDate(params.get("data")),
      presetDay: Number.isInteger(day) && day >= 0 && day <= 6 ? day : null,
      recuperacao: params.get("recuperacao") === "1",
      next: params.get("next") ?? "",
      erro: params.get("erro") ?? "",
    });
  }, []);
}
