// users / admin_invitations テーブルへのDBアクセスを集約する層。
// このファイル以外から users テーブルへ直接クエリを書かないこと（プロジェクトルール対応）。
// TODO: フェーズ1（認証系）で実装

import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserRepository {
  findByAuthUid(authUid: string): Promise<unknown>;
  findByEmail(email: string): Promise<unknown>;
  create(input: { authUid: string; email: string; nickname: string }): Promise<unknown>;
}

export function createUserRepository(_client: SupabaseClient): UserRepository {
  throw new Error("TODO: フェーズ1で実装");
}
