import React, { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiPost } from '../api/http';
import { isAuthenticated, setToken } from '../lib/auth';
import { CyberAuthShell } from '../components/auth/CyberAuthShell';
import { STORAGE_KEYS } from '../config/constants';
import { authContent } from '../content/auth';
import '../styles/cyber-chinese-login.css';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [tradePassword, setTradePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showTradePassword, setShowTradePassword] = useState(false);

  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState('');

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

    setBusy(true);
    try {
      const data = await apiPost<{ success?: boolean; token?: string; message?: string }>('/api/auth/register', {
        nickname: nickname.trim(),
        password,
        passwordConfirm,
        tradePassword,
        inviteCode: inviteCode.trim() || undefined,
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
              <button type="button" className="cyber-pass-toggle" onClick={() => setShowPassword((v) => !v)}>
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
              <button type="button" className="cyber-pass-toggle" onClick={() => setShowPasswordConfirm((v) => !v)}>
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
              <button type="button" className="cyber-pass-toggle" onClick={() => setShowTradePassword((v) => !v)}>
                {showTradePassword ? '隐藏' : '显示'}
              </button>
            </div>
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
