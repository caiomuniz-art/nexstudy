import type { Metadata } from "next";

import { LoginForm } from "@/components/auth-forms";
import { PublicHeader } from "@/components/public-frame";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <>
      <PublicHeader />
      <LoginForm nextPath="/dashboard" />
    </>
  );
}
