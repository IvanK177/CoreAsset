"use client";

import { useState, useActionState } from "react";
import { completeOnboarding } from "@/lib/actions/onboarding";
import { goBackFromOnboarding } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Monitor,
  User,
  Briefcase,
  DoorOpen,
  Phone,
  Send,
  Loader2,
  ArrowLeft,
  Building,
} from "lucide-react";
import { BUILDING_ADDRESSES } from "@/lib/utils";

interface FormState {
  error: string;
  success?: boolean;
  message?: string;
}

const initialState: FormState = { error: "", success: false, message: "" };

export default function OnboardingPage() {
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [state, formAction, pending] = useActionState(
    async (prevState: FormState, formData: FormData): Promise<FormState> => {
      const result = await completeOnboarding(formData);
      if (!result) return initialState;
      return {
        error: result.error ?? "",
        success: result.success ?? false,
        message: result.message ?? "",
      };
    },
    initialState
  );

  if (state.success) {
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

        {/* Success Card */}
        <div className="w-full max-w-[480px] rounded-2xl bg-white p-6 sm:p-8 shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
            <Send className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Регистрация почти завершена!
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {state.message || "Письмо с подтверждением отправлено на ваш email. Пожалуйста, подтвердите его, чтобы войти в систему."}
          </p>
          <Link
            href="/login"
            className="w-full h-11 rounded-lg font-medium bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center transition-colors"
          >
            Перейти к входу
          </Link>
        </div>
      </div>
    );
  }

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
          Заполните профиль для начала работы
        </p>
      </div>

      {/* Onboarding Card */}
      <div className="w-full max-w-[480px] rounded-2xl bg-white p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Добро пожаловать!
          </h2>
          <form action={goBackFromOnboarding}>
            <button
              type="submit"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>
          </form>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Заполните информацию о себе, чтобы получить доступ к порталу сотрудника.
        </p>

        <form action={formAction} className="space-y-5">
          {/* Full Name (required) */}
          <div className="space-y-2">
            <Label
              htmlFor="full_name"
              className="text-sm font-medium text-gray-700"
            >
              ФИО <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="Иванов Иван Петрович"
                required
                autoComplete="name"
                className="pl-10 h-11 rounded-lg border-gray-200"
              />
            </div>
          </div>

          {/* Position (required) */}
          <div className="space-y-2">
            <Label
              htmlFor="position"
              className="text-sm font-medium text-gray-700"
            >
              Должность / Отдел <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="position"
                name="position"
                type="text"
                placeholder="Инженер-программист"
                required
                autoComplete="organization-title"
                className="pl-10 h-11 rounded-lg border-gray-200"
              />
            </div>
          </div>

          {/* Building (required) */}
          <div className="space-y-2">
            <Label
              htmlFor="building"
              className="text-sm font-medium text-gray-700"
            >
              Корпус <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <select
                id="building"
                name="building"
                required
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="w-full pl-10 pr-8 h-11 rounded-lg border border-gray-200 bg-white text-sm focus:border-blue-500 focus:outline-none appearance-none"
              >
                <option value="" disabled>Выберите корпус</option>
                {Object.keys(BUILDING_ADDRESSES).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                ▼
              </div>
            </div>
            {selectedBuilding && (
              <p className="text-xs text-gray-500 mt-1 italic leading-relaxed">
                Адрес: {BUILDING_ADDRESSES[selectedBuilding as keyof typeof BUILDING_ADDRESSES]}
              </p>
            )}
          </div>

          {/* Room (optional) */}
          <div className="space-y-2">
            <Label
              htmlFor="room"
              className="text-sm font-medium text-gray-700"
            >
              Кабинет
            </Label>
            <div className="relative">
              <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="room"
                name="room"
                type="text"
                placeholder="301"
                autoComplete="off"
                className="pl-10 h-11 rounded-lg border-gray-200"
              />
            </div>
          </div>

          {/* Phone (optional) */}
          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="text-sm font-medium text-gray-700"
            >
              Телефон
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                autoComplete="tel"
                className="pl-10 h-11 rounded-lg border-gray-200"
              />
            </div>
          </div>

          {/* Telegram (optional) */}
          <div className="space-y-2">
            <Label
              htmlFor="telegram"
              className="text-sm font-medium text-gray-700"
            >
              Telegram
            </Label>
            <div className="relative">
              <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="telegram"
                name="telegram"
                type="text"
                placeholder="@username"
                autoComplete="off"
                className="pl-10 h-11 rounded-lg border-gray-200"
              />
            </div>
          </div>

          {/* Error Message */}
          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {state.error}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={pending}
            className="w-full h-11 rounded-lg font-medium bg-[#2563eb] hover:bg-[#1d4ed8] gap-2"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {pending ? "Сохранение…" : "Завершить регистрацию"}
          </Button>
        </form>
      </div>
    </div>
  );
}