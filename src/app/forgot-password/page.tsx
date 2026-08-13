import { Suspense } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<p className="py-8 text-center text-night-600">Loading...</p>}>
      <AuthPageShell mode="sign-in">
        <ForgotPasswordForm />
      </AuthPageShell>
    </Suspense>
  );
}
