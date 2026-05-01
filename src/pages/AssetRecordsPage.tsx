import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { apiGet } from '../api/http';
import { getToken } from '../lib/auth';
import { walletContent } from '../content/wallet';

type RecordRow = { id: string; time: string; type: string; amount: string; status: string };

const copy = walletContent.records;

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
      const res = await apiGet<{ success?: boolean; list?: RecordRow[]; message?: string }>(
        '/api/me/wallet-records?limit=200',
      );
      if (res.success && Array.isArray(res.list)) {
        setRows(res.list);
      } else {
        setErrorMsg(res.message || copy.loadFail);
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
        <PageHeader title={copy.pageTitle} backTo="/profile" />
        <main className="dx-page-main">
          <section className="dh-gate-card">
            <p className="dh-gate-title">{copy.gateTitle}</p>
            <p className="dh-gate-desc">{copy.gateDesc}</p>
            <button type="button" className="dx-btn-primary" onClick={() => navigate('/')}>
              {copy.backHome}
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="dx-page">
      <PageHeader title={copy.pageTitle} backTo="/profile" />
      <main className="dx-page-main">
        <p className="dx-hint">
          {loading ? copy.loading : errorMsg ? errorMsg : copy.fromServer}
        </p>
        {!loading ? (
          <button type="button" className="dx-btn-ghost" onClick={() => void load()}>
            {copy.refresh}
          </button>
        ) : null}
        <div className="dx-table-wrap">
          <table className="dx-table">
            <thead>
              <tr>
                <th>{copy.table.time}</th>
                <th>{copy.table.type}</th>
                <th>{copy.table.amount}</th>
                <th>{copy.table.status}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading ? (
                <tr>
                  <td colSpan={4}>
                    <span style={{ opacity: 0.7 }}>{copy.empty}</span>
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
