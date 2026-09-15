import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-paper-2 p-6">
      <div className="w-full max-w-sm bg-paper border border-line p-8">
        <p className="label mb-2">Front Office</p>
        <h1 className="display text-3xl mb-6">Sign in</h1>
        <LoginForm />
      </div>
    </main>
  );
}
