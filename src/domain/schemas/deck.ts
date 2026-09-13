// デッキ関連のZodスキーマ基盤。
// TODO: フェーズ3〜4で createDeck / saveDeck の入力スキーマを実装する。
import { z } from "zod";

export const deckSectionSchema = z.union([z.literal(1), z.literal(2)]); // 1:main(action) 2:sub(character)
export const deckVisibilitySchema = z.enum(["public", "private"]);
