"use client";

import { useState, useActionState } from "react";
import { completeOnboarding } from "@/lib/actions/onboarding";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Monitor,
  User,
  Briefcase,
  DoorOpen,
  Phone,
  Send,
  Loader2,
  ArrowLeft,
} from "lucide-react";

interface FormState {
  error: string;
}

const initialState: FormState = { error: "" };

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(
    async (prevState: FormState, formData: FormData): Promise<FormState> => {
      const result = await completeOnboarding(formData);
      if (!result) return initialState;
      return { error: result.error ?? "" };
    },
    initialState
  );

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
      <div className="w-[480px] rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Добро пожаловать!
          </h2>
          <form action={signOut}>
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
              Должность <span className="text-red-500">*</span>
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