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

# staging用の統合ブランチを作成
git checkout -b develop
git push -u origin develop
```

その後、GitHub側でブランチ保護ルールを設定する（`main`・`develop`の両方）。

- Settings → Branches → `main` / `develop` それぞれにルールを追加
- 「Require status checks to pass before merging」を有効化し、`.github/workflows/ci.yml`のジョブ（build-and-test, secret-scan）を必須チェックに指定
- 「Require a pull request before merging」を有効化
- 以降のフィーチャー開発は`develop`から`feature/xxx`ブランチを切って行い、`develop`へPRを出す（`docs/development-workflow.md`第1章参照）

## 2. 依存パッケージのインストール

```bash
npm install
```

`package.json`の依存バージョンは作成時点の目安です。インストール時に最新の安定版へ更新して問題ありません。

## 3. Supabaseプロジェクトの作成

### 3.1 プロジェクト作成とCLI初期化

1. [Supabase](https://supabase.com/)でプロジェクトを2つ作成する（staging用／production用）。それぞれの「Project Settings → General」から**project ref**（ダッシュボードURLの`https://supabase.com/dashboard/project/<project-ref>`部分）を控えておく。
2. リポジトリのルートで、CLIの設定ファイルを初期化する（本スキャフォールドには`supabase/config.toml`を同梱済みだが、手元のCLIバージョンで生成し直しても構わない）。

```bash
npx supabase login
```

`login`は**マシン単位で1回だけ**でよく、プロジェクトごとに行う必要はない。またproduction/staging特定のプロジェクトへのログインという意味ではなく、Supabaseアカウントそのものへの認証である。

WSL・SSH接続先・コンテナ内などブラウザが自動起動しない環境では、以下のようにアクセストークンを使って直接ログインする。

```bash
npx supabase login --token <アクセストークン>
```

アクセストークンはSupabaseダッシュボード → Account → Access Tokens で発行する。Scoped Personal Access Token（権限を絞ったトークン）が選択できる場合は、ログイン用途であれば対象プロジェクトと「Database」権限程度に絞って問題ない。このトークンはCIには使わない（CIのmigrationデプロイは3.3のとおりDB接続文字列を使うため、アクセストークン自体が不要）。

### 3.2 ローカルCLIからのmigration適用（動作確認用）

`supabase link`は同時に1プロジェクトとしかリンクできないため、確認したいプロジェクトのrefに都度切り替える。

```bash
# staging側に切り替えて適用
npx supabase link --project-ref <staging側のref>
npx supabase db push

# 現在どのプロジェクトにリンクしているか確認
npx supabase projects list

# production側に切り替えて適用（誤って本番に流し込まないよう、事前にrefを必ず確認する）
npx supabase link --project-ref <production側のref>
npx supabase db push
```

これにより`supabase/migrations/`配下の初期スキーマ（`20260913000000_init_schema.sql`）とRLSベースライン（`20260913000001_rls_policies.sql`）が適用される。

**正式なstaging/productionへの反映は、後述のGitHub Actions経由に統一する**（本項のローカルpushは初回セットアップ時や個人の動作確認用と位置づける）。

### 3.3 GitHub Actionsによる自動デプロイの設定

リポジトリの Settings → Secrets and variables → Actions で、以下のSecretsを設定する。

| Secret名 | 値の取得元 |
|---|---|
| `STAGING_DB_URL` | staging用プロジェクトのDB接続文字列 |
| `PRODUCTION_DB_URL` | production用プロジェクトの同上 |

**取得方法**：対象プロジェクトのダッシュボードでプロジェクト名の隣にある「Connect」ボタンをクリックし、「URI」タブで**「Session pooler」**を選択してコピーする（「Direct connection」はデフォルトでIPv6専用のため、GitHub Actionsのランナーから接続できないことが多い。「Transaction pooler」はDDL/migrationとの相性が悪い場合があるため避ける）。コピーした文字列内の`[YOUR-PASSWORD]`部分を実際のDBパスワードに置き換える。パスワードを忘れた場合は「Project Settings → Database → Reset database password」から再発行できる。パスワードに`@` `#` `?`等の記号が含まれる場合はパーセントエンコードが必要な点に注意する。

CIの`db push`はこの接続文字列で直接Postgresに認証するため、アクセストークンやproject refをCIに渡す必要はない。

設定後、`develop`ブランチへのpushで`.github/workflows/deploy-migrations-staging.yml`が、`main`ブランチへのpushで`.github/workflows/deploy-migrations-production.yml`がそれぞれ自動実行され、対応するSupabaseプロジェクトへmigrationが適用される。

### 3.4 アプリ側の環境変数取得

各プロジェクトの「Project Settings → API」から以下を取得する。
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- service_role key → `SUPABASE_SERVICE_ROLE_KEY`（**絶対にクライアントに公開しない**）

ローカル開発用に`.env.local`を作成し、`.env.example`を参考に値を設定する（通常はstaging用プロジェクトの値を使う）。

## 4. Vercelプロジェクトの作成と連携

1. [Vercel](https://vercel.com/)で「New Project」からGitHubリポジトリを選択してインポートする。
2. Framework PresetはNext.jsが自動検出される。
3. Environment Variablesに、Production環境には本番用Supabaseの値、Preview環境にはstaging用Supabaseの値を設定する（第3章参照の値と同じ）。
4. `develop`ブランチを常設のstaging環境として使いたい場合、Vercelの Settings → Domains で`develop`ブランチに専用のサブドメインを割り当てる（例：`staging.<project>.vercel.app`）。これにより`develop`へのpushのたびに同一URLで最新状態を確認できる。
5. デプロイを実行し、プレビューURLが発行されることを確認する。

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
