import { env } from "$env/dynamic/private";
import type { ServiceResponse } from "./types.js";

/**
 * 1agent Service Gateway を呼び出す汎用関数。
 *
 * @param service  - サービス種別（例: "email"）
 * @param action   - アクション（例: "send"）
 * @param body     - リクエストボディ
 * @returns Gateway のレスポンス
 */
export async function callService<T = Record<string, unknown>>(
  service: string,
  action: string,
  body: object,
): Promise<ServiceResponse<T>> {
  const key = env._1AGENT_BUILTIN_SERVICE_API_KEY;
  const gatewayUrl = env._1AGENT_BUILTIN_SERVICE_API_URL;

  if (!key || !gatewayUrl) {
    throw new Error("1agent service key or gateway URL is not configured");
  }

  const url = `${gatewayUrl}/api/v1/builtin/${service}/${action}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      ok: false,
      error: data.error ?? `Service error (${res.status})`,
      used: data.used,
      limit: data.limit,
    };
  }

  return { ok: true, data };
}
