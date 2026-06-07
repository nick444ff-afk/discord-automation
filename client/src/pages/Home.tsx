import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Users, Settings, FileText, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useSocketIO } from "@/hooks/useSocketIO";
import InstanceSettings from "@/components/InstanceSettings";
import InstanceLogs from "@/components/InstanceLogs";

// Lista de organizações (40+)
const ORGANIZATIONS = [
  "Strike", "Tiger", "Nexus", "Venom", "Yakuza", "Helipa", "Fusion", "Complexo",
  "Colombia", "Olympus", "Gold", "Alfa", "Capao", "Whale", "Corolla", "Dragon",
  "Money", "Furia", "Coruja", "Monkey", "Hunter", "Win", "Hare", "Morcego",
  "King", "Surf", "Tokio", "Paris", "Panda", "Shark", "Pocoyo", "Duck",
  "Pato", "Wurf", "Goat", "Scorpion", "Cipher", "Snoopy", "Waves", "Dough",
  "Mirante", "Neon"
];

export default function Home() {
  const { user, loading } = useAuth();
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"controle" | "configuracao" | "logs">("controle");
  const [botType, setBotType] = useState<"fila" | "dm" | "org">("fila");

  // Fetch instances and statistics
  const { data: instances, isLoading: instancesLoading } = trpc.instances.list.useQuery();

  const { data: selectedInstanceStats } = trpc.statistics.get.useQuery(
    { instanceId: selectedInstanceId || 0 },
    { enabled: selectedInstanceId !== null }
  );

  const { data: selectedInstanceSettings } = trpc.settings.get.useQuery(
    { instanceId: selectedInstanceId || 0 },
    { enabled: selectedInstanceId !== null }
  );

  const { data: selectedInstanceLogs } = trpc.logs.list.useQuery(
    { instanceId: selectedInstanceId || 0, limit: 100 },
    { enabled: selectedInstanceId !== null }
  );

  // Socket.IO connection
  const { on, off } = useSocketIO(selectedInstanceId || undefined);

  // Auto-select first instance
  useEffect(() => {
    if (instances && instances.length > 0 && selectedInstanceId === null) {
      const firstInstance = instances[0];
      if (firstInstance && firstInstance.id) {
        setSelectedInstanceId(firstInstance.id);
      }
    }
  }, [instances, selectedInstanceId]);

  if (loading || instancesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const selectedInstance = instances?.find((inst: any) => inst.id === selectedInstanceId);

  return (
    <div className="space-y-6 pb-10">
      {/* Header com Logo */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">👑</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">IMPERIUNS</h1>
          <p className="text-slate-400 text-sm">PAINEL DE CONTROLE</p>
        </div>
      </div>

      {/* Abas de Tipo de Bot */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={() => setBotType("fila")}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            botType === "fila"
              ? "bg-white text-slate-900"
              : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
          }`}
        >
          BOT FILA
        </Button>
        <Button
          onClick={() => setBotType("dm")}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            botType === "dm"
              ? "bg-white text-slate-900"
              : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
          }`}
        >
          BOT DM
        </Button>
        <Button
          onClick={() => setBotType("org")}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${
            botType === "org"
              ? "bg-white text-slate-900"
              : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
          }`}
        >
          BOT ORG
        </Button>
      </div>

      {/* Status e Seleção de Instâncias */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 p-6 backdrop-blur-sm">
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${selectedInstance && selectedInstance.status === "online" ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-sm text-slate-400">
                {selectedInstance && selectedInstance.status === "online" ? "Conectado" : "Desconectado"}
              </span>
            </div>
            <Badge className={selectedInstance && selectedInstance.status === "online" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
              {selectedInstance && selectedInstance.status === "online" ? "RODANDO" : "PARADO"}
            </Badge>
          </div>

          {/* Seleção de Instâncias */}
          <div className="flex gap-3 flex-wrap">
            {instances?.map((instance: any) => (
              <Button
                key={instance.id}
                onClick={() => setSelectedInstanceId(instance.id)}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  selectedInstanceId === instance.id
                    ? "bg-white text-slate-900"
                    : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
                }`}
              >
                {instance.name}
              </Button>
            ))}
          </div>

          {/* Instância Ativa */}
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            INSTANCIA ATIVA: {selectedInstance ? selectedInstance.name : "Nenhuma"}
          </p>
        </div>
      </Card>

      {/* Controle - Bot */}
      {activeTab === "controle" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Botão Circular de Controle */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 p-8 backdrop-blur-sm flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-white mb-8">Controle - {selectedInstance ? selectedInstance.name : "Nenhuma"}</h3>
            <button
              className="w-32 h-32 rounded-full border-4 border-blue-500/50 flex items-center justify-center hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20 group"
              onClick={() => {
                // Toggle bot status
                const newStatus = selectedInstance?.status === "online" ? "offline" : "online";
                trpc.instances.updateStatus.useMutation().mutate({
                  id: selectedInstanceId || 0,
                  status: newStatus as any,
                });
              }}
            >
              <Play className="w-12 h-12 text-blue-400 group-hover:text-blue-300 transition-colors" />
            </button>
            <p className="text-slate-400 text-sm mt-6">Clique para {selectedInstance && selectedInstance.status === "online" ? "parar" : "iniciar"} o bot</p>
          </Card>

          {/* Cards de Estatísticas */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Entradas</p>
                  <p className="text-3xl font-bold text-white mt-2">{selectedInstanceStats?.entries || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">filas entradas</p>
                </div>
                <Users className="w-8 h-8 text-blue-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Na Fila</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">{selectedInstanceStats?.queues || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">filas ativas</p>
                </div>
                <FileText className="w-8 h-8 text-green-400 opacity-50" />
              </div>
            </Card>
          </div>

          {/* Mais Estatísticas */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Partidas</p>
                  <p className="text-3xl font-bold text-purple-400 mt-2">{selectedInstanceStats?.matches || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">encontradas</p>
                </div>
                <Settings className="w-8 h-8 text-purple-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">DMs</p>
                  <p className="text-3xl font-bold text-cyan-400 mt-2">{selectedInstanceStats?.dms || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">detectadas</p>
                </div>
                <FileText className="w-8 h-8 text-cyan-400 opacity-50" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-slate-700/50 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Uptime</p>
                  <p className="text-2xl font-bold text-yellow-400 mt-2">
                    {String(Math.floor((selectedInstanceStats?.uptime || 0) / 3600)).padStart(2, "0")}:
                    {String(Math.floor(((selectedInstanceStats?.uptime || 0) % 3600) / 60)).padStart(2, "0")}:
                    {String((selectedInstanceStats?.uptime || 0) % 60).padStart(2, "0")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">@{selectedInstance?.name}</p>
                </div>
              </div>
            </Card>

            <Button
              onClick={() => {
                trpc.statistics.update.useMutation().mutate({
                  instanceId: selectedInstanceId || 0,
                  entries: 0,
                  activeQueues: 0,
                  matchesFound: 0,
                  dmsSent: 0,
                  uptime: 0,
                });
              }}
              className="w-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetar Stats
            </Button>
          </div>
        </div>
      )}

      {/* Configuração */}
      {activeTab === "configuracao" && selectedInstanceId && selectedInstanceSettings && (
        <InstanceSettings
          instanceId={selectedInstanceId}
          settings={selectedInstanceSettings}
          organizations={ORGANIZATIONS}
        />
      )}

      {/* Logs */}
      {activeTab === "logs" && selectedInstanceId && selectedInstanceLogs && (
        <InstanceLogs
          instanceId={selectedInstanceId}
          logs={selectedInstanceLogs}
        />
      )}

      {/* Abas de Navegação */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-transparent p-4 flex gap-2 justify-center">
        <Button
          onClick={() => setActiveTab("controle")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            activeTab === "controle"
              ? "bg-blue-600 text-white"
              : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
          }`}
        >
          Controle
        </Button>
        <Button
          onClick={() => setActiveTab("configuracao")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            activeTab === "configuracao"
              ? "bg-blue-600 text-white"
              : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
          }`}
        >
          Configurações
        </Button>
        <Button
          onClick={() => setActiveTab("logs")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            activeTab === "logs"
              ? "bg-blue-600 text-white"
              : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
          }`}
        >
          Logs
        </Button>
      </div>
    </div>
  );
}
