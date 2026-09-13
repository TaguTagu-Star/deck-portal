// CI/Vitest設定が正しく動作することを確認するためのサンプルテスト。
// 実際のドメインロジックのテストはフェーズ1以降、対応するテストに置き換える。
import { describe, expect, it } from "vitest";

describe("CI sanity check", () => {
  it("Vitestが正常に動作する", () => {
    expect(1 + 1).toBe(2);
  });
});
