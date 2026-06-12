import React, { useState, useEffect } from 'react';
import { toast } from "sonner";

const styles = `
* {
    box-sizing: border-box;
}
.systemx-wrapper {
    margin: 0;
    font-family: 'Segoe UI', sans-serif;
    background: linear-gradient(180deg, #050c1f, #0b1f47);
    color: #e5e7eb;
    min-height: 100vh;
}
.container {
    max-width: 500px;
    margin: auto;
    padding: 15px;
}
.card {
    background: linear-gradient(145deg, #0b1f47, #08142e);
    border-radius: 22px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid rgba(255,255,255,0.06);
    box-shadow:
        0 10px 40px rgba(0,0,0,0.6),
        inset 0 0 40px rgba(0,0,0,0.5);
    transition: border-color 0.4s ease, box-shadow 0.4s ease;
}
.card.bot-ligado {
    border-color: rgba(239, 68, 68, 0.45);
    box-shadow:
        0 10px 40px rgba(239,68,68,0.25),
        inset 0 0 40px rgba(0,0,0,0.5);
}
.header {
    text-align: center;
}
.logo {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    border-radius: 22px;
    background: linear-gradient(145deg, #1e3a8a, #1d4ed8);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 0 25px rgba(59,130,246,0.4);
}
.logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.title {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 4px;
}
.subtitle {
    opacity: 0.6;
    font-size: 13px;
    margin-top: 5px;
}
.status {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 15px;
}
.badge {
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.3s ease;
}
.badge-green {
    background: rgba(16,185,129,0.15);
    color: #34d399;
    border: 1px solid rgba(16,185,129,0.3);
}
.badge-red {
    background: rgba(239,68,68,0.15);
    color: #f87171;
    border: 1px solid rgba(239,68,68,0.3);
}
.badge-yellow {
    background: rgba(250,204,21,0.15);
    color: #facc15;
    border: 1px solid rgba(250,204,21,0.3);
}
.bot-tabs {
    display: flex;
    background: #091a36;
    border-radius: 30px;
    padding: 6px;
    margin-top: 15px;
}
.bot-tabs div {
    flex: 1;
    text-align: center;
    padding: 10px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    user-select: none;
}
.bot-tabs div:hover:not(.active) {
    background: rgba(255,255,255,0.07);
}
.bot-tabs .active {
    background: #e5e7eb;
    color: #000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}

.play-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 30px 0 10px;
}
.play {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    border: 3px solid rgba(255,255,255,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.35s ease;
    position: relative;
    background: rgba(255,255,255,0.03);
    user-select: none;
}
.play:hover {
    transform: scale(1.06);
    box-shadow: 0 0 30px rgba(255,255,255,0.2);
}
.play:active {
    transform: scale(0.97);
}

.play .icon-play {
    width: 0;
    height: 0;
    border-left: 32px solid #fff;
    border-top: 20px solid transparent;
    border-bottom: 20px solid transparent;
    margin-left: 8px;
    transition: opacity 0.2s;
}

.play .icon-stop {
    width: 26px;
    height: 26px;
    background: #ef4444;
    border-radius: 4px;
    display: none;
    animation: blink 1.2s infinite;
}

.play.ligado {
    border-color: #ef4444;
    box-shadow: 0 0 35px rgba(239,68,68,0.5), 0 0 60px rgba(239,68,68,0.2);
    background: rgba(239,68,68,0.08);
}
.play.ligado:hover {
    box-shadow: 0 0 45px rgba(239,68,68,0.65), 0 0 70px rgba(239,68,68,0.25);
}
.play.ligado .icon-play {
    display: none;
}
.play.ligado .icon-stop {
    display: block;
}
@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
}
.play-label {
    margin-top: 14px;
    font-size: 13px;
    opacity: 0.65;
    text-align: center;
    transition: color 0.3s;
    letter-spacing: 0.5px;
}
.play-label.ligado {
    color: #f87171;
    opacity: 1;
    font-weight: 600;
}

.card.stat {
    padding: 18px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.stat-title {
    font-size: 14px;
    opacity: 0.65;
    font-weight: 500;
}
.stat-value {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 1px;
}
.green-text  { color: #22c55e; }
.purple-text { color: #a855f7; }
.cyan-text   { color: #06b6d4; }
.yellow-text { color: #facc15; }

.reset-container {
    margin: 0 0 20px;
    padding: 0;
}
.reset-btn {
    width: 100%;
    padding: 14px;
    border-radius: 14px;
    border: 1px solid rgba(255, 80, 80, 0.4);
    background: rgba(255, 80, 80, 0.08);
    color: #ff5a5a;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    backdrop-filter: blur(6px);
    letter-spacing: 0.5px;
}
.reset-btn:hover {
    background: rgba(255, 80, 80, 0.18);
    border-color: rgba(255, 80, 80, 0.7);
    box-shadow: 0 0 15px rgba(255,80,80,0.2);
}
.reset-btn:active {
    transform: scale(0.97);
}

label {
    margin-top: 15px;
    display: block;
    font-size: 14px;
    font-weight: 500;
    opacity: 0.85;
}
input, textarea, select {
    width: 100%;
    padding: 14px;
    margin-top: 6px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.07);
    background: #020617;
    color: #fff;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
}
input:focus, textarea:focus, select:focus {
    border-color: rgba(34,211,238,0.4);
}
select option {
    background: #0b1f47;
}
.orgs-box {
    background: #020617;
    border-radius: 14px;
    padding: 10px 15px;
    max-height: 180px;
    overflow-y: auto;
    margin-top: 8px;
    border: 1px solid rgba(255,255,255,0.06);
    box-shadow: inset 0 0 20px rgba(0,0,0,0.6);
}
.org-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 5px;
    cursor: pointer;
    font-size: 15px;
    border-radius: 8px;
    transition: background 0.2s;
}
.org-item:hover {
    background: rgba(255,255,255,0.04);
}
.org-item input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #22d3ee;
    cursor: pointer;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
}
.org-item input:checked + span {
    color: #22d3ee;
}
.save-btn {
    width: 100%;
    padding: 15px;
    margin-top: 20px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    color: #fff;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 0.25s ease;
    box-shadow: 0 4px 15px rgba(29,78,216,0.35);
}
.save-btn:hover {
    background: linear-gradient(135deg, #2563eb, #3b82f6);
    box-shadow: 0 6px 20px rgba(29,78,216,0.5);
    transform: translateY(-1px);
}
.save-btn:active {
    transform: scale(0.98) translateY(0);
}
.save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.logs {
    background: #000;
    padding: 15px;
    border-radius: 12px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    height: 200px;
    overflow-y: auto;
    line-height: 1.6;
    border: 1px solid rgba(255,255,255,0.05);
}
.logs::-webkit-scrollbar { width: 5px; }
.logs::-webkit-scrollbar-track { background: #000; }
.logs::-webkit-scrollbar-thumb { background: #1d4ed8; border-radius: 3px; }
.log-entry { margin: 2px 0; }
.log-time { color: #4b5563; margin-right: 6px; }
.log-info { color: #22d3ee; }
.log-success { color: #22c55e; }
.log-warn { color: #facc15; }
.log-error { color: #f87171; }
.clear-logs-btn {
    margin-top: 12px;
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid rgba(255,90,90,0.35);
    background: rgba(255,90,90,0.1);
    color: #ff5a5a;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.25s ease;
    letter-spacing: 0.5px;
}
.clear-logs-btn:hover {
    background: rgba(255,90,90,0.2);
    border-color: rgba(255,90,90,0.6);
    box-shadow: 0 0 12px rgba(255,90,90,0.2);
}
.clear-logs-btn:active {
    transform: scale(0.97);
}

.instancia-text {
    opacity: 0.6;
    margin-top: 10px;
    font-size: 13px;
    letter-spacing: 0.5px;
    transition: color 0.3s;
}

.controle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0;
}
.controle-header h3 {
    margin: 0;
}
.bot-indicator {
    font-size: 12px;
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(34,211,238,0.12);
    color: #22d3ee;
    font-weight: 600;
    border: 1px solid rgba(34,211,238,0.25);
    transition: all 0.3s;
}
.org-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 10px;
}
.org-action-btn {
    padding: 8px 14px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    background: #1d4ed8;
    color: #fff;
    font-weight: 600;
}

.org-form {
    margin-top: 12px;
    padding: 10px;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
}

.remove-form {
    margin-top: 12px;
    padding: 15px;
    border: 1px solid rgba(239,68,68,0.4);
    border-radius: 10px;
    background: rgba(239,68,68,0.08);
}

.remove-form h4 {
    margin: 0 0 12px 0;
    color: #f87171;
    font-size: 14px;
}

.remove-form .orgs-box {
    background: rgba(20,10,10,0.5);
    border-color: rgba(239,68,68,0.3);
    margin-bottom: 12px;
}

.remove-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.remove-btn {
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
}

.remove-btn.cancel {
    background: rgba(100,116,139,0.2);
    color: #94a3b8;
}

.remove-btn.delete {
    background: #ef4444;
    color: #fff;
}
`;

export default function SystemX() {
  const [activeBot, setActiveBot] = useState<'BOT1' | 'BOT2'>('BOT1');
  const [tokens, setTokens] = useState('');
  const [rotation, setRotation] = useState(90);
  const [category, setCategory] = useState('Mobile');
  const [mensagem, setMensagem] = useState('');
  const [delay, setDelay] = useState(12);
  const [mensagemSecundaria, setMensagemSecundaria] = useState('');
  const [botState, setBotState] = useState<'offline' | 'authenticating' | 'scanning' | 'running'>('offline');
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ entries: 0, queues: 0, matches: 0, dms: 0, uptime: '00:00:00' });
  
  const [orgs, setOrgs] = useState<any[]>([]);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [showRemoveForm, setShowRemoveForm] = useState(false);
  const [novaOrg, setNovaOrg] = useState({ nome: '', id: '', catId: '' });
  const [orgsParaRemover, setOrgsParaRemover] = useState<number[]>([]);

  useEffect(() => {
    const savedOrgs = localStorage.getItem('orgs');
    if (savedOrgs) setOrgs(JSON.parse(savedOrgs));
  }, []);

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

  const resetStats = async () => {
    try {
      const res = await fetch(`/api/bot/reset/${activeBot}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success("Estatísticas resetadas!");
      }
    } catch (e) {
      toast.error("Erro ao resetar");
    }
  };

  const adicionarOrg = () => {
    if (novaOrg.nome && novaOrg.id && novaOrg.catId) {
      const updated = [...orgs, novaOrg];
      setOrgs(updated);
      localStorage.setItem('orgs', JSON.stringify(updated));
      setNovaOrg({ nome: '', id: '', catId: '' });
      setShowOrgForm(false);
      toast.success("Org adicionada!");
    }
  };

  const removerOrgs = () => {
    const updated = orgs.filter((_, i) => !orgsParaRemover.includes(i));
    setOrgs(updated);
    localStorage.setItem('orgs', JSON.stringify(updated));
    setOrgsParaRemover([]);
    setShowRemoveForm(false);
    toast.success("Orgs removidas!");
  };

  const getStatusBadge = () => {
    switch (botState) {
      case 'running': return <><div className="badge badge-green">Conectado</div><div className="badge badge-green">Rodando</div></>;
      case 'scanning': return <><div className="badge badge-green">Conectado</div><div className="badge badge-yellow">Escanenado</div></>;
      case 'authenticating': return <><div className="badge badge-yellow">Autenticando</div><div className="badge badge-red">Parado</div></>;
      default: return <><div className="badge badge-red">Desconectado</div><div className="badge badge-red">Parado</div></>;
    }
  };

  return (
    <div className="systemx-wrapper">
      <style>{styles}</style>
      <div className="container">
        <div className="card header">
          <div className="logo"><img src="https://i.imgur.com/llnJtbZ.png" alt="Logo" /></div>
          <h1 className="title">SystemX</h1>
          <p className="subtitle">PAINEL DE CONTROLE</p>
          <div className="status">{getStatusBadge()}</div>
          <div className="bot-tabs">
            <div className={activeBot === 'BOT1' ? 'active' : ''} onClick={() => setActiveBot('BOT1')}>BOT1</div>
            <div className={activeBot === 'BOT2' ? 'active' : ''} onClick={() => setActiveBot('BOT2')}>BOT2</div>
          </div>
          <p className="instancia-text">INSTÂNCIA ATIVA: {activeBot === 'BOT1' ? 'BOT 1' : 'BOT 2'}</p>
        </div>

        <div className={`card ${botState !== 'offline' ? 'bot-ligado' : ''}`}>
          <div className="controle-header">
            <h3>Controle - {activeBot === 'BOT1' ? 'Bot 1' : 'Bot 2'}</h3>
            <span className="bot-indicator">{activeBot}</span>
          </div>
          <div className="play-wrapper">
            <div className={`play ${botState !== 'offline' ? 'ligado' : ''}`} onClick={toggleBot}>
              <div className="icon-play"></div>
              <div className="icon-stop"></div>
            </div>
            <p className={`play-label ${botState !== 'offline' ? 'ligado' : ''}`}>
              {botState === 'offline' ? 'Clique para iniciar o bot' : 'Bot em execução'}
            </p>
          </div>
        </div>

        <div className="card stat"><div className="stat-title">Entradas</div><div className="stat-value">{stats.entries}</div></div>
        <div className="card stat"><div className="stat-title">Na Fila</div><div className="stat-value green-text">{stats.queues}</div></div>
        <div className="card stat"><div className="stat-title">Partidas</div><div className="stat-value purple-text">{stats.matches}</div></div>
        <div className="card stat"><div className="stat-title">DMs</div><div className="stat-value cyan-text">{stats.dms}</div></div>
        <div className="card stat"><div className="stat-title">Uptime</div><div className="stat-value yellow-text">{stats.uptime}</div></div>

        <div className="reset-container">
          <button className="reset-btn" onClick={resetStats}>RESETAR STATS</button>
        </div>

        <div className="card">
          <h3>Configuração</h3>
          <label>Tokens</label>
          <textarea rows={3} value={tokens} onChange={(e) => setTokens(e.target.value)} placeholder="Cole seus tokens aqui (um por linha)"></textarea>
          <label>Rotação</label>
          <input type="number" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
          <label>Categoria</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Mobile</option>
            <option>Emulador</option>
            <option>Misto</option>
            <option>Tático</option>
          </select>

          <label>Selecionar Orgs</label>
          <div className="orgs-box">
            {orgs.map((org, i) => (
              <label key={i} className="org-item">
                <input type="checkbox" />
                <span>{org.nome}</span>
              </label>
            ))}
          </div>
          <div className="org-actions">
            <button className="org-action-btn" onClick={() => {setShowOrgForm(!showOrgForm); setShowRemoveForm(false);}}>Adicionar</button>
            <button className="org-action-btn" onClick={() => {setShowRemoveForm(!showRemoveForm); setShowOrgForm(false);}}>Remover</button>
          </div>

          {showOrgForm && (
            <div className="org-form">
              <label>Nome da Org</label><input value={novaOrg.nome} onChange={e => setNovaOrg({...novaOrg, nome: e.target.value})} />
              <label>ID da Org</label><input value={novaOrg.id} onChange={e => setNovaOrg({...novaOrg, id: e.target.value})} />
              <label>ID da Categoria</label><input value={novaOrg.catId} onChange={e => setNovaOrg({...novaOrg, catId: e.target.value})} />
              <button className="org-action-btn" onClick={adicionarOrg} style={{marginTop: '10px'}}>Adicionar</button>
            </div>
          )}

          {showRemoveForm && (
            <div className="remove-form">
              <h4>Selecione as Orgs para Remover</h4>
              <div className="orgs-box">
                {orgs.map((org, i) => (
                  <label key={i} className="org-item">
                    <input type="checkbox" checked={orgsParaRemover.includes(i)} onChange={e => {
                      if (e.target.checked) setOrgsParaRemover([...orgsParaRemover, i]);
                      else setOrgsParaRemover(orgsParaRemover.filter(idx => idx !== i));
                    }} />
                    <span>{org.nome}</span>
                  </label>
                ))}
              </div>
              <div className="remove-actions">
                <button className="remove-btn cancel" onClick={() => setShowRemoveForm(false)}>Cancelar</button>
                <button className="remove-btn delete" onClick={removerOrgs} disabled={orgsParaRemover.length === 0}>Remover</button>
              </div>
            </div>
          )}

          <label>Delay</label>
          <input type="number" value={delay} onChange={e => setDelay(Number(e.target.value))} />
          <label>Mensagem</label>
          <input type="text" value={mensagem} onChange={e => setMensagem(e.target.value)} placeholder="Digite a mensagem" />
          <label>Mensagem Secundária</label>
          <input type="text" value={mensagemSecundaria} onChange={e => setMensagemSecundaria(e.target.value)} placeholder="Digite a mensagem secundária" />

          <button className="save-btn" onClick={salvarConfiguracao}>SALVAR CONFIGURAÇÃO</button>
        </div>

        <div className="card">
          <h3>Logs</h3>
          <div className="logs">
            {logs.map((log, i) => (
              <div key={i} className="log-entry">
                <span className="log-time">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                <span className={log.level === 'ERROR' ? 'log-error' : log.level === 'SUCCESS' ? 'log-success' : log.level === 'WARNING' ? 'log-warn' : 'log-info'}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
          <button className="clear-logs-btn" onClick={() => { fetch(`/api/bot/logs/${activeBot}`, { method: 'DELETE' }); setLogs([]); }}>Limpar Logs</button>
        </div>
      </div>
    </div>
  );
}
