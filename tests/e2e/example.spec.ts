// Playwright設定が正しく動作することを確認するためのサンプルテスト。
// 実際のE2Eシナリオはフェーズ1以降、対応するテストに置き換える。
import { test, expect } from "@playwright/test";

test.skip("TODO: フェーズ1以降で実際のE2Eシナリオに置き換える", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/デッキ構築補佐ポータル/);
});
