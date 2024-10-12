import { SignedIn, SignedOut, SignIn, SignInButton, UserButton } from "@clerk/clerk-react";
import { dark } from '@clerk/themes'

export default function App() {
  return (
    <header>
      <SignedOut>
        <SignIn
          appearance={{
            baseTheme: dark,
            layout: {
              unsafe_disableDevelopmentModeWarnings: true
            }
          }}
          path="/"
        >
        </SignIn>
      </SignedOut>
      <SignedIn>
        <UserButton appearance={{
          baseTheme: dark,
          layout: {
            unsafe_disableDevelopmentModeWarnings: true
          }
        }} />
      </SignedIn>
    </header>
  );
}