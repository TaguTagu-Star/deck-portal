// decks / deck_cards テーブルへのDBアクセスを集約する層。
// TODO: フェーズ3〜5（デッキ一覧・編集・共有）で実装

import type { SupabaseClient } from "@supabase/supabase-js";

export interface DeckRepository {
  findByUserId(userId: number): Promise<unknown>;
  findById(deckId: string): Promise<unknown>;
  findPublicShareById(deckId: string): Promise<unknown>;
  save(deck: unknown): Promise<unknown>;
  remove(deckId: string): Promise<void>;
  copy(deckId: string): Promise<unknown>;
}

export function createDeckRepository(_client: SupabaseClient): DeckRepository {
  throw new Error("TODO: フェーズ3で実装");
}
