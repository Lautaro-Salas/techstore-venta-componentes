import type { Metadata } from "next";
import { PageTransition } from "@/components/navigation/page-transition";
import { ProfileForm } from "@/features/account/profile-form";
import { requireUserPage } from "@/lib/auth/guards";
import { getProfile } from "@/services/account/account.service";

export const metadata: Metadata = { title: "Datos personales" };

export default async function ProfilePage() {
  const user = await requireUserPage("/cuenta/datos");
  const profile = await getProfile(user.id);
  return (
    <PageTransition>
      <div>
        <h1 className="mb-5 text-2xl font-bold tracking-tight">Datos personales</h1>
        <div className="card max-w-2xl p-5 sm:p-6">
          <ProfileForm profile={profile} />
        </div>
      </div>
    </PageTransition>
  );
}
