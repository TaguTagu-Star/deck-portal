-- RLS有効化とベースラインポリシー
-- 注意: これはフェーズ0時点のベースラインであり、フェーズ5（デッキ共有）の実装時に
-- 詳細なレビューが必須（docs/project_plan_final.md 第9章 技術的リスク「RLS設計の複雑化」参照）。

alter table users enable row level security;
alter table admin_invitations enable row level security;
alter table cards enable row level security;
alter table decks enable row level security;
alter table deck_cards enable row level security;
alter table favorites enable row level security;

-- cards: 有効なカードは誰でも閲覧可能。書き込みはadmin限定のServer Action経由
--        （Service Role Keyを使うためRLSをバイパスする想定。通常ロールからの書き込みポリシーは用意しない）
create policy "cards_select_active" on cards
  for select using (is_active = true);

-- users: 本人のみ参照・更新可能
create policy "users_self" on users
  for all using (auth.uid() = auth_uid)
  with check (auth.uid() = auth_uid);

-- decks: 所有者は全操作可能
create policy "decks_owner_all" on decks
  for all using (
    auth.uid() = (select auth_uid from users where users.id = decks.user_id)
  )
  with check (
    auth.uid() = (select auth_uid from users where users.id = decks.user_id)
  );

-- decks: 公開デッキは誰でも閲覧可能（未ログイン含む）
create policy "decks_public_select" on decks
  for select using (visibility = 'public');

-- deck_cards: 閲覧可能なdeckに紐づく場合のみ閲覧可能
create policy "deck_cards_select" on deck_cards
  for select using (
    exists (
      select 1 from decks
      where decks.id = deck_cards.deck_id
        and (
          decks.visibility = 'public'
          or auth.uid() = (select auth_uid from users where users.id = decks.user_id)
        )
    )
  );

-- deck_cards: 所有者のみ書き込み可能（ALLで宣言し、USING/WITH CHECK双方に同条件を設定）
create policy "deck_cards_owner_write" on deck_cards
  for all using (
    exists (
      select 1 from decks
      where decks.id = deck_cards.deck_id
        and auth.uid() = (select auth_uid from users where users.id = decks.user_id)
    )
  )
  with check (
    exists (
      select 1 from decks
      where decks.id = deck_cards.deck_id
        and auth.uid() = (select auth_uid from users where users.id = decks.user_id)
    )
  );

-- favorites: 本人のみ（将来機能。実装時に見直す）
create policy "favorites_owner" on favorites
  for all using (
    auth.uid() = (select auth_uid from users where users.id = favorites.user_id)
  );

-- admin_invitations: role=admin のユーザーのみ
create policy "admin_invitations_admin_only" on admin_invitations
  for all using (
    exists (
      select 1 from users
      where users.auth_uid = auth.uid() and users.role = 'admin'
    )
  );
