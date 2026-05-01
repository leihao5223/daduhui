import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../api/http';
import {
  AGENT_INVITE_CODES_STORAGE_KEY,
  AGENT_MAX_INVITE_CODES,
  AGENT_PER_LEVEL_MAX,
  AGENT_TOTAL_REBATE_CAP,
  agentRebateCategories,
} from '../config/agentRebate';
import { agentContent } from '../content/agent';

type InviteCodeRow = {
  id: string;
  code: string;
  createdAt: string;
  rates?: Record<string, number>;
};

function loadInvites(): InviteCodeRow[] {
  try {
    const raw = localStorage.getItem(AGENT_INVITE_CODES_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? data.slice(0, AGENT_MAX_INVITE_CODES) : [];
  } catch {
    return [];
  }
}

function saveInvites(next: InviteCodeRow[]) {
  localStorage.setItem(AGENT_INVITE_CODES_STORAGE_KEY, JSON.stringify(next.slice(0, AGENT_MAX_INVITE_CODES)));
}

const AgentCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const allGames = useMemo(() => agentRebateCategories.flatMap((c) => c.games), []);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(agentRebateCategories.map((c) => [c.id, true]))
  );
  const [modifyAllPct, setModifyAllPct] = useState('0.5');
  const [invites, setInvites] = useState<InviteCodeRow[]>(() => loadInvites());
  const [assignRates, setAssignRates] = useState<Record<string, number>>(() =>
    Object.fromEntries(allGames.map((g) => [g.id, 0]))
  );
  const [inviteModalCode, setInviteModalCode] = useState('');

  const loadFromServer = useCallback(async () => {
    const data = await apiGet<{ success?: boolean; list?: InviteCodeRow[]; message?: string }>(
      '/api/agent/invite-codes',
    );
    if (data.success && Array.isArray(data.list)) {
      setInvites(
        data.list.map((r) => ({
          id: r.id,
          code: r.code,
          createdAt: r.createdAt,
          rates: r.rates,
        })),
      );
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await loadFromServer();
        if (cancelled) return;
        if (!ok) {
          setInvites(loadInvites());
        }
      } catch {
        if (cancelled) return;
        setInvites(loadInvites());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFromServer]);

  function assignedRate(gameId: string) {
    return Number(assignRates[gameId] || 0);
  }

  function remainingForDirectDownline(gameId: string) {
    return Math.max(0, Number((AGENT_TOTAL_REBATE_CAP - assignedRate(gameId)).toFixed(3)));
  }

  function updateAssignedRate(gameId: string, raw: string) {
    const n = Number(raw);
    const normalized = Number.isFinite(n) && n > 0 ? Number(n.toFixed(3)) : 0;
    const capped = Number(Math.min(normalized, AGENT_PER_LEVEL_MAX, AGENT_TOTAL_REBATE_CAP).toFixed(3));
    setAssignRates((prev) => ({ ...prev, [gameId]: capped }));
  }

  function applyModifyAll() {
    for (const game of allGames) updateAssignedRate(game.id, modifyAllPct);
  }

  async function submitRules() {
    if (invites.length >= AGENT_MAX_INVITE_CODES) {
      window.alert(`每位代理最多保留 ${AGENT_MAX_INVITE_CODES} 个邀请码`);
      return;
    }
    const snap: Record<string, number> = {};
    for (const g of allGames) snap[g.id] = assignedRate(g.id);

    try {
      const data = await apiPost<{
        success?: boolean;
        message?: string;
        invite?: { id: string; code: string; createdAt: string; rates?: Record<string, number> };
      }>('/api/agent/invite-codes', { rates: snap });

      if (data.success) {
        await loadFromServer();
        window.alert('已保存抽佣设置并生成新邀请码');
        return;
      }
      window.alert(data.message || '提交失败，请确认已登录');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/请先登录|401|Unauthorized/i.test(msg)) {
        window.alert('请先登录后再生成邀请码');
        return;
      }
      if (invites.length >= AGENT_MAX_INVITE_CODES) {
        window.alert(`每位代理最多保留 ${AGENT_MAX_INVITE_CODES} 个邀请码`);
        return;
      }
      const code = `DH${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
      const row: InviteCodeRow = {
        id: `inv_${Date.now()}`,
        code,
        createdAt: new Date().toISOString(),
        rates: snap,
      };
      const next = [row, ...invites];
      saveInvites(next);
      setInvites(next);
      window.alert('无法连接服务器：邀请码已暂存本机浏览器（注册校验需走后端邀请码）');
    }
  }

  function inviteLandingUrl(code: string) {
    return `${window.location.origin}/register?invite=${encodeURIComponent(code)}`;
  }

  function qrImageUrl(code: string) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(inviteLandingUrl(code))}`;
  }

  async function copyInviteLink(code: string) {
    const url = inviteLandingUrl(code);
    try {
      await navigator.clipboard.writeText(url);
      window.alert('推广链接已复制');
    } catch {
      window.alert(url);
    }
  }

  const summary = useMemo(() => {
    const totalAssigned = allGames.reduce((sum, game) => sum + assignedRate(game.id), 0);
    return { totalAssigned: Number(totalAssigned.toFixed(3)) };
  }, [allGames, assignRates]);

  return (
    <div className="dx-page dx-page--agent">
      <header className="dx-agent-head">
        <button type="button" className="dx-agent-back" onClick={() => navigate(-1)}>
          {agentContent.back}
        </button>
        <h1 className="dx-agent-title">{agentContent.pageHead}</h1>
      </header>

      <main className="dx-page-main dx-agent-main">
        <section className="dx-card">
          <p className="dx-agent-kicker">抽水合计（直属下级） · 上限 {AGENT_TOTAL_REBATE_CAP}%</p>
          <p className="dx-agent-summary-num">{summary.totalAssigned.toFixed(3)}%</p>
        </section>

        <section className="dx-card dx-agent-bulk">
          <span className="dx-field-label">批量抽水（0～{AGENT_PER_LEVEL_MAX}）</span>
          <div className="dx-agent-bulk-row">
            <input
              className="dx-input"
              type="number"
              inputMode="decimal"
              min="0"
              max={AGENT_PER_LEVEL_MAX}
              step="0.001"
              value={modifyAllPct}
              onChange={(e) => setModifyAllPct(e.target.value)}
            />
            <span>%</span>
            <button type="button" className="dx-btn-secondary" onClick={applyModifyAll}>
              应用到全部
            </button>
          </div>
        </section>

        {agentRebateCategories.map((category) => (
          <section key={category.id} className="dx-card">
            <button
              type="button"
              className="dx-agent-cat-head"
              onClick={() => setExpanded((p) => ({ ...p, [category.id]: !p[category.id] }))}
            >
              <span>{category.name}</span>
              <span>{expanded[category.id] ? '收起' : '展开'}</span>
            </button>
            {expanded[category.id] && (
              <div className="dx-agent-rows">
                {category.games.map((game) => (
                  <div key={game.id} className="dx-agent-row">
                    <span>{game.name}</span>
                    <input
                      type="number"
                      min="0"
                      max={AGENT_PER_LEVEL_MAX}
                      step="0.001"
                      className="dx-input dx-input--sm"
                      value={assignedRate(game.id)}
                      onChange={(e) => updateAssignedRate(game.id, e.target.value)}
                    />
                    <span className="dx-agent-muted">
                      下级回水 <b>{remainingForDirectDownline(game.id).toFixed(3)}%</b>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        <button type="button" className="dx-btn-primary" onClick={submitRules}>
          提交并生成邀请码
        </button>

        <section className="dx-card">
          <h3 className="dx-card-label">邀请码</h3>
          {!invites.length ? (
            <p className="dx-hint">暂无邀请码，请先提交抽佣设置。</p>
          ) : (
            <ul className="dx-agent-invites">
              {invites.map((row) => (
                <li key={row.id} className="dx-agent-invite-item">
                  <div>
                    <code>{row.code}</code>
                    <p className="dx-agent-muted">{new Date(row.createdAt).toLocaleString('zh-CN')}</p>
                  </div>
                  <button type="button" className="dx-btn-secondary" onClick={() => setInviteModalCode(row.code)}>
                    推广码
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="dx-card dx-agent-aside">
          <h3>说明</h3>
          <ul className="dx-agent-ul">
            <li>直属下级返水总上限 {AGENT_TOTAL_REBATE_CAP}%（演示配置）。</li>
            <li>下级回水 ≈ 上限 − 你填写的抽水比例。</li>
            <li>邀请码由服务端生成并校验（代理须登录）；离线时仍可按旧逻辑生成本地码，但注册仅认可服务端有效邀请码。</li>
          </ul>
        </aside>
      </main>

      {inviteModalCode && (
        <div className="dx-modal-backdrop" onClick={() => setInviteModalCode('')} role="presentation">
          <div className="dx-modal" onClick={(e) => e.stopPropagation()}>
            <code className="dx-modal-code">{inviteModalCode}</code>
            <img src={qrImageUrl(inviteModalCode)} alt="推广二维码" width={240} height={240} />
            <p className="dx-agent-muted">{inviteLandingUrl(inviteModalCode)}</p>
            <div className="dx-modal-actions">
              <button type="button" className="dx-btn-primary" onClick={() => void copyInviteLink(inviteModalCode)}>
                复制链接
              </button>
              <button type="button" className="dx-btn-secondary" onClick={() => setInviteModalCode('')}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCenterPage;
