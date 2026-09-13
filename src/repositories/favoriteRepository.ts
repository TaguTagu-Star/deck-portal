// favorites テーブルへのDBアクセスを集約する層。
// 将来機能（本計画のフェーズ0〜8のスコープ外）。テーブル定義のみ先行して用意している。
// TODO: 将来フェーズで実装

import type { SupabaseClient } from "@supabase/supabase-js";

export interface FavoriteRepository {
  toggle(userId: number, deckId: string): Promise<void>;
}

export function createFavoriteRepository(_client: SupabaseClient): FavoriteRepository {
  throw new Error("TODO: 将来フェーズで実装");
}
