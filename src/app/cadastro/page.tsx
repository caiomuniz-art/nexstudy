import type { Metadata } from "next";

import { SignupForm } from "@/components/auth-forms";
import { PublicHeader } from "@/components/public-frame";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <>
      <PublicHeader />
      <SignupForm />
    </>
  );
}
