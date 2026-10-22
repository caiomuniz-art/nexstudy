import type { Metadata } from "next";

import { RecoveryForm } from "@/components/auth-forms";
import { PublicHeader } from "@/components/public-frame";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecoveryPage() {
  return (
    <>
      <PublicHeader />
      <RecoveryForm />
    </>
  );
}
