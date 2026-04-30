import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronDown, ChevronUp, Copy, X } from 'lucide-react';

// 常量配置
const AGENT_TOTAL_REBATE_CAP = 3;
const AGENT_PER_LEVEL_MAX = 0.3;
const AGENT_MAX_LEVELS = 10;
const AGENT_MAX_INVITE_CODES = 10;
const STORAGE_KEY = 'xingcai_agent_invite_codes_v1';

// 游戏分类
const agentRebateCategories = [
  {
    name: '微信直播彩',
    games: ['微信直播六-50', '微信直播六-100']
  },
  {
    name: '港澳彩',
    games: ['新澳门六合彩', '老澳门六合彩', '香港六合彩']
  },
  {
    name: '红包彩',
    games: ['红包六合彩玩法100-', '红包幸运六玩法-50', '红包时时彩', '红包幸运六玩法100-', '红包六合彩玩法-50']
  },
  {
    name: '加拿大彩',
    games: ['加拿大99-30', '加拿大极速彩', '加拿大网盘']
  }
];

interface GameRebate {
  name: string;
  rebate: number;
}

interface InviteCode {
  code: string;
  createdAt: string;
  rebates: GameRebate[];
}

export default function AgentRebatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomNo = searchParams.get('room') || '001';
  const currentAgentLevel = parseInt(searchParams.get('level') || '1');

  const [gameRebates, setGameRebates] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    agentRebateCategories.forEach(cat => {
      cat.games.forEach(game => {
        initial[game] = 0;
      });
    });
    return initial;
  });

  const [bulkValue, setBulkValue] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    agentRebateCategories.forEach(cat => {
      initial[cat.name] = true;
    });
    return initial;
  });

  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<InviteCode | null>(null);

  // 计算总抽水和平均回水
  const totalRebate = Object.values(gameRebates).reduce((sum, val) => sum + val, 0);
  const avgReturn = Object.values(gameRebates).length > 0
    ? Object.values(gameRebates).reduce((sum, val) => sum + (AGENT_TOTAL_REBATE_CAP - val), 0) / Object.values(gameRebates).length
    : AGENT_TOTAL_REBATE_CAP;

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const updateGameRebate = (game: string, value: string) => {
    const num = parseFloat(value) || 0;
    const clamped = Math.min(num, AGENT_PER_LEVEL_MAX, AGENT_TOTAL_REBATE_CAP);
    setGameRebates(prev => ({ ...prev, [game]: clamped }));
  };

  const applyToAll = () => {
    const num = parseFloat(bulkValue) || 0;
    const clamped = Math.min(num, AGENT_PER_LEVEL_MAX);
    const newRebates: Record<string, number> = {};
    agentRebateCategories.forEach(cat => {
      cat.games.forEach(game => {
        newRebates[game] = Math.min(clamped, AGENT_TOTAL_REBATE_CAP);
      });
    });
    setGameRebates(newRebates);
  };

  const generateInviteCode = () => {
    if (inviteCodes.length >= AGENT_MAX_INVITE_CODES) {
      alert('每位代理最多保留 10 个邀请码');
      return;
    }

    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const code = `XC${timestamp}${random}`;

    const newCode: InviteCode = {
      code,
      createdAt: new Date().toISOString(),
      rebates: Object.entries(gameRebates).map(([name, rebate]) => ({ name, rebate }))
    };

    const updated = [...inviteCodes, newCode];
    setInviteCodes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    alert('已保存抽佣设置并生成新邀请码');
  };

  const openInviteModal = (code: InviteCode) => {
    setSelectedCode(code);
    setShowModal(true);
  };

  const copyLink = async () => {
    if (!selectedCode) return;
    const url = `${window.location.origin}/register?invite=${selectedCode.code}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('推广链接已复制');
    } catch {
      alert(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">默认抽佣</h1>
      </div>

      <div className="p-4">
        {/* Room Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <p className="text-gray-500 text-sm mb-3">房间 {roomNo} · 当前代理层级：{currentAgentLevel}级</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-lg p-3">
              <span className="text-gray-500 text-xs">给直属下级总设置（抽水合计）</span>
              <strong className="text-lg text-blue-600">{totalRebate.toFixed(3)}%</strong>
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <span className="text-gray-500 text-xs">下级平均回水</span>
              <strong className="text-lg text-green-600">{avgReturn.toFixed(3)}%</strong>
            </div>
          </div>
        </div>

        {/* Bulk Setting */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="font-medium text-gray-900 mb-2">修改全部</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">抽水比例（0～0.3，步进 0.001）</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  step="0.001"
                  min="0"
                  max="0.3"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-right"
                />
                <span className="text-gray-600">%</span>
              </div>
            </div>
            <button
              onClick={applyToAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              应用到全部游戏
            </button>
          </div>
        </div>

        {/* Game Categories */}
        {agentRebateCategories.map((category) => (
          <div key={category.name} className="bg-white rounded-xl border border-gray-200 mb-3 overflow-hidden">
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center justify-between p-4 bg-gray-50"
            >
              <span className="font-medium text-gray-900">{category.name}</span>
              {expandedCategories[category.name] ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            <AnimatePresence>
              {expandedCategories[category.name] && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    {category.games.map((game) => (
                      <div key={game} className="grid grid-cols-[1fr,100px] gap-3 items-center">
                        <span className="text-gray-700 text-sm">{game}</span>
                        <div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={gameRebates[game] || ''}
                              onChange={(e) => updateGameRebate(game, e.target.value)}
                              step="0.001"
                              min="0"
                              max="0.3"
                              className="w-full border border-gray-300 rounded-lg px-2 py-1 text-right text-sm"
                            />
                            <span className="text-gray-500 text-sm">%</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            下级回水 {(AGENT_TOTAL_REBATE_CAP - (gameRebates[game] || 0)).toFixed(3)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Submit Button */}
        <button
          onClick={generateInviteCode}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium mb-4"
        >
          提交并生成邀请码
        </button>

        {/* Invite Codes List */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">邀请码列表</h3>
          {inviteCodes.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">暂无邀请码，请先提交抽佣设置。</p>
          ) : (
            <div className="space-y-3">
              {inviteCodes.map((code) => (
                <div key={code.code} className="flex items-center justify-between py-3 border-t border-gray-100 first:border-0">
                  <div>
                    <p className="font-mono font-bold text-gray-900">{code.code}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(code.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <button
                    onClick={() => openInviteModal(code)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm"
                  >
                    立即邀请
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 mt-4">
          <h3 className="font-medium text-gray-900 mb-2">返佣计算规则（说明）</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
            <li>全站直属下级返水总上限为 3%（以运营配置为准）</li>
            <li>你填的是抽水比例；下级回水 = 3% - 你抽取比例</li>
            <li>单层最高 0.3%，最大层级 10 级</li>
            <li>每位代理最多保留 10 个邀请码（本机浏览器存储）</li>
          </ul>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && selectedCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">邀请好友</h3>
                <button onClick={() => setShowModal(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="text-center mb-4">
                <p className="font-mono font-bold text-xl mb-2">{selectedCode.code}</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/register?invite=${selectedCode.code}`)}`}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <div className="space-y-2">
                <button
                  onClick={copyLink}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  复制推广链接
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
