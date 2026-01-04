import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MainLayout } from "@/components/layout/MainLayout";

export default async function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <MainLayout>{children}</MainLayout>;
}
