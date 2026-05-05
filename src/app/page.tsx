import { auth } from "@clerk/nextjs/server";
import { HomeLanding } from "@/components/marketing/HomeLanding";

export default async function HomePage() {
  const { userId } = await auth();
  return <HomeLanding signedIn={Boolean(userId)} />;
}
