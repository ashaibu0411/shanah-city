import { Suspense } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ResetPasswordForm } from "@/components/auth/AuthForms";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="py-8 text-center text-night-600">Loading...</p>}>
      <AuthPageShell mode="sign-in">
        <ResetPasswordForm />
      </AuthPageShell>
    </Suspense>
  );
}
