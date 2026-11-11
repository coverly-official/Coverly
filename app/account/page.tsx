import type { Metadata } from "next";
import { Navbar } from "@/components/sections/Navbar";
import { AccountView } from "@/components/auth/AccountView";

export const metadata: Metadata = {
  title: "My account | Coverly",
};

export default function AccountPage() {
  return (
    <>
      <Navbar />
      <AccountView />
    </>
  );
}