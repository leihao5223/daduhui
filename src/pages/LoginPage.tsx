import React, { useEffect, useState, FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiPost } from '../api/http';
import { isAuthenticated, setToken } from '../lib/auth';
import { CyberAuthShell } from '../components/auth/CyberAuthShell';
import { STORAGE_KEYS } from '../config/constants';
import { authContent } from '../content/auth';
import '../styles/cyber-chinese-login.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [awaitHuman, setAwaitHuman] = useState(false);
  const [preSessionId, setPreSessionId] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaPrompt, setCaptchaPrompt] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/', { replace: true });
      return;
    }

    const state = location.state as { fromRegister?: boolean; nickname?: string; password?: string } | undefined;
    if (state?.nickname) {
      setNickname(state.nickname);
      if (state.password) setPassword(state.password);
      if (state.fromRegister) setRemember(true);
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.rememberLogin);
      if (raw) {
        const j = JSON.parse(raw) as { nickname?: string; password?: string };
        if (j.nickname) setNickname(j.nickname);
        if (j.password) setPassword(j.password);
        setRemember(true);
      }
    } catch {
      /* ignore */
    }
  }, [location.state, navigate]);

  async function refreshCaptcha() {
    if (!preSessionId) return;
    try {
      const data = await apiPost<{
        success?: boolean;
        captchaId?: string;
        prompt?: string;
        message?: string;
      }>('/api/auth/login-refresh-human', {
        preSessionId,
        captchaId,
      });

      if (data.success && data.captchaId && data.prompt) {
        setCaptchaId(data.captchaId);
        setCaptchaPrompt(data.prompt);
        setCaptchaAnswer('');
      }
    } catch {
      setAwaitHuman(false);
      setPreSessionId('');
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!awaitHuman) {
      if (!nickname.trim() || !password) {
        setError(authContent.errors.needCredentials);
        return;
      }

      setBusy(true);
      try {
        const data = await apiPost<{
          success?: boolean;
          needHumanVerify?: boolean;
          preSessionId?: string;
          captchaId?: string;
          prompt?: string;
          message?: string;
        }>('/api/auth/login', {
          nickname: nickname.trim(),
          password,
        });

        if (!data.success || !data.needHumanVerify || !data.preSessionId) {
          setError(data.message || '登录失败');
          return;
        }

        setPreSessionId(data.preSessionId);
        setCaptchaId(data.captchaId || '');
        setCaptchaPrompt(data.prompt || '');
        setCaptchaAnswer('');
        setAwaitHuman(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '网络错误');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!captchaAnswer.trim()) {
      setError('请完成真人验证');
      return;
    }

    setBusy(true);
    try {
      const data = await apiPost<{
        success?: boolean;
        token?: string;
        message?: string;
        captchaId?: string;
        prompt?: string;
      }>('/api/auth/login-confirm', {
        preSessionId,
        captchaId,
        captchaAnswer: captchaAnswer.trim(),
      });

      if (!data.success || !data.token) {
        setError(data.message || '验证失败');
        if (data.captchaId && data.prompt) {
          setCaptchaId(data.captchaId);
          setCaptchaPrompt(data.prompt);
          setCaptchaAnswer('');
        }
        return;
      }

      setToken(data.token);

      if (remember) {
        try {
          localStorage.setItem(
            STORAGE_KEYS.rememberLogin,
            JSON.stringify({
              nickname: nickname.trim(),
              password,
            }),
          );
        } catch {
          /* ignore */
        }
      } else {
        try {
          localStorage.removeItem(STORAGE_KEYS.rememberLogin);
        } catch {
          /* ignore */
        }
      }

      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setBusy(false);
    }
  }

  function handleBackToCredentials() {
    setAwaitHuman(false);
    setPreSessionId('');
    setCaptchaId('');
    setCaptchaPrompt('');
    setCaptchaAnswer('');
    setError(null);
  }

  return (
    <CyberAuthShell mainTitle={authContent.brandStage} subtitle={authContent.login.subtitle}>
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <form onSubmit={handleLogin}>
          {error ? <p className="cyber-auth-error">{error}</p> : null}

          {!awaitHuman ? (
            <>
              <div className="input-group">
                <label className="input-label" htmlFor="login-username">
                  账号
                </label>
                <input
                  id="login-username"
                  type="text"
                  className="input-field"
                  autoComplete="username"
                  placeholder="请输入账号"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="login-password">
                  密码
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="input-field"
                  autoComplete="current-password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="cyber-auth-row">
                <label className="cyber-auth-check" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  记住密码
                </label>
                <Link to="/forgot-password" className="link-item">
                  忘记密码
                </Link>
              </div>
            </>
          ) : (
            <div className="cyber-auth-captcha-box">
              <p className="input-label" style={{ textAlign: 'center' }}>
                真人验证
              </p>
              <p className="cyber-auth-captcha-prompt">{captchaPrompt}</p>
              <div className="input-group">
                <input
                  type="text"
                  className="input-field"
                  inputMode="numeric"
                  placeholder="请输入计算结果"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>
              <button type="button" className="cyber-auth-refresh" onClick={() => void refreshCaptcha()}>
                换一题
              </button>
              <button type="button" className="cyber-auth-back" onClick={handleBackToCredentials}>
                ← 返回修改账号
              </button>
            </div>
          )}

          <motion.button
            type="submit"
            className="login-button"
            disabled={busy}
            whileHover={{ scale: busy ? 1 : 1.02 }}
            whileTap={{ scale: busy ? 1 : 0.98 }}
          >
            {busy ? '处理中…' : awaitHuman ? '验证并登录' : '立即登录'}
          </motion.button>

          <div className="link-area">
            <Link to="/register" className="link-item">
              注册账号
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

export default LoginPage;
