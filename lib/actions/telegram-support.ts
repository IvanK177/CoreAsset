"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * Sends a support message directly to a Telegram group using Telegram Bot API.
 */
export async function sendTelegramSupportMessage(message: string) {
  if (!message || !message.trim()) {
    return { error: "Текст обращения не может быть пустым" };
  }

  const authClient = await createClient();
  const dataClient = createServiceClient();
  const cookieStore = await cookies();
  const demoEmployeeId = cookieStore.get("demo_employee_id")?.value;

  const { data: { user } } = await authClient.auth.getUser();

  let employee = null;
  if (user?.id) {
    const { data } = await dataClient
      .from("employees")
      .select("full_name, email, role")
      .eq("id", user.id)
      .single();
    employee = data;
  }

  if (!employee && demoEmployeeId) {
    const { data } = await dataClient
      .from("employees")
      .select("full_name, email, role")
      .eq("id", demoEmployeeId)
      .single();
    employee = data;
  }

  const name = employee?.full_name ?? user?.email ?? "Анонимный пользователь";
  const email = employee?.email ?? user?.email ?? "Не указан";
  const role = employee?.role ?? "Не указана";

  // Build HTML formatted message
  const text = `<b>📢 Новое обращение в поддержку!</b>\n\n` +
               `<b>👤 Отправитель:</b> ${name}\n` +
               `<b>📧 Email:</b> ${email}\n` +
               `<b>💼 Роль:</b> ${role}\n\n` +
               `<b>📝 Описание проблемы:</b>\n<i>${message.trim()}</i>`;

  let botToken = process.env.TELEGRAM_BOT_TOKEN;
  let chatId = process.env.TELEGRAM_CHAT_ID;
  let apiBaseUrl = process.env.TELEGRAM_API_BASE_URL || "https://api.telegram.org";

  if (!botToken || !chatId) {
    console.error("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in .env");
    return { error: "Поддержка временно недоступна (не настроены ключи Telegram)" };
  }

  // Clean quotes from environment variables
  botToken = botToken.replace(/^["']|["']$/g, '');
  chatId = chatId.replace(/^["']|["']$/g, '');
  apiBaseUrl = apiBaseUrl.replace(/^["']|["']$/g, '');

  try {
    const url = `${apiBaseUrl}/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      return { error: `Сервер поддержки вернул некорректный ответ (Код: ${res.status}). Возможно, прокси-сервер настроен неверно.` };
    }

    if (!res.ok || !data.ok) {
      console.error("Telegram SendMessage API error:", data);
      return { error: data.description || "Не удалось отправить сообщение в Telegram" };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Telegram support request exception:", err);
    let errMsg = "Ошибка отправки запроса";
    if (err instanceof Error) {
      if (err.name === "TypeError" && err.message.includes("fetch failed")) {
        errMsg = "Не удалось подключиться к Telegram API (fetch failed). Если вы находитесь в РФ, возможно, доступ заблокирован провайдером. Пожалуйста, включите VPN или настройте TELEGRAM_API_BASE_URL в файле .env (например, через прокси).";
      } else {
        errMsg = err.message;
      }
    }
    return { error: errMsg };
  }
}
