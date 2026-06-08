import React, { useState, useEffect } from 'react';
import { toast } from "sonner";

const styles = `
  .systemx-body {
    margin: 0;
    font-family: 'Segoe UI', sans-serif;
    background: linear-gradient(180deg, #050c1f, #0b1f47);
    color: #e5e7eb;
    min-height: 100vh;
    padding: 20px;
  }
  .systemx-container {
    max-width: 500px;
    margin: auto;
    padding: 15px;
  }
  .systemx-card {
    background: linear-gradient(145deg, #0b1f47, #08142e);
    border-radius: 22px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid rgba(255,255,255,0.06);
    box-shadow: 0 10px 40px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,0,0,0.5);
    transition: all 0.4s ease;
  }
  .systemx-card.bot-active {
    border-color: rgba(34, 211, 238, 0.45);
    box-shadow: 0 10px 40px rgba(34,211,238,0.15), inset 0 0 40px rgba(0,0,0,0.5);
  }
  .systemx-header { text-align: center; }
  .systemx-logo {
    width: 80px; height: 80px; margin: 0 auto 20px; border-radius: 22px;
    background: linear-gradient(145deg, #1e3a8a, #1d4ed8);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; box-shadow: 0 0 25px rgba(59,130,246,0.4);
  }
  .systemx-logo img { width: 100%; height: 100%; object-fit: cover; }
  .systemx-title { font-size: 26px; font-weight: 700; letter-spacing: 4px; }
  .systemx-subtitle { opacity: 0.6; font-size: 13px; margin-top: 5px; }
  .systemx-status { display: flex; justify-content: center; gap: 10px; margin-top: 15px; }
  .systemx-badge { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; transition: all 0.3s ease; text-transform: uppercase; }
  .systemx-badge-green { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); box-shadow: 0 0 10px rgba(16,185,129,0.2); }
  .systemx-badge-red { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
  .systemx-badge-yellow { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
  .systemx-badge-blue { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
  .systemx-bot-tabs { display: flex; background: #091a36; border-radius: 30px; padding: 6px; margin-top: 15px; }
  .systemx-bot-tabs div { flex: 1; text-align: center; padding: 10px; border-radius: 20px; cursor: pointer; transition: all 0.3s ease; font-weight: 600; }
  .systemx-bot-tabs .active { background: #e5e7eb; color: #000; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
  .systemx-play-wrapper { display: flex; flex-direction: column; align-items: center; margin: 30px 0 10px; }
  .systemx-play {
    width: 140px; height: 140px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.7);
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    transition: all 0.35s ease; position: relative; background: rgba(255,255,255,0.03);
  }
  .systemx-play:hover { transform: scale(1.06); box-shadow: 0 0 30px rgba(255,255,255,0.2); }
  .systemx-play .icon-play { width: 0; height: 0; border-left: 32px solid #fff; border-top: 20px solid transparent; border-bottom: 20px solid transparent; margin-left: 8px; }
  .systemx-play .icon-stop { width: 30px; height: 30px; background: #ef4444; border-radius: 4px; animation: systemx-blink 1.2s infinite; }
  .systemx-play .icon-loading { width: 30px; height: 30px; border: 4px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: systemx-spin 1s linear infinite; }
  .systemx-play.active { border-color: #ef4444; box-shadow: 0 0 35px rgba(239,68,68,0.5); background: rgba(239,68,68,0.08); }
  @keyframes systemx-blink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.9); } }
  @keyframes systemx-spin { to { transform: rotate(360deg); } }
  .systemx-stat { padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; }
  .systemx-stat-title { font-size: 14px; opacity: 0.65; font-weight: 500; }
  .systemx-stat-value { font-size: 22px; font-weight: 700; letter-spacing: 1px; }
  .systemx-input, .systemx-textarea, .systemx-select { width: 100%; padding: 14px; margin-top: 6px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); background: #020617; color: #fff; }
  .systemx-save-btn { width: 100%; padding: 15px; margin-top: 20px; border-radius: 12px; background: linear-gradient(135deg, #1d4ed8, #2563eb); color: #fff; font-weight: 700; cursor: pointer; border: none; }
  .systemx-logs { background: #000; padding: 15px; border-radius: 12px; font-family: 'Courier New', monospace; font-size: 13px; height: 250px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.05); }
  .systemx-clear-logs-btn { margin-top: 12px; width: 100%; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,90,90,0.35); background: rgba(255,90,90,0.1); color: #ff5a5a; font-weight: 700; cursor: pointer; }
`;

export default function SystemX() {
  const [activeBot, setActiveBot] = useState<'BOT1' | 'BOT2'>('BOT1');
  const [tokens, setTokens] = useState('');
  const [rotation, setRotation] = useState(90);
  const [category, setCategory] = useState('Mobile');
  const [mensagem, setMensagem] = useState('');
  const [botState, setBotState] = useState<'offline' | 'authenticating' | 'scanning' | 'running'>('offline');
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ entries: 0, queues: 0, matches: 0, dms: 0, uptime: '00:00:00' });

  useEffect(() => {
    fetch(`/api/bot/config/${activeBot}`)
      .then(res => res.json())
      .then(data => {
        setTokens(data.tokens || '');
        setRotation(data.rotation || 90);
        setCategory(data.category || 'Mobile');
        setMensagem(data.mensagem || '');
      });
  }, [activeBot]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/bot/status/${activeBot}`)
        .then(res => res.json())
        .then(data => {
          setBotState(data.state || 'offline');
          if (data.stats) setStats(data.stats);
        });

      fetch(`/api/bot/logs/${activeBot}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setLogs(data);
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeBot]);

  const toggleBot = async () => {
    const isOffline = botState === 'offline';
    const endpoint = isOffline ? 'start' : 'stop';
    
    // Feedback visual imediato
    if (isOffline) setBotState('authenticating');
    else setBotState('offline');
    
    try {
      const res = await fetch(`/api/bot/${endpoint}/${activeBot}`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message);
        setBotState('offline');
      }
    } catch (e) {
      toast.error("Erro na conexão");
      setBotState('offline');
    }
  };

  const salvarConfiguracao = async () => {
    try {
      const res = await fetch(`/api/bot/config/${activeBot}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens, rotation, category, mensagem })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Configuração salva!");
      }
    } catch (e) {
      toast.error("Erro ao salvar");
    }
  };

  const getStatusBadge = () => {
    switch (botState) {
      case 'running': return <><div className="systemx-badge systemx-badge-green">Conectado</div><div className="systemx-badge systemx-badge-green">Rodando</div></>;
      case 'scanning': return <><div className="systemx-badge systemx-badge-green">Conectado</div><div className="systemx-badge systemx-badge-blue">Escanenado</div></>;
      case 'authenticating': return <><div className="systemx-badge systemx-badge-yellow">Autenticando</div><div className="systemx-badge systemx-badge-red">Parado</div></>;
      default: return <><div className="systemx-badge systemx-badge-red">Desconectado</div><div className="systemx-badge systemx-badge-red">Parado</div></>;
    }
  };

  const getPlayIcon = () => {
    if (botState === 'offline') return <div className="icon-play"></div>;
    if (botState === 'authenticating' || botState === 'scanning') return <div className="icon-loading"></div>;
    return <div className="icon-stop"></div>;
  };

  return (
    <div className="systemx-body">
      <style>{styles}</style>
      <div className="systemx-container">
        <div className="systemx-card systemx-header">
          <div className="systemx-logo"><img src="https://i.imgur.com/llnJtbZ.png" alt="Logo" /></div>
          <h1 className="systemx-title">SystemX</h1>
          <p className="systemx-subtitle">PAINEL DE CONTROLE</p>
          <div className="systemx-status">
            {getStatusBadge()}
          </div>
          <div className="systemx-bot-tabs">
            <div className={activeBot === 'BOT1' ? 'active' : ''} onClick={() => setActiveBot('BOT1')}>BOT1</div>
            <div className={activeBot === 'BOT2' ? 'active' : ''} onClick={() => setActiveBot('BOT2')}>BOT2</div>
          </div>
        </div>

        <div className={`systemx-card ${botState !== 'offline' ? 'bot-active' : ''}`}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3 style={{margin: 0}}>Controle - {activeBot}</h3>
            <span style={{fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(34,211,238,0.12)', color: '#22d3ee'}}>{activeBot}</span>
          </div>
          <div className="systemx-play-wrapper">
            <div className={`systemx-play ${botState !== 'offline' ? 'active' : ''}`} onClick={toggleBot}>
              {getPlayIcon()}
            </div>
            <p className="systemx-subtitle" style={{color: botState !== 'offline' ? '#22d3ee' : '', fontWeight: botState !== 'offline' ? 'bold' : 'normal', marginTop: '15px'}}>
              {botState === 'offline' ? 'Clique para iniciar o bot' : 
               botState === 'authenticating' ? 'Autenticando conta...' :
               botState === 'scanning' ? 'Escaneando servidores...' : 'Bot em execução'}
            </p>
          </div>
        </div>

        <div className="systemx-card systemx-stat"><div className="systemx-stat-title">Entradas</div><div className="systemx-stat-value">{stats.entries}</div></div>
        <div className="systemx-card systemx-stat"><div className="systemx-stat-title">Na Fila</div><div className="systemx-stat-value" style={{color: '#22c55e'}}>{stats.queues}</div></div>
        <div className="systemx-card systemx-stat"><div className="systemx-stat-title">Partidas</div><div className="systemx-stat-value" style={{color: '#a855f7'}}>{stats.matches}</div></div>
        <div className="systemx-card systemx-stat"><div className="systemx-stat-title">DMs</div><div className="systemx-stat-value" style={{color: '#06b6d4'}}>{stats.dms}</div></div>
        <div className="systemx-card systemx-stat"><div className="systemx-stat-title">Uptime</div><div className="systemx-stat-value" style={{color: '#facc15'}}>{stats.uptime}</div></div>

        <div className="systemx-card">
          <h3>Configuração</h3>
          <label style={{display: 'block', marginTop: '15px'}}>Tokens</label>
          <textarea className="systemx-textarea" rows={3} value={tokens} onChange={(e) => setTokens(e.target.value)} placeholder="Cole seu token aqui"></textarea>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
            <div><label style={{display: 'block', marginTop: '15px'}}>Rotação</label><input type="number" className="systemx-input" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} /></div>
            <div><label style={{display: 'block', marginTop: '15px'}}>Categoria</label><select className="systemx-select" value={category} onChange={(e) => setCategory(e.target.value)}><option>Mobile</option><option>Desktop</option></select></div>
          </div>
          <label style={{display: 'block', marginTop: '15px'}}>Mensagem</label>
          <input type="text" className="systemx-input" value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Digite a mensagem" />
          <button className="systemx-save-btn" onClick={salvarConfiguracao}>SALVAR CONFIGURAÇÃO</button>
        </div>

        <div className="systemx-card">
          <h3>Logs</h3>
          <div className="systemx-logs">
            {logs.map((log, i) => (
              <div key={i} style={{color: log.level === 'ERROR' ? '#f87171' : log.level === 'SUCCESS' ? '#22c55e' : log.level === 'WARNING' ? '#fbbf24' : '#22d3ee', marginBottom: '4px'}}>
                <span style={{color: '#4b5563'}}>[{new Date(log.createdAt).toLocaleTimeString()}]</span> {log.message}
              </div>
            ))}
          </div>
          <button className="systemx-clear-logs-btn" onClick={() => { fetch(`/api/bot/logs/${activeBot}`, { method: 'DELETE' }); setLogs([]); }}>Limpar Logs</button>
        </div>
      </div>
    </div>
  );
}
