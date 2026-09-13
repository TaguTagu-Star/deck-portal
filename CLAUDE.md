# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際に自動的に読み込む設定です。

## プロダクト概要
カードゲーム『鳴潮：対決』のデッキ構築補佐ポータルサイト。実カードを使わずネット上でデッキを構築し、URL・画像で共有できるようにする。詳細仕様は`docs/project_plan_final.md`を参照。

## 現在のステータス
**フェーズ0（基盤整備）完了。** ディレクトリ構成・設定ファイル・CI・Supabase初期migration・RLSベースラインは作成済み。アプリのページ・repository・domainロジックはすべてTODOプレースホルダーで、実装はまだ行っていない。

次に着手するのは**フェーズ1（認証系：ログイン／新規登録／登録確認、メール認証のみ）**。フェーズ一覧は`docs/project_plan_final.md`第8章を参照。

## 必ず読むべきドキュメント
作業前に以下を確認すること。特にスキーマやルールに関わる変更をする場合は必読。

- `docs/project_plan_final.md` — 仕様・データモデル・デッキ構築ルール・API一覧・フェーズ計画の確定版
- `docs/development-workflow.md` — ブランチ戦略・CI・Vercel/Supabase連携・migration運用ルール
- `docs/setup-guide.md` — GitHub/Vercel/Supabase初期連携手順（未実施の場合はここから）

## ブランチ戦略
`feature/xxx`（作業ブランチ）→ `develop`（staging、PR経由でマージ）→ `main`（production、PR経由でマージ）。`develop`へのpushで自動的にstaging用Supabaseへmigrationが適用され、`main`へのpushで本番用Supabaseへ適用される（`.github/workflows/deploy-migrations-{staging,production}.yml`）。詳細は`docs/development-workflow.md`第1章・第5章を参照。

## プロジェクトルール（厳守）
- `any`は禁止（ESLintの`@typescript-eslint/no-explicit-any`で検知される。CIで弾かれる）
- UI文言は日本語
- サーバー専用キー（`SUPABASE_SERVICE_ROLE_KEY`）は`src/lib/supabase/server.ts`以外から参照しない。`NEXT_PUBLIC_`プレフィックスを絶対に付けない
- データベースアクセスは`src/repositories/`層に集約する。コンポーネントやServer Actionから直接Supabaseクエリを書かない
- 仕様変更を行う場合は、実装の前に`docs/`配下の該当ドキュメントを更新する
- 新機能には対応するテスト（Vitest/Playwright）を追加する
- 破壊的なDB変更は必ず`supabase/migrations/`にSQLファイルを追加して行う。ダッシュボードから直接変更しない
- カードデータを追加・更新する場合、`image_rights_status`（'unverified'/'verified'/'restricted'）を確認・設定する

## デッキ構築ルール（バリデーション実装時の一次情報）
`domain/rules/deckValidation.ts`を実装する際は、以下を必ず参照すること。

- `docs/project_plan_final.md`第4章：R-C1〜R-C5（キャラデッキ）、R-A1〜R-A4（アクションデッキ）
- main = アクションデッキ（ちょうど40枚）、sub = キャラデッキ（3〜15枚）
- R-A3（専用アクションカードの使用可否）はsubデッキの構成に依存する相互参照ルールである点に注意

## よく使うコマンド
```bash
npm run dev        # 開発サーバー
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test         # Vitestユニットテスト
npm run test:e2e     # Playwright E2E
npm run build        # 本番ビルド
npm run supabase:migrate  # supabase db push
```

## 作業時の進め方
1. 着手前に`docs/project_plan_final.md`の該当フェーズ・仕様を確認する
2. 仕様に不明点や矛盾があれば、実装を進めず先に確認する
3. 実装後、`npm run lint && npm run typecheck && npm run test`が通ることを確認する
4. PRを作成する場合は`.github/PULL_REQUEST_TEMPLATE.md`のチェックリストを満たす
