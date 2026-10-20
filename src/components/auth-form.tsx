"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";

const schema = z.object({
  name: z.string().max(60).optional(),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const isSignUp = mode === "signup";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    const name = values.name?.trim() ?? "";

    if (isSignUp && name.length < 2) {
      setError("name", { type: "manual", message: "Informe seu nome" });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await authClient.signUp.email({
          name,
          email: values.email,
          password: values.password,
        });
        if (error) {
          toast.error(error.message ?? "Não foi possível criar a conta");
          return;
        }
        router.push("/onboarding");
        router.refresh();
      } else {
        const { error } = await authClient.signIn.email({
          email: values.email,
          password: values.password,
        });
        if (error) {
          toast.error("E-mail ou senha incorretos");
          return;
        }
        toast.success("Bem-vindo de volta!");
        router.push(searchParams.get("redirect") ?? "/painel");
        router.refresh();
      }
    } catch {
      toast.error("Algo deu errado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {isSignUp && (
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Como podemos te chamar?"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          placeholder={isSignUp ? "Mínimo de 8 caracteres" : "••••••••"}
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" variant="brand" size="lg" className="w-full" loading={loading}>
        {isSignUp ? "Criar conta" : "Entrar"}
        {!loading && <ArrowRight className="size-4" />}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isSignUp ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
        <Link
          href={isSignUp ? "/entrar" : "/criar-conta"}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          {isSignUp ? "Entrar" : "Criar agora"}
        </Link>
      </p>
    </form>
  );
}
