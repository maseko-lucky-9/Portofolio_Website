/**
 * Environment Verification for Portfolio UI
 *
 * This component can be used during development to verify
 * that environment variables are loaded correctly.
 *
 * Usage: Add <EnvCheck /> to your App.tsx temporarily
 */

import { env, apiUrl } from '@/config/env';

export function EnvCheck() {
  if (!env.debug) {
    return null;
  }

  const checkConnection = async () => {
    try {
      const response = await fetch(apiUrl('/health'));
      const data = await response.json();
      console.log('✅ API Health Check:', data);
      alert(`API Connected!\nStatus: ${data.status}\nEnvironment: ${data.environment || 'unknown'}`);
    } catch (error) {
      console.error('❌ API Health Check Failed:', error);
      alert(`API Connection Failed!\n${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        padding: '1rem',
        background: '#1a1a2e',
        border: '1px solid #4a4a6a',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#e0e0e0',
        zIndex: 9999,
        maxWidth: '300px',
      }}
    >
      <strong style={{ color: '#ffd700' }}>🔧 Environment Check</strong>
      <hr style={{ borderColor: '#4a4a6a', margin: '8px 0' }} />
      <div>
        <strong>Mode:</strong> {env.mode}
      </div>
      <div>
        <strong>API URL:</strong> {env.apiUrl}
      </div>
      <div>
        <strong>Version:</strong> {env.apiVersion}
      </div>
      <div>
        <strong>Debug:</strong> {String(env.debug)}
      </div>
      <hr style={{ borderColor: '#4a4a6a', margin: '8px 0' }} />
      <button
        onClick={checkConnection}
        style={{
          width: '100%',
          padding: '8px',
          background: '#4a9eff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Test API Connection
      </button>
    </div>
  );
}

export default EnvCheck;
