# 初期セットアップ手順（人間が行う作業）

このリポジトリのスキャフォールド（ディレクトリ構成・設定ファイル・migration・CI設定）はフェーズ0の一部として作成済みです。以下はアカウント連携が必要なため人間が行う手順です。

## 1. GitHubリポジトリの作成とpush

```bash
cd deck-portal
git init
git add .
git commit -m "chore: フェーズ0 プロジェクト初期化"
git branch -M main
git remote add origin <作成したGitHubリポジトリのURL>
git push -u origin main
```

その後、GitHub側でブランチ保護ルールを設定する。

- Settings → Branches → `main` に対してルールを追加
- 「Require status checks to pass before merging」を有効化し、`.github/workflows/ci.yml`のジョブ（build-and-test, secret-scan）を必須チェックに指定
- 「Require a pull request before merging」を有効化

## 2. 依存パッケージのインストール

```bash
npm install
```

`package.json`の依存バージョンは作成時点の目安です。インストール時に最新の安定版へ更新して問題ありません。

## 3. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)でプロジェクトを2つ作成する（Production用／Preview・Staging用）。
2. それぞれのプロジェクトでSupabase CLIからmigrationを適用する。

```bash
npx supabase login
npx supabase link --project-ref <対象プロジェクトのref>
npx supabase db push
```

これにより`supabase/migrations/`配下の初期スキーマ（`20260913000000_init_schema.sql`）とRLSベースライン（`20260913000001_rls_policies.sql`）が適用されます。

3. 各プロジェクトの「Project Settings → API」から以下を取得する。
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`（**絶対にクライアントに公開しない**）

4. ローカル開発用に`.env.local`を作成し、`.env.example`を参考に値を設定する。

## 4. Vercelプロジェクトの作成と連携

1. [Vercel](https://vercel.com/)で「New Project」からGitHubリポジトリを選択してインポートする。
2. Framework PresetはNext.jsが自動検出される。
3. Environment Variablesに、Production環境には本番用Supabaseの値、Preview環境にはstaging用Supabaseの値を設定する（第3章参照の値と同じ）。
4. デプロイを実行し、プレビューURLが発行されることを確認する。

## 5. Gitleaks（シークレットスキャン）の有効化

GitHub Actionsの`secret-scan`ジョブはpublicリポジトリであればそのまま動作します。privateリポジトリの場合、必要に応じて[Gitleaks Action](https://github.com/gitleaks/gitleaks-action)のドキュメントに従いライセンス設定を確認してください。

## 6. 動作確認

```bash
npm run dev
```

`http://localhost:3000`にアクセスし、フェーズ0時点の仮ページが表示されることを確認する。

```bash
npm run lint
npm run typecheck
npm run test
```

すべて成功すれば、フェーズ0の環境構築は完了です。次はフェーズ1（認証系）に進みます。
