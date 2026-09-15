"use client";
import { useActionState } from "react";
import { authenticate } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export function LoginForm() {
  const [error, action, pending] = useActionState(authenticate, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </Field>
      <Field label="Password" htmlFor="password" error={error}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={!!error} />
      </Field>
      <Button type="submit" loading={pending} className="w-full">Sign in</Button>
    </form>
  );
}
