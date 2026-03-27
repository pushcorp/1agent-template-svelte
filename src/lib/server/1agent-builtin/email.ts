import { callService } from "./index.js";
import type { SendEmailParams } from "./types.js";

/**
 * メールを送信する。
 *
 * 送信元は自動設定（noreply@notify.1agentmail.com）。
 * replyTo でユーザーのメールアドレスを指定可能。
 *
 * @throws Gateway がエラーを返した場合
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const result = await callService("email", "send", params);

  if (!result.ok) {
    throw new Error(result.error ?? "メール送信に失敗しました");
  }
}
