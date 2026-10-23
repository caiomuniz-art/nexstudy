import Image from "next/image";

import { cn } from "@/lib/text";

export function Logo({ withName = true, size = 36, className }: { withName?: boolean; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex max-w-full min-w-0 items-center gap-2", className)}>
      <span className="inline-flex shrink-0 rounded-xl bg-white p-1 ring-1 ring-black/5">
        <Image src="/nexstudy/logo-nexstudy.png" alt="" width={1182} height={1182} style={{ width: size, height: size }} priority />
      </span>
      {withName ? <span className="logo-word min-w-0 truncate font-semibold tracking-tight">NexStudy</span> : <span className="sr-only">NexStudy</span>}
    </span>
  );
}
