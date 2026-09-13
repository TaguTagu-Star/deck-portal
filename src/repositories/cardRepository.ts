// cards テーブルへのDBアクセスを集約する層。
// TODO: フェーズ2（カード検索・詳細）で実装
// 検索条件は main(アクションデッキ)/sub(キャラデッキ) で出し分ける
// (docs/project_plan_final.md 第5.1章 参照)

import type { SupabaseClient } from "@supabase/supabase-js";

export interface CardRepository {
  searchActionCards(params: unknown): Promise<unknown>;
  searchCharacterCards(params: unknown): Promise<unknown>;
  findById(cardId: number): Promise<unknown>;
}

export function createCardRepository(_client: SupabaseClient): CardRepository {
  throw new Error("TODO: フェーズ2で実装");
}
