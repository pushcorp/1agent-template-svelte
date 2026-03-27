/** Gateway API のレスポンス型 */
export interface ServiceResponse<T = Record<string, unknown>> {
  ok: boolean;
  error?: string;
  data?: T;
  /** クォータ超過時（403）に返る現在の使用量 */
  used?: number;
  /** クォータ超過時（403）に返る上限値 */
  limit?: number;
}

/** sendEmail() のパラメータ */
export interface SendEmailParams {
  /** 宛先メールアドレス（1通につき1アドレスのみ） */
  to: string;
  /** 件名（最大200文字） */
  subject: string;
  /** 本文 HTML（最大50KB） */
  html: string;
  /** 返信先メールアドレス（任意） */
  replyTo?: string;
}
