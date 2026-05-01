/**
 * 代理返佣配置：游戏分区与名称与 `platformGameCatalog` 一致。
 */
import { platformGameCategories } from './platformGameCatalog';

export type AgentRebateGame = { id: string; name: string };
export type AgentRebateCategory = { id: string; name: string; games: AgentRebateGame[] };

export const AGENT_TOTAL_REBATE_CAP = 3;
export const AGENT_PER_LEVEL_MAX = 0.3;
export const AGENT_MAX_LEVELS = 10;
export const AGENT_MAX_INVITE_CODES = 10;

export const AGENT_INVITE_CODES_STORAGE_KEY = 'daduhui_agent_invite_codes_v1';

export const agentRebateCategories: AgentRebateCategory[] = platformGameCategories.map((c) => ({
  id: c.id,
  name: c.title,
  games: c.games.map((g) => ({ id: g.id, name: g.name })),
}));
