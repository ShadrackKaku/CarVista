import { getCurrentUser } from "@/lib/session";
import { ProfileForm } from "@/components/dashboard/profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold">Profile & Settings</h1>
      <p className="mt-1 text-muted-foreground">Manage your account details.</p>
      <div className="mt-8">
        <ProfileForm
          defaultValues={{
            name: user?.name ?? "",
            email: user?.email ?? "",
          }}
        />
      </div>
    </div>
  );
}
