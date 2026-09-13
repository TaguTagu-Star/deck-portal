// ブラウザ（クライアントコンポーネント）用のSupabaseクライアント。
// anon keyのみを使用する。Service Role Keyはここでは絶対に扱わない。
import { createBrowserClient } from "@supabase/ssr";

export function createClientSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
