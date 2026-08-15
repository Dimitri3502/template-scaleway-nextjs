import { SignUp } from "@clerk/nextjs";

import { routes } from "../../../routes";

export default function SignUpPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10 pt-safe-top pb-safe-bottom">
      <SignUp signInUrl={routes.signIn} forceRedirectUrl={routes.app} />
    </main>
  );
}
