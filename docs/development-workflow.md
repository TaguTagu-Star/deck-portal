# 開発ワークフロー（Git運用・環境・CI・デプロイ）

作成日：2026-09-13
位置づけ：プロジェクトの「Rules」（`docs/project_plan_final.md`と同階層のプロジェクト方針）に対する開発運用面の追補ルール。以降のPRレビューはこのドキュメントの内容を前提とする。

---

## 1. ブランチ戦略

トランクベース＋短命フィーチャーブランチを採用する。

- `main`：常にデプロイ可能な状態を保つ。直接pushは禁止し、PR経由でのみマージする。
- `feature/xxx`：フェーズ・機能単位で作成する（例：`feature/deck-edit-validation`）。
- PRを`main`にマージする前に、CI（第3章）が全てグリーンであることを必須化する（GitHub側のブランチ保護ルールで強制する）。
- PRテンプレート（`.github/PULL_REQUEST_TEMPLATE.md`）のチェックリストで、プロジェクトルール（docs更新・テスト追加・migration追加・any禁止・サーバー専用キーの非公開・repository層集約）を毎回確認する。

## 2. 環境分離

| 環境 | 用途 | Supabase | Vercel |
|---|---|---|---|
| Local | 開発者ローカル | Supabase CLIのローカルスタック（`supabase start`） | `next dev` |
| Preview | PRごとの動作確認 | staging用Supabaseプロジェクト（またはSupabase Branching機能が利用可能ならPRごとのDBブランチ） | PRごとの自動プレビューデプロイ |
| Production | 本番 | 本番用Supabaseプロジェクト（Previewとは別プロジェクト） | `main`マージ時に自動デプロイ |

Supabaseの「Branching」機能（契約プランにより利用可否が異なる）が使える場合は、PRごとに一時DBブランチを発行し、プレビュー環境とDBの整合を取りやすくする。使えない場合は、共有のstagingプロジェクトに対してマイグレーションを都度適用する運用にする。

## 3. CI（GitHub Actions）

`.github/workflows/ci.yml`にて、PR作成時・`main`push時に以下を自動実行する。

1. Lint（ESLint。`@typescript-eslint/no-explicit-any`を`error`にしており、any使用はCIで機械的に検知される）
2. 型チェック（`tsc --noEmit`）
3. ユニットテスト（Vitest）
4. ビルド確認（`next build`）
5. DBスキーマ変更にmigrationファイルが伴っているかの簡易チェック（`src/domain/schemas`・`src/repositories`の変更に対して`supabase/migrations`配下の追加がない場合に警告）
6. シークレットスキャン（Gitleaks）
7. E2E（Playwright）は`main`へのマージ後のみ実行し、PRごとの実行コストを抑える

## 4. デプロイ（Vercel）

- Next.js App RouterのホスティングにVercelを使用する。
- PR作成時：Vercelが自動でプレビューデプロイ・プレビューURLを発行する。レビュアーは実際の画面で確認する。
- `main`マージ時：本番へ自動デプロイする。
- 環境変数はVercel側で「Production / Preview / Development」を分けて管理し、Preview環境にはstaging用Supabaseの値、Production環境には本番用Supabaseの値を設定する。

### 4.1 人間が行う初期セットアップ（本ドキュメント作成時点では未実施）
1. GitHubリポジトリを作成し、本スキャフォールドをpushする。
2. Vercelでプロジェクトを作成し、上記GitHubリポジトリと連携する。
3. Supabaseプロジェクトを Production / Preview（または staging）用に作成する。
4. Vercelの環境変数に`.env.example`記載の値（Supabaseダッシュボードから取得）を設定する。
5. GitHubリポジトリのブランチ保護ルールで、`main`へのマージにCIのパスを必須化する。

## 5. Supabaseマイグレーションの運用

プロジェクトルール「破壊的なDB変更にはmigrationを使用する」を実務に落とし込む。

- スキーマ変更は必ず`supabase/migrations/`にSQLファイルとして追加する（`supabase migration new <name>`で生成し、命名は`YYYYMMDDHHMMSS_description.sql`）。
- 既存のenum的なCHECK制約（`card_type`、`visibility`等）に値を追加する場合も、必ず新規migrationファイルで`ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT ...`を発行し、直接ダッシュボードから変更しない。
- CIで「schemas/repositories変更時にmigrationファイルが伴っているか」を警告として検知する（第3章参照。完全な強制ではなくレビュー時の気づきを目的とする）。
- 本番反映は`main`マージ後、デプロイパイプライン（またはSupabase CLIの手動実行）で`supabase db push`を実行する。当面は人間が手動実行し、フェーズが進んだ段階で自動化を検討する。
- 初期スキーマ（`20260913000000_init_schema.sql`）およびRLSベースライン（`20260913000001_rls_policies.sql`）は本フェーズ0で作成済み。RLSポリシーはフェーズ5（デッキ共有）実装時に詳細レビューを行うこと（`docs/project_plan_final.md`第9章「RLS設計の複雑化」リスク参照）。

## 6. シークレット管理

- Supabaseの Service Role Key は `src/lib/supabase/server.ts` からのみ参照し、Vercelのサーバー側環境変数にのみ設定する。`NEXT_PUBLIC_`プレフィックスを絶対に付けない。
- `.env.local`は`.gitignore`対象。`.env.example`のみをリポジトリにコミットする。
- CIにGitleaksを組み込み、誤って秘密情報がコミットされた場合に検知する。

## 7. リリース・変更管理

- 仕様書（`docs/`配下）は、対応する実装と同じPRで更新する。
- フェーズ完了時にタグを打つ（例：`v0.1.0-phase1`）。どのフェーズまで実装済みかをタグから追えるようにする。
