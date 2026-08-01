import { getCurrentUser } from "@/lib/session";
import { ProfileForm } from "@/components/dashboard/profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-2xl">
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
