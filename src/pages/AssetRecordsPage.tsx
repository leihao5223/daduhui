import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { apiGet } from '../api/http';
import { getToken } from '../lib/auth';

type RecordRow = { id: string; time: string; type: string; amount: string; status: string };

const AssetRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const signedIn = !!getToken();
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const r = await apiGet<{ success?: boolean; list?: RecordRow[]; message?: string }>(
        '/api/me/wallet-records?limit=200',
      );
      if (r.success && Array.isArray(r.list)) {
        setRows(r.list);
      } else {
        setErrorMsg(r.message || '加载失败');
        setRows([]);
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : '网络错误');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (signedIn) {
      void load();
    } else {
      setLoading(false);
    }
  }, [signedIn, load]);

  if (!signedIn) {
    return (
      <div className="dx-page">
        <PageHeader title="资金记录" backTo="/profile" />
        <main className="dx-page-main">
          <section className="dh-gate-card">
            <p className="dh-gate-title">请先登录</p>
            <p className="dh-gate-desc">登录后可查看 `/api/me/wallet-records` 资金流水。</p>
            <button type="button" className="dx-btn-primary" onClick={() => navigate('/')}>
              返回首页
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="dx-page">
      <PageHeader title="资金记录" backTo="/profile" />
      <main className="dx-page-main">
        <p className="dx-hint">
          {loading ? '加载中…' : errorMsg ? errorMsg : '数据来自服务端资金流水。'}
        </p>
        {!loading ? (
          <button type="button" className="dx-btn-ghost" onClick={() => void load()}>
            刷新
          </button>
        ) : null}
        <div className="dx-table-wrap">
          <table className="dx-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>类型</th>
                <th>金额</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading ? (
                <tr>
                  <td colSpan={4}>
                    <span style={{ opacity: 0.7 }}>暂无记录</span>
                  </td>
                </tr>
              ) : null}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.time}</td>
                  <td>{r.type}</td>
                  <td>{r.amount}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AssetRecordsPage;
