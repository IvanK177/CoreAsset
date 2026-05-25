"use client";

import { useState, useActionState } from "react";
import { signIn, signUp, demoSignIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Monitor,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Loader2,
} from "lucide-react";
import { useTransition } from "react";

interface FormState {
  error: string;
  success: string;
}

const initialState: FormState = { error: "", success: "" };

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isDemoPending, startDemoTransition] = useTransition();
  const [state, formAction, pending] = useActionState(
    async (prevState: FormState, formData: FormData): Promise<FormState> => {
      const result = isSignUp
        ? await signUp(formData)
        : await signIn(formData);
      if (!result) return initialState;
      return {
        error: result.error ?? "",
        success: result.success ?? "",
      };
    },
    initialState
  );

  const handleDemoLogin = (role: "admin" | "employee") => {
    startDemoTransition(async () => {
      await demoSignIn(role);
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] px-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-center w-[72px] h-[72px] rounded-2xl bg-[#2563eb] mb-4">
          <Monitor className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          CoreAsset
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Система учёта ИТ-активов
        </p>
      </div>

      {/* Login Card */}
      <div className="w-[420px] rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {isSignUp ? "Регистрация" : "Войти в систему"}
        </h2>


        {/* Email/Password Form */}
        <form id="login-form" action={formAction} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@corp.ru"
                required
                autoComplete="email"
                className="pl-10 h-11 rounded-lg border-gray-200"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Пароль
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={isSignUp ? 6 : undefined}
                className="pl-10 pr-10 h-11 rounded-lg border-gray-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {state.error}
            </p>
          )}

          {/* Success Message */}
          {state.success && (
            <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              {state.success}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={pending || isDemoPending}
            className="w-full h-11 rounded-lg font-medium bg-[#2563eb] hover:bg-[#1d4ed8] gap-2"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {pending
              ? isSignUp
                ? "Регистрация…"
                : "Вход…"
              : isSignUp
                ? "Зарегистрироваться"
                : "Войти"}
          </Button>
        </form>

        {/* Toggle Sign In / Sign Up */}
        <p className="mt-4 text-center text-sm text-gray-500">
          {isSignUp ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#2563eb] hover:text-[#1d4ed8] font-medium"
          >
            {isSignUp ? "Войти" : "Зарегистрироваться"}
          </button>
        </p>

        {/* Demo Section */}
        <div className="mt-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative bg-white px-4 text-xs text-gray-500">
              Быстрый вход (демо)
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              variant="default"
              className="flex-1 h-10 rounded-lg bg-gray-800 hover:bg-gray-900 text-white gap-2"
              disabled={pending || isDemoPending}
              onClick={() => handleDemoLogin("admin")}
            >
              {isDemoPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>🖥</span>}
              {isDemoPending ? "Вход…" : "Администратор"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-10 rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 gap-2"
              disabled={pending || isDemoPending}
              onClick={() => handleDemoLogin("employee")}
            >
              {isDemoPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>👤</span>}
              {isDemoPending ? "Вход…" : "Сотрудник"}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
