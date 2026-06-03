"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, Loader2, Monitor } from "lucide-react";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Verify session on mount (must come from the password reset email link)
  useEffect(() => {
    const checkSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
          // Clean up code from the URL so it's not visible
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error("Error exchanging code for session:", err);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        // No session found — redirect back to login with error parameter
        router.push("/login?error=invalid_link");
      } else {
        setVerifying(false);
      }
    };
    
    checkSession();
  }, [router, supabase]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }
    
    setLoading(true);
    setError("");
    
    // Update password using the active session from recovery link
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    setLoading(false);
    
    if (error) {
      setError("Не удалось сбросить пароль: " + error.message);
      return;
    }
    
    // Redirect to login on success
    router.push("/login?password_reset=success");
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] px-4">
        <Loader2 className="w-10 h-10 animate-spin text-white" />
        <p className="text-sm text-gray-400 mt-4">Проверка ссылки сброса...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] px-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8 select-none">
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

      {/* Card */}
      <div className="w-full max-w-[420px] rounded-2xl bg-card border border-border/60 p-6 sm:p-8 shadow-xl text-foreground">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Сброс пароля
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Введите ваш новый пароль
          </p>
        </div>
        
        <form onSubmit={handleReset} className="space-y-5">
          {/* New Password */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground/80">
              Новый пароль
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                required
                disabled={loading}
                className="pl-10 pr-10 h-11 rounded-lg border-border bg-background text-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          
          {/* Confirm Password */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground/80">
              Подтвердите пароль
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                required
                disabled={loading}
                className="pl-10 pr-10 h-11 rounded-lg border-border bg-background text-foreground"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30 dark:border dark:border-red-900/30 rounded-lg">
              {error}
            </div>
          )}
          
          {/* Shifting the button slightly lower via margin top (mt-8) */}
          <Button
            type="submit"
            className="w-full h-11 mt-8 rounded-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Сохранение..." : "Сбросить пароль"}
          </Button>
        </form>
        
        <div className="text-center text-sm mt-6">
          <a href="/login" className="text-primary hover:underline font-semibold">
            Вернуться ко входу
          </a>
        </div>
      </div>
    </div>
  );
}
