# 開発ワークフロー（Git運用・環境・CI・デプロイ）

作成日：2026-09-13
位置づけ：プロジェクトの「Rules」（`docs/project_plan_final.md`と同階層のプロジェクト方針）に対する開発運用面の追補ルール。以降のPRレビューはこのドキュメントの内容を前提とする。

---

## 1. ブランチ戦略

`main`（本番）と`develop`（staging）の2つの長期ブランチを軸に、短命フィーチャーブランチで作業する。

- `develop`：staging環境に対応する統合ブランチ。常にstagingへデプロイ可能な状態を保つ。
- `main`：production環境に対応する。常に本番デプロイ可能な状態を保つ。直接pushは禁止し、`develop`からのPR経由でのみマージする。
- `feature/xxx`：フェーズ・機能単位で`develop`から作成する（例：`feature/deck-edit-validation`）。作業後は`develop`へPRを出す。
- `develop`へのマージ後、動作確認が取れたら`develop`→`main`のPRを作成し、本番へ反映する。
- いずれのPRも、マージ前にCI（第3章）が全てグリーンであることを必須化する（GitHub側のブランチ保護ルールで`main`・`develop`双方に設定する）。
- PRテンプレート（`.github/PULL_REQUEST_TEMPLATE.md`）のチェックリストで、プロジェクトルール（docs更新・テスト追加・migration追加・any禁止・サーバー専用キーの非公開・repository層集約）を毎回確認する。

## 2. 環境分離

| 環境 | 対応ブランチ | 用途 | Supabase | Vercel |
|---|---|---|---|---|
| Local | feature/xxx | 開発者ローカル | Supabase CLIのローカルスタック（`supabase start`） | `next dev` |
| Preview | feature/xxx → develop/main へのPR | PRごとの動作確認 | 基本的にstaging用Supabaseプロジェクトに接続（DBへの書き込みを伴う確認はstaging環境で行う） | PRごとの自動プレビューデプロイ |
| Staging | develop | 結合確認用の常設環境 | staging用Supabaseプロジェクト。`develop`へのpushで`.github/workflows/deploy-migrations-staging.yml`が自動でmigrationを適用 | Vercel側で`develop`ブランチに常設のプレビューURL（サブドメイン）を割り当てる |
| Production | main | 本番 | production用Supabaseプロジェクト（stagingとは別プロジェクト）。`main`へのpushで`.github/workflows/deploy-migrations-production.yml`が自動でmigrationを適用 | `main`マージ時に自動デプロイ |

Supabaseの「Branching」機能（契約プランにより利用可否が異なる）が使える場合は、PRごとに一時DBブランチを発行し、プレビュー環境とDBの整合を取りやすくする。使えない場合は、上記のとおりstaging用Supabaseプロジェクトを共有で使う。

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
- **migrationの反映はGitHub Actionsで自動化する**（ローカルCLIからの手動pushは開発時の動作確認用途に限定し、staging/productionへの正式な反映はCI経由に統一する）。
  - `develop`へのpush → `.github/workflows/deploy-migrations-staging.yml`が自動実行され、staging用SupabaseプロジェクトへDB接続文字列（`--db-url`）を使って`supabase db push`
  - `main`へのpush → `.github/workflows/deploy-migrations-production.yml`が自動実行され、production用Supabaseプロジェクトへ同様に`supabase db push`
  - CI側では`supabase link`やアクセストークンは使わない。`db push`はPostgresへの直接接続（DB接続文字列＝パスワード）で認証するため、Management API向けのアクセストークンをCIに持たせる必要がなく、Secretを`{STAGING,PRODUCTION}_DB_URL`の2つに絞れる（第6章参照）
  - どちらも`workflow_dispatch`での手動再実行が可能
- ローカルCLIの`supabase link`は同時に1プロジェクトとしかリンクできない点に注意する。ローカルで動作確認する場合は都度`supabase link --project-ref <ref>`でリンク先を切り替える。`supabase projects list`で現在のリンク先を確認できる。**本番プロジェクトへのローカルからの直接pushは事故防止のため原則行わない。**
- ローカルでの`supabase login`は個人のアクセストークンを発行して行う。ブラウザが自動起動しない環境（WSL・SSH先・コンテナ等）では`supabase login --token <アクセストークン>`でブラウザを介さずにログインできる（`docs/setup-guide.md`参照）。この個人トークンはCIには使わない（CIは`--db-url`方式のためアクセストークン自体が不要）。
- 初期スキーマ（`20260913000000_init_schema.sql`）およびRLSベースライン（`20260913000001_rls_policies.sql`）は本フェーズ0で作成済み。RLSポリシーはフェーズ5（デッキ共有）実装時に詳細レビューを行うこと（`docs/project_plan_final.md`第9章「RLS設計の複雑化」リスク参照）。

## 6. シークレット管理

- Supabaseの Service Role Key は `src/lib/supabase/server.ts` からのみ参照し、Vercelのサーバー側環境変数にのみ設定する。`NEXT_PUBLIC_`プレフィックスを絶対に付けない。
- `.env.local`は`.gitignore`対象。`.env.example`のみをリポジトリにコミットする。
- CIにGitleaksを組み込み、誤って秘密情報がコミットされた場合に検知する。
- migrationデプロイ用のGitHub Secrets（リポジトリの Settings → Secrets and variables → Actions で設定）：

| Secret名 | 用途 |
|---|---|
| `STAGING_DB_URL` | staging用SupabaseプロジェクトのDB接続文字列（`postgresql://postgres:[PASSWORD]@db.<ref>.supabase.co:5432/postgres`。Project Settings → Database → Connection stringから取得） |
| `PRODUCTION_DB_URL` | production用SupabaseプロジェクトのDB接続文字列（同上） |

これらはCIログに出力されないようGitHub Secretsとして管理し、ワークフローファイル内にハードコードしない。`db push`はこの接続文字列（＝DBパスワード）で直接Postgresに認証するため、**このSecretの管理がmigrationデプロイにおける実質的なセキュリティ境界**になる。アクセストークンの権限（Permission）をどう絞るかより、このDB接続文字列の漏洩防止の方が重要度が高い。

- Supabaseの個人アクセストークン（`supabase login`で使うもの）は、CIには使用しない。開発者がローカルCLIで`link`・`projects list`等のManagement API系コマンドを使う際にのみ必要。ブラウザが自動起動しない環境では`supabase login --token <アクセストークン>`を使う（`docs/setup-guide.md`参照）。Scoped Personal Access Tokenが選択できる場合は、対象プロジェクトと必要な権限（主に「Database」）だけに絞って発行する。

## 7. リリース・変更管理

- 仕様書（`docs/`配下）は、対応する実装と同じPRで更新する。
- フェーズ完了時にタグを打つ（例：`v0.1.0-phase1`）。どのフェーズまで実装済みかをタグから追えるようにする。
