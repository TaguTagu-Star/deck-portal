// デッキ構築ルールのバリデーション（ビジネスルールチェック）を置く場所。
// ルール定義: docs/project_plan_final.md 第4章（R-C1〜R-C5, R-A1〜R-A4）
//
// 方針:
// - 構造チェック（型・値域）は domain/schemas 側のZodスキーマで行う
// - ここでは相互参照が必要なビジネスルール（同名キャラの種類数、Lv.0の有無、
//   専用アクションカードとキャラデッキの対応関係など）を純粋関数として実装する
// - saveDeck Server Action から呼び出し、違反時はエラー理由の配列を返す
//
// TODO: フェーズ4で実装。あわせて Vitest でルールごとに正常系・異常系のテストを追加する
// （docs/project_plan_final.md 第13.1章の観点を参照）。

export interface ValidationError {
  rule: string; // 'R-C1' 等
  message: string;
}

export function validateCharacterDeck(_cards: unknown[]): ValidationError[] {
  throw new Error("TODO: フェーズ4で実装（R-C1〜R-C5）");
}

export function validateActionDeck(
  _actionCards: unknown[],
  _characterCards: unknown[],
): ValidationError[] {
  throw new Error("TODO: フェーズ4で実装（R-A1〜R-A4、キャラデッキとの相互参照あり）");
}
