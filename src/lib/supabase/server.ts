// サーバー専用のSupabaseクライアント。
// Service Role Keyはこのファイル以外から絶対に参照しないこと（プロジェクトルール対応）。
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 通常のリクエストスコープ用（RLS適用、ユーザーのセッションで動作）
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}

// 管理用途専用（RLSをバイパスする）。カード管理など admin ロールのServer Actionからのみ使用する。
export function createServiceRoleSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}
