-- 初期スキーマ作成（フェーズ0）
-- 対応仕様: docs/project_plan_final.md 第3章「データモデル」

create table if not exists games (
  id bigint generated always as identity primary key,
  name text not null,
  is_active boolean not null default true
);

create table if not exists users (
  id bigint generated always as identity primary key,
  auth_uid uuid not null unique,
  email text not null unique,
  display_name text,
  nickname text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_invitations (
  id bigint generated always as identity primary key,
  invited_email text not null,
  invited_by bigint not null references users(id),
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- card_type: 'character' | 'action'
-- color: アクションカードの色（301章）
-- attribute_tag / weapon_tag: キャラカードのタグ（204章）
-- action_tag: アクションカードの汎用タグ（306章）
-- character_speciality: アクションカードの専用キャラ名。nullなら共通アクションカード（303章）
-- speed / damage: アクションカードのみ（307章・308章）
-- rarity: キャラ 'C1'〜'C5' / アクション 'A1'〜'A3'（207章・311章）
create table if not exists cards (
  id bigint generated always as identity primary key,
  card_code text not null unique,
  game_id bigint not null references games(id),
  name text not null,
  normalized_name text not null,
  card_type text not null check (card_type in ('character', 'action')),
  color text check (color in ('red', 'blue', 'green')),
  cost integer,
  level integer,
  attribute_tag text check (
    attribute_tag in ('diffraction', 'annihilation', 'aero', 'conduction', 'fusion', 'glacio')
  ),
  weapon_tag text check (
    weapon_tag in ('broadblade', 'sword', 'pistols', 'gauntlets', 'rectifier')
  ),
  action_tag text,
  character_speciality text,
  speed integer,
  damage integer,
  rarity text not null,
  rules_text text,
  image_url text,
  image_rights_status text not null default 'unverified'
    check (image_rights_status in ('unverified', 'verified', 'restricted')),
  set_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cards_game_id on cards(game_id);
create index if not exists idx_cards_card_type on cards(card_type);
create index if not exists idx_cards_normalized_name on cards(normalized_name);

-- id はアプリ側で6桁英数ランダム文字列を生成して挿入する（docs 第3章 参照）
create table if not exists decks (
  id text primary key,
  user_id bigint not null references users(id),
  game_id bigint not null references games(id),
  name text not null,
  description text,
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  share_token text unique,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_decks_user_id on decks(user_id);
create index if not exists idx_decks_visibility on decks(visibility);

-- section: 1 = main（アクションデッキ）, 2 = sub（キャラデッキ）
create table if not exists deck_cards (
  deck_id text not null references decks(id) on delete cascade,
  card_id bigint not null references cards(id),
  quantity integer not null check (quantity > 0),
  section smallint not null check (section in (1, 2)),
  primary key (deck_id, card_id, section)
);

-- 将来機能（本計画のフェーズ0〜8のスコープ外）。テーブル定義のみ先行して用意する。
create table if not exists favorites (
  user_id bigint not null references users(id),
  deck_id text not null references decks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, deck_id)
);
