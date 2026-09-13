// カード関連のZodスキーマ基盤。
// 実際の検索条件スキーマ（actionCardSearchSchema / characterCardSearchSchema）は
// フェーズ2で docs/project_plan_final.md 第5.1章 の仕様に沿って実装する。
import { z } from "zod";

export const cardTypeSchema = z.enum(["character", "action"]);
export const cardColorSchema = z.enum(["red", "blue", "green"]);
export const attributeTagSchema = z.enum([
  "diffraction",
  "annihilation",
  "aero",
  "conduction",
  "fusion",
  "glacio",
]);
export const weaponTagSchema = z.enum([
  "broadblade",
  "sword",
  "pistols",
  "gauntlets",
  "rectifier",
]);
