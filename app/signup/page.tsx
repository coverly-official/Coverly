import type { Metadata } from "next";
import { Navbar } from "@/components/sections/Navbar";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { isRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign up | Coverly",
};

export default function SignupPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const role = isRole(searchParams.role) ? searchParams.role : "buyer";
  return (
    <>
      <Navbar />
      <AuthScreen mode="signup" initialRole={role} />
    </>
  );
}