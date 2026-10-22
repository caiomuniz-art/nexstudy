"use client";

export default function PainelError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="oe-card oe-pad max-w-xl" role="alert">
      <h1 className="text-lg font-semibold">Não foi possível carregar esta página.</h1>
      <p className="mt-2 text-sm text-muted">Tente de novo.</p>
      <button type="button" className="oe-btn mt-4" onClick={reset}>
        Tentar de novo
      </button>
    </div>
  );
}
