/**
 * リクエストからIPアドレスを取得する
 * 優先順位: cf-connecting-ip > x-forwarded-for > x-real-ip > SvelteKit getClientAddress (if available)
 * @param request リクエストオブジェクト
 * @returns IPアドレス文字列
 * @example
 * export const POST = async (event: RequestEvent) => {
 *   const ipAddress = getRequestIp(event.request);
 * };
 */
export function getRequestIp(request: Request): string {
  // Cloudflareからの接続IP（最優先）
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // プロキシまたはロードバランサーからのIPアドレス
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // x-forwarded-forは複数のIPがカンマ区切りで含まれる場合があるため、最初のものを取得
    return xForwardedFor.split(",")[0].trim();
  }

  // リアルIP（nginxなどで設定される）
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }

  // フォールバック: 不明
  return "unknown";
}
