'use client';

import { useState, type FormEvent } from 'react';

export function AdminAccessGate() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token.trim() || status === 'submitting') {
      setMessage('请输入后台密码。');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setMessage('正在验证后台权限…');
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() })
      });

      if (!response.ok) {
        setStatus('error');
        setMessage(response.status === 429 ? '请求过于频繁，请稍后重试。' : '后台密码不正确。');
        return;
      }

      window.location.reload();
    } catch {
      setStatus('error');
      setMessage('无法连接后台认证服务，请稍后重试。');
    }
  };

  return (
    <section className="admin-access-gate" aria-labelledby="admin-access-title">
      <div className="admin-access-gate-mark" aria-hidden="true">Y</div>
      <p className="admin-access-gate-kicker">PRIVATE ADMINISTRATION</p>
      <h1 id="admin-access-title">站点管理后台</h1>
      <p>此区域仅对站点所有者开放。请输入后台密码建立一次性管理会话。</p>
      <form onSubmit={submit}>
        <label htmlFor="admin-access-token">后台密码</label>
        <input
          id="admin-access-token"
          type="password"
          autoComplete="current-password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          disabled={status === 'submitting'}
          placeholder="填写 ADMIN_WRITE_TOKEN"
        />
        <button className="button primary" type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? '验证中…' : '进入后台'}
        </button>
      </form>
      <p className={`admin-access-gate-status${status === 'error' ? ' is-error' : ''}`} role="status" aria-live="polite">
        {message || '会话将在一段时间后自动失效。'}
      </p>
    </section>
  );
}
