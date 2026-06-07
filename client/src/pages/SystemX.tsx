import React, { useState, useEffect } from 'react';
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Estilos injetados para manter o visual original do usuário
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
    transition: border-color 0.4s ease, box-shadow 0.4s ease;
  }
  .systemx-card.bot-ligado {
    border-color: rgba(239, 68, 68, 0.45);
    box-shadow: 0 10px 40px rgba(239,68,68,0.25), inset 0 0 40px rgba(0,0,0,0.5);
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
  .systemx-badge { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; transition: all 0.3s ease; }
  .systemx-badge-green { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
  .systemx-badge-red { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
  .systemx-bot-tabs { display: flex; background: #091a36; border-radius: 30px; padding: 6px; margin-top: 15px; }
  .systemx-bot-tabs div { flex: 1; text-align: center; padding: 10px; border-radius: 20px; cursor: pointer; transition: all 0.3s ease; font-weight: 600; user-select: none; }
  .systemx-bot-tabs .active { background: #e5e7eb; color: #000; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
  .systemx-play-wrapper { display: flex; flex-direction: column; align-items: center; margin: 30px 0 10px; }
  .systemx-play {
    width: 140px; height: 140px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.7);
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    transition: all 0.35s ease; position: relative; background: rgba(255,255,255,0.03); user-select: none;
  }
  .systemx-play:hover { transform: scale(1.06); box-shadow: 0 0 30px rgba(255,255,255,0.2); }
  .systemx-play .icon-play { width: 0; height: 0; border-left: 32px solid #fff; border-top: 20px solid transparent; border-bottom: 20px solid transparent; margin-left: 8px; }
  .systemx-play .icon-stop { width: 26px; height: 26px; background: #ef4444; border-radius: 4px; display: none; animation: systemx-blink 1.2s infinite; }
  .systemx-play.ligado { border-color: #ef4444; box-shadow: 0 0 35px rgba(239,68,68,0.5); background: rgba(239,68,68,0.08); }
  .systemx-play.ligado .icon-play { display: none; }
  .systemx-play.ligado .icon-stop { display: block; }
  @keyframes systemx-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
  .systemx-stat { padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; }
  .systemx-stat-title { font-size: 14px; opacity: 0.65; font-weight: 500; }
  .systemx-stat-value { font-size: 22px; font-weight: 700; letter-spacing: 1px; }
  .systemx-reset-btn { width: 100%; padding: 14px; border-radius: 14px; border: 1px solid rgba(255, 80, 80, 0.4); background: rgba(255, 80, 80, 0.08); color: #ff5a5a; font-weight: 600; cursor: pointer; }
  .systemx-input, .systemx-textarea, .systemx-select { width: 100%; padding: 14px; margin-top: 6px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); background: #020617; color: #fff; }
  .systemx-orgs-box { background: #020617; border-radius: 14px; padding: 10px 15px; max-height: 180px; overflow-y: auto; margin-top: 8px; border: 1px solid rgba(255,255,255,0.06); }
  .systemx-org-item { display: flex; align-items: center; gap: 12px; padding: 9px 5px; cursor: pointer; }
  .systemx-save-btn { width: 100%; padding: 15px; margin-top: 20px; border-radius: 12px; background: linear-gradient(135deg, #1d4ed8, #2563eb); color: #fff; font-weight: 700; cursor: pointer; }
  .systemx-logs { background: #000; padding: 15px; border-radius: 12px; font-family: 'Courier New', monospace; font-size: 13px; height: 200px; overflow-y: auto; }
  .systemx-clear-logs-btn { margin-top: 12px; width: 100%; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,90,90,0.35); background: rgba(255,90,90,0.1); color: #ff5a5a; font-weight: 700; cursor: pointer; }
`;

export default function SystemX() {
  const [activeBot, setActiveBot] = useState<'BOT 1' | 'BOT 2'>('BOT 1');
  const [tokens, setTokens] = useState('');
  const [rotation, setRotation] = useState(90);
  const [category, setCategory] = useState('Mobile');
  const [delay, setDelay] = useState(12);
  const [mensagem, setMensagem] = useState('');
  const [selectedOrgs, setSelectedOrgs] = useState<Record<string, boolean>>({
    COMPLEXO: true, MORCEGO: true, champions: false, nexus: true, venom: true, yakuza: true
  });

  // tRPC Hooks
  const { data: instances } = trpc.instances.list.useQuery();
  const currentInstance = instances?.find(i => i.name === activeBot);
  const instanceId = currentInstance?.id;

  const { data: status } = trpc.instances.getStatus.useQuery(
    { id: instanceId! },
    { enabled: !!instanceId, refetchInterval: 3000 }
  );

  const { data: stats } = trpc.statistics.get.useQuery(
    { instanceId: instanceId! },
    { enabled: !!instanceId, refetchInterval: 3000 }
  );

  const { data: dbLogs } = trpc.logs.list.useQuery(
    { instanceId: instanceId!, limit: 50 },
    { enabled: !!instanceId, refetchInterval: 2000 }
  );

  const { data: settings } = trpc.settings.get.useQuery(
    { instanceId: instanceId! },
    { enabled: !!instanceId }
  );

  const startMutation = trpc.instances.start.useMutation();
  const stopMutation = trpc.instances.stop.useMutation();
  const saveSettingsMutation = trpc.settings.save.useMutation();
  const clearLogsMutation = trpc.logs.clear.useMutation();
  const resetStatsMutation = trpc.statistics.update.useMutation();

  // Carregar configurações do banco
  useEffect(() => {
    if (settings) {
      setTokens(settings.tokens || '');
      setRotation(settings.rotationMinutes || 90);
      setCategory(settings.category || 'Mobile');
      setDelay(settings.delaySeconds || 12);
      setMensagem(settings.mainMessage || '');
      
      try {
        const orgs = JSON.parse(settings.organizations || '{}');
        if (Object.keys(orgs).length > 0) setSelectedOrgs(orgs);
      } catch (e) {}
    }
  }, [settings]);

  const toggleBot = async () => {
    if (!instanceId) return;
    try {
      if (status?.isRunning) {
        await stopMutation.mutateAsync({ id: instanceId });
        toast.success(`${activeBot} parado!`);
      } else {
        await startMutation.mutateAsync({ id: instanceId });
        toast.success(`${activeBot} iniciado!`);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao controlar bot");
    }
  };

  const salvarConfiguracao = async () => {
    if (!instanceId) return;
    try {
      await saveSettingsMutation.mutateAsync({
        instanceId,
        tokens,
        tokenRotation: true,
        messageDelay: delay,
        mainMessage: mensagem,
        secondaryMessage: "",
        categoryName: category,
        organizations: JSON.stringify(selectedOrgs),
        queueMode: "2x2"
      });
      toast.success("Configuração salva com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar configuração");
    }
  };

  const resetStats = async () => {
    if (!instanceId) return;
    await resetStatsMutation.mutateAsync({
      instanceId,
      entries: 0,
      activeQueues: 0,
      matchesFound: 0,
      dmsSent: 0,
      uptime: 0
    });
    toast.success("Estatísticas resetadas!");
  };

  const limparLogs = async () => {
    if (!instanceId) return;
    await clearLogsMutation.mutateAsync({ instanceId });
    toast.success("Logs limpos!");
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  return (
    <div className="systemx-body">
      <style>{styles}</style>
      <div className="systemx-container">
        {/* HEADER */}
        <div className="systemx-card systemx-header">
          <div className="systemx-logo">
            <img src="https://i.imgur.com/llnJtbZ.png" alt="Logo" />
          </div>
          <h1 className="systemx-title">SystemX</h1>
          <p className="systemx-subtitle">PAINEL DE CONTROLE</p>
          <div className="systemx-status">
            <div className={`systemx-badge ${instanceId ? 'systemx-badge-green' : 'systemx-badge-red'}`}>
              {instanceId ? 'Conectado' : 'Desconectado'}
            </div>
            <div className={`systemx-badge ${status?.isRunning ? 'systemx-badge-green' : 'systemx-badge-red'}`}>
              {status?.isRunning ? 'Rodando' : 'Parado'}
            </div>
          </div>
          <div className="systemx-bot-tabs">
            <div className={activeBot === 'BOT 1' ? 'active' : ''} onClick={() => setActiveBot('BOT 1')}>BOT1</div>
            <div className={activeBot === 'BOT 2' ? 'active' : ''} onClick={() => setActiveBot('BOT 2')}>BOT2</div>
          </div>
          <p className="systemx-subtitle" style={{marginTop: '15px'}}>INSTÂNCIA ATIVA: {activeBot}</p>
        </div>

        {/* CONTROLE */}
        <div className={`systemx-card ${status?.isRunning ? 'bot-ligado' : ''}`}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3 style={{margin: 0}}>Controle - {activeBot}</h3>
            <span style={{fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(34,211,238,0.12)', color: '#22d3ee'}}>{activeBot}</span>
          </div>
          <div className="systemx-play-wrapper">
            <div className={`systemx-play ${status?.isRunning ? 'ligado' : ''}`} onClick={toggleBot}>
              <div className="icon-play"></div>
              <div className="icon-stop"></div>
            </div>
            <p className="systemx-subtitle" style={{color: status?.isRunning ? '#f87171' : '', fontWeight: status?.isRunning ? 'bold' : 'normal'}}>
              {status?.isRunning ? `${activeBot} em execução...` : 'Clique para iniciar o bot'}
            </p>
          </div>
        </div>

        {/* STATS */}
        {[
          { label: 'Entradas', value: stats?.entries || 0, color: '' },
          { label: 'Na Fila', value: stats?.queues || 0, color: '#22c55e' },
          { label: 'Partidas', value: stats?.matches || 0, color: '#a855f7' },
          { label: 'DMs', value: stats?.dms || 0, color: '#06b6d4' },
          { label: 'Uptime', value: formatUptime(stats?.uptime || 0), color: '#facc15' }
        ].map((s, i) => (
          <div key={i} className="systemx-card systemx-stat">
            <div className="systemx-stat-title">{s.label}</div>
            <div className="systemx-stat-value" style={{color: s.color}}>{s.value}</div>
          </div>
        ))}

        <div style={{marginBottom: '20px'}}>
          <button className="systemx-reset-btn" onClick={resetStats}>RESETAR STATS</button>
        </div>

        {/* CONFIGURAÇÃO */}
        <div className="systemx-card">
          <h3>Configuração</h3>
          <label style={{display: 'block', marginTop: '15px'}}>Tokens</label>
          <textarea className="systemx-textarea" rows={3} value={tokens} onChange={(e) => setTokens(e.target.value)} placeholder="Cole seus tokens aqui (um por linha)"></textarea>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
            <div>
              <label style={{display: 'block', marginTop: '15px'}}>Rotação</label>
              <input type="number" className="systemx-input" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
            </div>
            <div>
              <label style={{display: 'block', marginTop: '15px'}}>Delay</label>
              <input type="number" className="systemx-input" value={delay} onChange={(e) => setDelay(Number(e.target.value))} />
            </div>
          </div>

          <label style={{display: 'block', marginTop: '15px'}}>Categoria</label>
          <select className="systemx-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Mobile</option>
            <option>Desktop</option>
          </select>

          <label style={{display: 'block', marginTop: '15px'}}>Mensagem</label>
          <input type="text" className="systemx-input" value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Digite a mensagem" />

          <button className="systemx-save-btn" onClick={salvarConfiguracao}>SALVAR CONFIGURAÇÃO</button>
        </div>

        {/* LOGS */}
        <div className="systemx-card">
          <h3>Logs</h3>
          <div className="systemx-logs">
            {dbLogs?.map((log, i) => (
              <div key={i} style={{color: log.level === 'ERROR' ? '#f87171' : log.level === 'SUCCESS' ? '#22c55e' : '#22d3ee'}}>
                <span style={{color: '#4b5563'}}>[{new Date(log.createdAt).toLocaleTimeString()}]</span> {log.message}
              </div>
            ))}
          </div>
          <button className="systemx-clear-logs-btn" onClick={limparLogs}>Limpar Logs</button>
        </div>
      </div>
    </div>
  );
}
