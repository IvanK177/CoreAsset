"use client";

import { useState, useActionState, useTransition } from "react";
import { signIn, demoSignIn, resetEmployeePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Monitor,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Loader2,
  User,
  Wrench,
} from "lucide-react";

interface FormState {
  error: string;
  success: string;
}

const initialState: FormState = { error: "", success: "" };

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [isDemoPending, startDemoTransition] = useTransition();
  const [activeDemoRole, setActiveDemoRole] = useState<"admin" | "employee" | "it_specialist" | "facilities" | null>(null);
  const [resetMessage, setResetMessage] = useState<{ error?: string; success?: string; tempPassword?: string } | null>(null);
  const [resetPending, setResetPending] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      setResetMessage({ error: "Пожалуйста, введите email в поле выше перед сбросом пароля" });
      return;
    }
    setResetPending(true);
    setResetMessage(null);
    try {
      const res = await resetEmployeePassword(email);
      setResetMessage(res);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Произошла неизвестная ошибка при сбросе пароля";
      setResetMessage({ error: errMsg });
    } finally {
      setResetPending(false);
    }
  };

  const [state, formAction, pending] = useActionState(
    async (prevState: FormState, formData: FormData): Promise<FormState> => {
      const result = await signIn(formData);
      if (!result) return initialState;
      return {
        error: result.error ?? "",
        success: result.success ?? "",
      };
    },
    initialState
  );

  const handleDemoLogin = (role: "admin" | "employee" | "it_specialist" | "facilities") => {
    setActiveDemoRole(role);
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
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 sm:p-8 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Войти в систему
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@corp.ru"
                required
                autoComplete="email"
                className="pl-10 h-11 rounded-lg border-gray-200"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Пароль
              </Label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetPending}
                className="text-xs text-[#2563eb] hover:text-[#1d4ed8] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetPending ? "Сброс..." : "Забыли пароль?"}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                autoComplete="current-password"
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

          {/* Reset Message */}
          {resetMessage && (
            <div className={`text-sm px-3 py-2 rounded-lg ${resetMessage.error ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50 border border-green-200'}`}>
              {resetMessage.error && <p>{resetMessage.error}</p>}
              {resetMessage.success && (
                <div className="space-y-1.5">
                  <p className="font-semibold">{resetMessage.success}</p>
                  {resetMessage.tempPassword && (
                    <div className="flex flex-col gap-1 bg-white p-2 rounded border border-green-200">
                      <span className="text-[11px] text-gray-500 font-normal">Временный пароль (нажмите, чтобы скопировать):</span>
                      <code 
                        onClick={() => {
                          if (resetMessage.tempPassword) {
                            navigator.clipboard.writeText(resetMessage.tempPassword);
                          }
                        }}
                        className="font-mono text-base font-bold text-center block select-all cursor-pointer bg-gray-50 p-1 hover:bg-gray-100 rounded border transition-colors"
                      >
                        {resetMessage.tempPassword}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
            {pending ? "Вход…" : "Войти"}
          </Button>
        </form>

        {/* Link to Register */}
        <p className="mt-4 text-center text-sm text-gray-500">
          Нет аккаунта?{" "}
          <Link
            href={email ? `/register?email=${encodeURIComponent(email)}` : "/register"}
            className="text-[#2563eb] hover:text-[#1d4ed8] font-medium"
          >
            Зарегистрироваться
          </Link>
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

          <div className="mt-4 space-y-2">
            <Button
              variant="outline"
              className="w-full h-10 rounded-lg border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors text-xs font-medium flex items-center justify-center gap-2"
              disabled={pending || isDemoPending}
              onClick={() => handleDemoLogin("admin")}
            >
              {isDemoPending && activeDemoRole === "admin" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
              ) : (
                <Monitor className="w-3.5 h-3.5 text-red-500" />
              )}
              {isDemoPending && activeDemoRole === "admin" ? "Вход…" : "Войти как Администратор"}
            </Button>
            <Button
              variant="outline"
              className="w-full h-10 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-xs font-medium flex items-center justify-center gap-2"
              disabled={pending || isDemoPending}
              onClick={() => handleDemoLogin("employee")}
            >
              {isDemoPending && activeDemoRole === "employee" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <User className="w-3.5 h-3.5 text-emerald-500" />
              )}
              {isDemoPending && activeDemoRole === "employee" ? "Вход…" : "Войти как Сотрудник"}
            </Button>
            <Button
              variant="outline"
              className="w-full h-10 rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs font-medium flex items-center justify-center gap-2"
              disabled={pending || isDemoPending}
              onClick={() => handleDemoLogin("it_specialist")}
            >
              {isDemoPending && activeDemoRole === "it_specialist" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Wrench className="w-3.5 h-3.5 text-blue-500" />
              )}
              {isDemoPending && activeDemoRole === "it_specialist" ? "Вход…" : "Войти как IT-специалист"}
            </Button>
            <Button
              variant="outline"
              className="w-full h-10 rounded-lg border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 transition-colors text-xs font-medium flex items-center justify-center gap-2"
              disabled={pending || isDemoPending}
              onClick={() => handleDemoLogin("facilities")}
            >
              {isDemoPending && activeDemoRole === "facilities" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
              ) : (
                <Wrench className="w-3.5 h-3.5 text-teal-500" />
              )}
              {isDemoPending && activeDemoRole === "facilities" ? "Вход…" : "Войти как сотрудник АХО"}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
