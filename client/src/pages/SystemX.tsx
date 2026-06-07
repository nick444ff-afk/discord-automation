import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useSocketIO } from "@/hooks/useSocketIO";

export default function SystemX() {
  const [botAtivo, setBotAtivo] = useState("BOT1");
  const [botLigado, setBotLigado] = useState(false);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [tokens, setTokens] = useState("");
  const [rotation, setRotation] = useState(90);
  const [category, setCategory] = useState("Mobile");
  const [delay, setDelay] = useState(12);
  const [mensagem, setMensagem] = useState("");
  const [selectedOrgs, setSelectedOrgs] = useState({
    COMPLEXO: true,
    MORCEGO: true,
    champions: false,
    nexus: true,
    venom: true,
    yakuza: true,
  });
  const [selectedModos, setSelectedModos] = useState({
    modo1x1: false,
    modo2x2: true,
    modo3x3: false,
    modo4x4: true,
  });

  // Stats state
  const [stats, setStats] = useState({
    entradas: 0,
    naFila: 0,
    partidas: 0,
    dms: 0,
    uptime: "00:00:00",
  });

  const [logs, setLogs] = useState<Array<{ time: string; level: string; message: string }>>([]);
  const [conexaoStatus, setConexaoStatus] = useState("Desconectado");
  const [botStatus, setBotStatus] = useState("Parado");

  // Get instances
  const { data: instances } = trpc.instances.list.useQuery();
  const currentInstance = instances?.find((i) => i.name === botAtivo);

  // Get settings
  const { data: settings } = trpc.settings.get.useQuery(
    { instanceId: currentInstance?.id || 0 },
    { enabled: !!currentInstance?.id }
  );

  // Get statistics
  const { data: statistics } = trpc.statistics.get.useQuery(
    { instanceId: currentInstance?.id || 0 },
    { enabled: !!currentInstance?.id }
  );

  // Get logs
  const { data: instanceLogs } = trpc.logs.list.useQuery(
    { instanceId: currentInstance?.id || 0, limit: 100 },
    { enabled: !!currentInstance?.id }
  );

  // Socket IO for real-time updates
  const { logs: socketLogs } = useSocketIO(currentInstance?.id || 0);

  // Mutations
  const updateStatusMutation = trpc.instances.updateStatus.useMutation();
  const updateStatsMutation = trpc.statistics.update.useMutation();
  const saveSettingsMutation = trpc.settings.save.useMutation();
  const addLogMutation = trpc.logs.add.useMutation();
  const clearLogsMutation = trpc.logs.clear.useMutation();

  // Update uptime
  useEffect(() => {
    if (!botLigado) return;

    const interval = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
      const hours = Math.floor(uptimeSeconds / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;
      setStats((prev) => ({
        ...prev,
        uptime: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [botLigado, uptimeSeconds]);

  // Update stats from API
  useEffect(() => {
    if (statistics) {
      setStats((prev) => ({
        ...prev,
        entradas: statistics.entries,
        naFila: statistics.queues,
        partidas: statistics.matches,
        dms: statistics.dms,
      }));
    }
  }, [statistics]);

  // Update logs
  useEffect(() => {
    if (instanceLogs) {
      setLogs(
        instanceLogs.map((log) => ({
          time: new Date(log.createdAt).toLocaleTimeString(),
          level: log.level,
          message: log.message,
        }))
      );
    }
  }, [instanceLogs]);

  // Check connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/trpc/instances.list");
        if (response.ok) {
          setConexaoStatus("Conectado");
        } else {
          setConexaoStatus("Desconectado");
        }
      } catch (e) {
        setConexaoStatus("Desconectado");
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update bot status
  useEffect(() => {
    if (botLigado) {
      setBotStatus("Rodando");
    } else {
      setBotStatus("Parado");
    }
  }, [botLigado]);

  const toggleBot = async () => {
    if (!currentInstance) return;

    try {
      if (botLigado) {
        // Stop bot
        setBotLigado(false);
        await updateStatusMutation.mutateAsync({
          id: currentInstance.id,
          status: "offline",
        });
        addLogMutation.mutate({
          instanceId: currentInstance.id,
          level: "INFO",
          message: `✅ ${botAtivo} desligado com sucesso.`,
        });
        toast.success(`${botAtivo} desligado!`);
      } else {
        // Start bot
        setBotLigado(true);
        await updateStatusMutation.mutateAsync({
          id: currentInstance.id,
          status: "online",
        });
        addLogMutation.mutate({
          instanceId: currentInstance.id,
          level: "SUCCESS",
          message: `✅ ${botAtivo} iniciado com sucesso.`,
        });
        toast.success(`${botAtivo} ligado!`);
      }
    } catch (error) {
      toast.error("Erro ao alternar bot");
      console.error(error);
    }
  };

  const mudarBot = (bot: string) => {
    if (bot === botAtivo) return;
    setBotAtivo(bot);
    setUptimeSeconds(0);
    toast.info(`Trocado para ${bot}`);
  };

  const salvarConfiguracao = async () => {
    if (!currentInstance) return;

    setIsSaving(true);
    try {
      const selectedOrgsList = Object.entries(selectedOrgs)
        .filter(([_, selected]) => selected)
        .map(([org, _]) => org)
        .join(",");

      const selectedModosList = Object.entries(selectedModos)
        .filter(([_, selected]) => selected)
        .map(([modo, _]) => modo.replace("modo", ""))
        .join(",");

      await saveSettingsMutation.mutateAsync({
        instanceId: currentInstance.id,
        tokens,
        tokenRotation: true,
        messageDelay: delay,
        mainMessage: mensagem,
        secondaryMessage: "",
        categoryName: category,
        organizations: selectedOrgsList,
        queueMode: selectedModosList as any,
      });

      addLogMutation.mutate({
        instanceId: currentInstance.id,
        level: "SUCCESS",
        message: `✅ Configuração salva com sucesso.`,
      });

      toast.success("Configuração salva!");
    } catch (error) {
      toast.error("Erro ao salvar configuração");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetStats = async () => {
    if (!currentInstance) return;

    try {
      await updateStatsMutation.mutateAsync({
        instanceId: currentInstance.id,
        entries: 0,
        activeQueues: 0,
        matchesFound: 0,
        dmsSent: 0,
      });

      setStats({
        entradas: 0,
        naFila: 0,
        partidas: 0,
        dms: 0,
        uptime: "00:00:00",
      });

      toast.success("Estatísticas resetadas!");
    } catch (error) {
      toast.error("Erro ao resetar estatísticas");
    }
  };

  const limparLogs = async () => {
    if (!currentInstance) return;

    try {
      await clearLogsMutation.mutateAsync({
        instanceId: currentInstance.id,
      });
      setLogs([]);
      toast.success("Logs limpos!");
    } catch (error) {
      toast.error("Erro ao limpar logs");
    }
  };

  const addLog = (message: string, level: "INFO" | "SUCCESS" | "WARNING" | "ERROR" = "INFO") => {
    if (!currentInstance) return;
    addLogMutation.mutate({
      instanceId: currentInstance.id,
      level,
      message,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* HEADER */}
      <div className="text-center space-y-4 mb-8">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg">
          <img
            src="https://i.imgur.com/llnJtbZ.png"
            alt="Logo"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <h1 className="text-4xl font-bold tracking-widest">SystemX</h1>
        <p className="text-sm opacity-60">PAINEL DE CONTROLE</p>

        <div className="flex justify-center gap-3 flex-wrap">
          <Badge
            className={
              conexaoStatus === "Conectado"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30"
            }
          >
            {conexaoStatus}
          </Badge>
          <Badge
            className={
              botStatus === "Rodando"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30"
            }
          >
            {botStatus}
          </Badge>
        </div>

        {/* Bot Tabs */}
        <div className="flex gap-2 justify-center">
          {["BOT1", "BOT2"].map((bot) => (
            <Button
              key={bot}
              onClick={() => mudarBot(bot)}
              className={`px-6 ${
                botAtivo === bot
                  ? "bg-white text-black hover:bg-gray-100"
                  : "bg-slate-700 hover:bg-slate-600 text-white"
              }`}
            >
              {bot}
            </Button>
          ))}
        </div>

        <p className="text-xs opacity-65">INSTÂNCIA ATIVA: {botAtivo}</p>
      </div>

      {/* CONTROLE */}
      <Card className={`p-6 border transition-all ${botLigado ? "border-red-500/45" : "border-slate-700"}`}>
        <h3 className="text-lg font-semibold mb-6">Controle - {botAtivo}</h3>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={toggleBot}
            className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all ${
              botLigado
                ? "border-red-500 bg-red-500/10 shadow-lg shadow-red-500/30"
                : "border-white/70 bg-white/5 hover:shadow-lg hover:shadow-white/20"
            }`}
          >
            {botLigado ? (
              <div className="w-8 h-8 bg-red-500 rounded animate-pulse"></div>
            ) : (
              <div className="w-0 h-0 border-l-8 border-r-0 border-t-5 border-b-5 border-l-white border-t-transparent border-b-transparent ml-2"></div>
            )}
          </button>
          <p className={`text-sm transition-colors ${botLigado ? "text-red-400 font-semibold" : "opacity-65"}`}>
            {botLigado ? `${botAtivo} em execução...` : "Clique para iniciar o bot"}
          </p>
        </div>
      </Card>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 flex justify-between items-center">
          <div className="text-sm opacity-65">Entradas</div>
          <div className="text-2xl font-bold">{stats.entradas}</div>
        </Card>
        <Card className="p-4 flex justify-between items-center">
          <div className="text-sm opacity-65">Na Fila</div>
          <div className="text-2xl font-bold text-green-400">{stats.naFila}</div>
        </Card>
        <Card className="p-4 flex justify-between items-center">
          <div className="text-sm opacity-65">Partidas</div>
          <div className="text-2xl font-bold text-purple-400">{stats.partidas}</div>
        </Card>
        <Card className="p-4 flex justify-between items-center">
          <div className="text-sm opacity-65">DMs</div>
          <div className="text-2xl font-bold text-cyan-400">{stats.dms}</div>
        </Card>
        <Card className="p-4 flex justify-between items-center col-span-2">
          <div className="text-sm opacity-65">Uptime</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.uptime}</div>
        </Card>
      </div>

      {/* RESET STATS */}
      <Button onClick={resetStats} className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40">
        RESETAR STATS
      </Button>

      {/* CONFIGURAÇÃO */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Configuração</h3>

        <div>
          <label className="block text-sm font-medium mb-2">Tokens</label>
          <textarea
            value={tokens}
            onChange={(e) => setTokens(e.target.value)}
            placeholder="Cole seus tokens aqui (um por linha)"
            rows={3}
            className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rotação (min)</label>
            <input
              type="number"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              min="1"
              className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Delay (s)</label>
            <input
              type="number"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              min="1"
              className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option>Mobile</option>
            <option>Desktop</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Mensagem</label>
          <input
            type="text"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Digite a mensagem"
            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Modos</label>
          <div className="bg-slate-800 border border-slate-600 rounded p-3 space-y-2">
            {["modo1x1", "modo2x2", "modo3x3", "modo4x4"].map((modo) => (
              <label key={modo} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedModos[modo as keyof typeof selectedModos]}
                  onChange={(e) =>
                    setSelectedModos((prev) => ({
                      ...prev,
                      [modo]: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded accent-cyan-400"
                />
                <span className="text-sm">{modo.replace("modo", "")}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Organizações</label>
          <div className="bg-slate-800 border border-slate-600 rounded p-3 space-y-2 max-h-48 overflow-y-auto">
            {Object.keys(selectedOrgs).map((org) => (
              <label key={org} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrgs[org as keyof typeof selectedOrgs]}
                  onChange={(e) =>
                    setSelectedOrgs((prev) => ({
                      ...prev,
                      [org]: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded accent-cyan-400"
                />
                <span className="text-sm">{org}</span>
              </label>
            ))}
          </div>
        </div>

        <Button
          onClick={salvarConfiguracao}
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
        >
          {isSaving ? "Salvando..." : "SALVAR CONFIGURAÇÃO"}
        </Button>
      </Card>

      {/* LOGS */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Logs</h3>
        <div className="bg-black border border-slate-700 rounded p-4 h-64 overflow-y-auto font-mono text-xs space-y-1">
          {logs.length === 0 ? (
            <p className="text-slate-500">Nenhum log ainda...</p>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.level === "ERROR"
                    ? "text-red-400"
                    : log.level === "SUCCESS"
                      ? "text-green-400"
                      : log.level === "WARNING"
                        ? "text-yellow-400"
                        : "text-cyan-400"
                }
              >
                <span className="text-slate-600">[{log.time}]</span> {log.message}
              </div>
            ))
          )}
        </div>
        <Button onClick={limparLogs} className="w-full bg-slate-700 hover:bg-slate-600">
          Limpar Logs
        </Button>
      </Card>
    </div>
  );
}
