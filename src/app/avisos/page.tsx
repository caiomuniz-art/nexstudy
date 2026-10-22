import type { Metadata } from "next";

import { NoticeEmailForm } from "@/components/notice-email";
import { PublicHeader } from "@/components/public-frame";

export const metadata: Metadata = { title: "Avisos" };

export default function AvisosPage() {
  return (
    <>
      <PublicHeader />
      <NoticeEmailForm nextPath="/dashboard" />
    </>
  );
}
