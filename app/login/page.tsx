import type { Metadata } from "next";
import { Navbar } from "@/components/sections/Navbar";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { isRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Log in | Coverly",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const role = isRole(searchParams.role) ? searchParams.role : "buyer";
  return (
    <>
      <Navbar />
      <AuthScreen mode="login" initialRole={role} />
    </>
  );
}