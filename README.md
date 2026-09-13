# デッキ構築補佐ポータル

カードゲームのデッキ構築補佐ポータルサイト。実カードを使わずネット上でデッキを構築し、URL・画像で共有できるようにする。

## ステータス
フェーズ0（基盤整備）完了。実装は未着手（ページ・repository・domain層はTODOプレースホルダー）。

## ドキュメント
- 仕様全体：[`docs/project_plan_final.md`](./docs/project_plan_final.md)
- 開発ワークフロー（Git運用・CI・デプロイ・migration運用）：[`docs/development-workflow.md`](./docs/development-workflow.md)
- 初期セットアップ手順（GitHub/Vercel/Supabase連携）：[`docs/setup-guide.md`](./docs/setup-guide.md)

## スタック
Next.js (App Router) / TypeScript / Tailwind CSS / Supabase / Zod / Vitest / Playwright

## セットアップ
初回セットアップは[`docs/setup-guide.md`](./docs/setup-guide.md)を参照してください。

```bash
npm install
cp .env.example .env.local  # 値はSupabaseダッシュボードから取得して設定
npm run dev
```

## 主要コマンド
| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run lint` | ESLint |
| `npm run typecheck` | 型チェック（`tsc --noEmit`） |
| `npm run test` | ユニットテスト（Vitest） |
| `npm run test:e2e` | E2Eテスト（Playwright） |
| `npm run build` | 本番ビルド |
| `npm run supabase:migrate` | Supabaseへmigration適用（`supabase db push`） |

## ディレクトリ構成の概要
```
src/app/            App Routerのページ
src/components/      UIコンポーネント
src/features/        機能単位のロジック
src/repositories/     DBアクセス集約層（Supabase呼び出しはここのみ）
src/domain/schemas/   Zodスキーマ
src/domain/rules/     デッキ構築ルール等のビジネスロジック
src/lib/supabase/     Supabaseクライアント（client.ts=ブラウザ用 / server.ts=サーバー専用）
supabase/migrations/  DBスキーマのmigration
docs/                 仕様・運用ドキュメント
tests/unit/           Vitestユニットテスト
tests/e2e/            Playwright E2Eテスト
```

## プロジェクトルール（抜粋）
- `any`は禁止（ESLintで機械的に検知）
- UI文言は日本語
- サーバー専用キー（Service Role Key等）をクライアントに公開しない
- データベースアクセスはrepository層に集約する
- 仕様変更前にdocsを更新する
- 新機能にはテストを追加する
- 破壊的なDB変更にはmigrationを使用する
- カードデータの権利関係を確認してから公開する

詳細は[`docs/project_plan_final.md`](./docs/project_plan_final.md)、Git運用は[`docs/development-workflow.md`](./docs/development-workflow.md)を参照。
