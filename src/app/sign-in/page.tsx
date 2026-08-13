import { Suspense } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { SignInForm } from "@/components/auth/AuthForms";

function SignInContent() {
  return (
    <AuthPageShell mode="sign-in">
      <SignInForm />
    </AuthPageShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<p className="py-8 text-center text-night-600">Loading...</p>}>
      <SignInContent />
    </Suspense>
  );
}
