import React, { useEffect, useMemo, useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiGet, apiPost } from '../api/http';
import { isAuthenticated, setToken } from '../lib/auth';
import { CyberAuthShell } from '../components/auth/CyberAuthShell';
import { STORAGE_KEYS } from '../config/constants';
import { authContent } from '../content/auth';
import '../styles/cyber-chinese-login.css';

interface SecurityPreset {
  id: string;
  text: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [tradePassword, setTradePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showTradePassword, setShowTradePassword] = useState(false);

  const [q1, setQ1] = useState('');
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState('');
  const [a2, setA2] = useState('');

  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState('');

  const [presets, setPresets] = useState<SecurityPreset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const fromUrl = searchParams.get('invite');
    if (fromUrl) {
      setInviteCode(fromUrl.trim());
      return;
    }
    try {
      const pending = sessionStorage.getItem(STORAGE_KEYS.pendingInvite);
      if (pending) {
        setInviteCode(pending.trim());
      }
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<{ success?: boolean; list?: SecurityPreset[] }>(
          '/api/auth/security-question-presets',
        );
        if (!cancelled && data.success && data.list?.length) {
          setPresets(data.list);
          setQ1(data.list[0].id);
          if (data.list.length > 1) setQ2(data.list[1].id);
        } else if (!cancelled) {
          const defaultPresets: SecurityPreset[] = [
            { id: 'q1', text: '你的小学名字是什么？' },
            { id: 'q2', text: '你最喜欢的颜色是什么？' },
            { id: 'q3', text: '你的出生地是哪里？' },
            { id: 'q4', text: '你最好的朋友名字是什么？' },
          ];
          setPresets(defaultPresets);
          setQ1('q1');
          setQ2('q2');
        }
      } catch {
        if (cancelled) return;
        const defaultPresets: SecurityPreset[] = [
          { id: 'q1', text: '你的小学名字是什么？' },
          { id: 'q2', text: '你最喜欢的颜色是什么？' },
          { id: 'q3', text: '你的出生地是哪里？' },
          { id: 'q4', text: '你最好的朋友名字是什么？' },
        ];
        setPresets(defaultPresets);
        setQ1('q1');
        setQ2('q2');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const q2Options = useMemo(() => presets.filter((p) => p.id !== q1), [presets, q1]);

  if (!presets.length) {
    return (
      <CyberAuthShell
        mainTitle={authContent.register.title}
        subtitle={authContent.register.subtitle}
        scroll
        titleClassName="main-title--sm"
      >
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p style={{ textAlign: 'center', color: 'rgba(201, 162, 39, 0.75)', padding: '2.5rem 0.5rem' }}>
            {authContent.register.loadingPresets}
          </p>
        </motion.div>
      </CyberAuthShell>
    );
  }

  function handleQ1Change(next: string) {
    setQ1(next);
    if (q2 === next) {
      const alt = presets.find((p) => p.id !== next);
      if (alt) setQ2(alt.id);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (nickname.trim().length < 2) {
      setError('用户名至少 2 个字符');
      return;
    }
    if (password.length < 6) {
      setError('登录密码至少 6 位');
      return;
    }
    if (password !== passwordConfirm) {
      setError('两次输入的登录密码不一致');
      return;
    }
    if (tradePassword.length < 6 || !/^\d{6}$/.test(tradePassword)) {
      setError('交易密码须为 6 位数字');
      return;
    }
    if (!q1 || !q2 || q1 === q2) {
      setError('请选择两个不同的密保问题');
      return;
    }
    if (!a1.trim() || !a2.trim()) {
      setError('请填写密保答案');
      return;
    }

    setBusy(true);
    try {
      const data = await apiPost<{ success?: boolean; token?: string; message?: string }>('/api/auth/register', {
        nickname: nickname.trim(),
        password,
        passwordConfirm,
        tradePassword,
        inviteCode: inviteCode.trim() || undefined,
        security: [
          { questionId: q1, answer: a1.trim() },
          { questionId: q2, answer: a2.trim() },
        ],
      });

      if (!data.success || !data.token) {
        setError(data.message || '注册失败');
        return;
      }

      setToken(data.token);
      navigate('/', {
        replace: true,
        state: {
          fromRegister: true,
          nickname: nickname.trim(),
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setBusy(false);
    }
  }

  return (
    <CyberAuthShell
      mainTitle={authContent.register.title}
      subtitle={authContent.register.subtitle}
      scroll
      titleClassName="main-title--sm"
    >
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.8 }}
      >
        <form onSubmit={handleSubmit}>
          {error ? <p className="cyber-auth-error">{error}</p> : null}

          <div className="input-group">
            <label className="input-label" htmlFor="reg-user">
              用户名（账号）
            </label>
            <input
              id="reg-user"
              type="text"
              className="input-field"
              autoComplete="username"
              placeholder="至少 2 个字符"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-invite">
              邀请码（选填）
            </label>
            <input
              id="reg-invite"
              type="text"
              className="input-field"
              autoComplete="off"
              placeholder="代理推广邀请码，绑定上级代理"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              spellCheck={false}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-pass">
              登录密码
            </label>
            <div className="cyber-pass-wrap">
              <input
                id="reg-pass"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                autoComplete="new-password"
                placeholder="至少 6 位"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="cyber-pass-toggle"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? '隐藏' : '显示'}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-pass2">
              确认登录密码
            </label>
            <div className="cyber-pass-wrap">
              <input
                id="reg-pass2"
                type={showPasswordConfirm ? 'text' : 'password'}
                className="input-field"
                autoComplete="new-password"
                placeholder="再次输入"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                className="cyber-pass-toggle"
                onClick={() => setShowPasswordConfirm((v) => !v)}
              >
                {showPasswordConfirm ? '隐藏' : '显示'}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-trade">
              交易密码（6 位数字）
            </label>
            <div className="cyber-pass-wrap">
              <input
                id="reg-trade"
                type={showTradePassword ? 'text' : 'password'}
                className="input-field"
                inputMode="numeric"
                maxLength={6}
                placeholder="用于提现等操作"
                value={tradePassword}
                onChange={(e) => setTradePassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
              <button
                type="button"
                className="cyber-pass-toggle"
                onClick={() => setShowTradePassword((v) => !v)}
              >
                {showTradePassword ? '隐藏' : '显示'}
              </button>
            </div>
          </div>

          <p className="cyber-auth-section">密保问题（用于找回账户）</p>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-q1">
              问题 1
            </label>
            <select
              id="reg-q1"
              className="input-field"
              value={q1}
              onChange={(e) => handleQ1Change(e.target.value)}
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.text}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-a1">
              答案 1
            </label>
            <input
              id="reg-a1"
              type="text"
              className="input-field"
              autoComplete="off"
              placeholder="请输入答案"
              value={a1}
              onChange={(e) => setA1(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-q2">
              问题 2
            </label>
            <select id="reg-q2" className="input-field" value={q2} onChange={(e) => setQ2(e.target.value)}>
              {q2Options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.text}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-a2">
              答案 2
            </label>
            <input
              id="reg-a2"
              type="text"
              className="input-field"
              autoComplete="off"
              placeholder="请输入答案"
              value={a2}
              onChange={(e) => setA2(e.target.value)}
              required
            />
          </div>

          <label className="cyber-auth-check">
            <input type="checkbox" required />
            我已阅读并同意平台用户协议与隐私政策相关条款
          </label>

          <motion.button
            type="submit"
            className="login-button"
            disabled={busy}
            whileHover={{ scale: busy ? 1 : 1.02 }}
            whileTap={{ scale: busy ? 1 : 0.98 }}
          >
            {busy ? '提交中…' : '注册并登录'}
          </motion.button>

          <div className="link-area">
            <Link to="/login" className="link-item">
              已有账号？去登录
            </Link>
            <Link to="/" className="link-item">
              返回首页
            </Link>
          </div>
        </form>
      </motion.div>
    </CyberAuthShell>
  );
};

export default RegisterPage;
