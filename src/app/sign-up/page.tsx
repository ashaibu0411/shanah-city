import { Suspense } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { SignUpForm } from "@/components/auth/AuthForms";

function SignUpContent() {
  return (
    <AuthPageShell mode="sign-up">
      <SignUpForm />
    </AuthPageShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<p className="py-8 text-center text-night-600">Loading...</p>}>
      <SignUpContent />
    </Suspense>
  );
}
