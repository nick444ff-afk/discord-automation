import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Play, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const ORGANIZATIONS = [
  "Strike", "Tiger", "Nexus", "Venom", "Yakuza", "Helipa", "Fusion", "Complexo",
  "Colombia", "Olympus", "Gold", "Alfa", "Capao", "Whale", "Corolla", "Dragon",
  "Money", "Furia", "Coruja", "Monkey", "Hunter", "Win", "Hare", "Morcego",
  "King", "Surf", "Tokio", "Paris", "Panda", "Shark", "Pocoyo", "Duck",
  "Pato", "Wurf", "Goat", "Scorpion", "Cipher", "Snoopy", "Waves", "Dough",
  "Mirante", "Neon"
];

const QUEUE_MODES = ["1x1", "2x2", "3x3", "4x4"];

export default function Home() {
  const [selectedBotTab, setSelectedBotTab] = useState("fila");
  const [selectedInstance, setSelectedInstance] = useState(1);
  const [tokens, setTokens] = useState("token_1\ntoken_2\ntoken_3");
  const [tokenRotation, setTokenRotation] = useState(90);
  const [delay, setDelay] = useState(12);
  const [mainMessage, setMainMessage] = useState("ola {adversary_mention}");
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [orgMessages, setOrgMessages] = useState<Record<string, string>>({});
  const [selectedQueueModes, setSelectedQueueModes] = useState(QUEUE_MODES);
  const [logs, setLogs] = useState<string[]>([]);

  const { data: instances, isLoading } = trpc.instances.list.useQuery();

  const handleSaveConfig = () => {
    toast.success("Configuração salva com sucesso!");
  };

  const handleResetStats = () => {
    toast.success("Estatísticas resetadas!");
  };

  const handleTestOrgs = () => {
    toast.loading("Testando organizações...");
    setTimeout(() => {
      toast.success("Teste concluído!");
    }, 5000);
  };

  const handleClearLogs = () => {
    setLogs([]);
    toast.success("Logs limpos!");
  };

  const toggleOrg = (org: string) => {
    setSelectedOrgs(prev =>
      prev.includes(org) ? prev.filter(o => o !== org) : [...prev, org]
    );
  };

  const toggleQueueMode = (mode: string) => {
    setSelectedQueueModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  const setOrgMessage = (org: string, message: string) => {
    setOrgMessages(prev => ({
      ...prev,
      [org]: message
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="text-4xl">👑</div>
        <div>
          <h1 className="text-4xl font-bold">IMPERIUNS</h1>
          <p className="text-muted-foreground">PAINEL DE CONTROLE</p>
        </div>
      </div>

      {/* Bot Tabs and Instance Selection */}
      <Card className="card-premium p-6">
        <div className="space-y-6">
          {/* Bot Type Tabs */}
          <Tabs value={selectedBotTab} onValueChange={setSelectedBotTab}>
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
              <TabsTrigger value="fila">BOT FILA</TabsTrigger>
              <TabsTrigger value="dm">BOT DM</TabsTrigger>
              <TabsTrigger value="org">BOT ORG</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Desconectado</span>
            </div>
            <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
              PARADO
            </Badge>
          </div>

          {/* Instance Selection */}
          <div className="flex gap-3">
            {[1, 2].map(bot => (
              <Button
                key={bot}
                onClick={() => setSelectedInstance(bot)}
                className={`flex-1 ${
                  selectedInstance === bot
                    ? "bg-white text-black hover:bg-gray-100"
                    : "bg-slate-700 hover:bg-slate-600 text-white"
                }`}
              >
                BOT{bot}
              </Button>
            ))}
          </div>

          {/* Active Instance */}
          <div className="text-center text-sm text-muted-foreground">
            INSTANCIA ATIVA: BOT {selectedInstance}
          </div>
        </div>
      </Card>

      {/* Control Section */}
      <Card className="card-premium p-8">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span>⏱️</span> Controle - Bot {selectedInstance}
          </h2>

          {/* Play Button */}
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-yellow-500/30 rounded-full animate-pulse"></div>
              <Button
                size="lg"
                className="w-32 h-32 rounded-full bg-white hover:bg-gray-100 text-black flex items-center justify-center"
              >
                <Play className="h-12 w-12 fill-black" />
              </Button>
            </div>
            <p className="text-center mt-6 text-muted-foreground">
              Configure o bot primeiro
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-white">0</p>
              <p className="text-xs text-muted-foreground mt-2">filas entradas</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-400">0</p>
              <p className="text-xs text-muted-foreground mt-2">filas ativas</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-purple-400">0</p>
              <p className="text-xs text-muted-foreground mt-2">encontradas</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-cyan-400">0</p>
              <p className="text-xs text-muted-foreground mt-2">detectadas</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-yellow-400">00:00:00</p>
              <p className="text-xs text-muted-foreground mt-2">uptime</p>
            </div>
          </div>

          {/* Reset Stats Button */}
          <Button
            onClick={handleResetStats}
            className="w-full bg-slate-700 hover:bg-slate-600 gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Resetar Stats
          </Button>
        </div>
      </Card>

      {/* Configuration Section */}
      <Card className="card-premium p-8">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <span>⚙️</span> Configuração
        </h2>

        <div className="space-y-6">
          {/* Tokens */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tokens Discord (até 5, 1 por linha)
            </label>
            <textarea
              value={tokens}
              onChange={(e) => setTokens(e.target.value)}
              placeholder="token_1&#10;token_2&#10;token_3"
              className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Rotação automática em ciclo. Se vazio, mantém tokens já salvos.
            </p>
          </div>

          {/* Token Rotation and Delay */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Rotação de token (minutos)
              </label>
              <input
                type="number"
                value={tokenRotation}
                onChange={(e) => setTokenRotation(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Delay (segundos)
              </label>
              <input
                type="number"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Main Message */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Mensagem dentro da partida
            </label>
            <input
              type="text"
              value={mainMessage}
              onChange={(e) => setMainMessage(e.target.value)}
              placeholder="Ex: ola {adversary_mention}"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Variáveis: {"{adversary_mention}"}, {"{adversary_id}"}, {"{channel_name}"}
            </p>
          </div>

          {/* Secondary Message by Org */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium">
                Mensagem secundária por org
              </label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedOrgs([]);
                  setOrgMessages({});
                }}
              >
                Limpar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Marque a org e escreva a mensagem. Variáveis: {"{adversary_mention}"}, {"{adversary_id}"}
            </p>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
              {ORGANIZATIONS.map(org => (
                <div key={org} className="pb-3 border-b border-slate-700 last:border-b-0">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={selectedOrgs.includes(org)}
                      onChange={() => toggleOrg(org)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium">{org}</span>
                  </label>
                  {selectedOrgs.includes(org) && (
                    <input
                      type="text"
                      value={orgMessages[org] || ""}
                      onChange={(e) => setOrgMessage(org, e.target.value)}
                      placeholder={`Mensagem para ${org}`}
                      className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Nome da categoria
            </label>
            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500">
              <option>Sem categorias no catálogo</option>
            </select>
          </div>

          {/* Queue Modes */}
          <div>
            <label className="block text-sm font-medium mb-4">
              Modos da fila
            </label>
            <div className="flex gap-4 flex-wrap">
              {QUEUE_MODES.map(mode => (
                <label key={mode} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedQueueModes.includes(mode)}
                    onChange={() => toggleQueueMode(mode)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{mode}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Orgs with Image */}
          <div>
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrgs(ORGANIZATIONS)}
              >
                Todas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedOrgs([]);
                  setOrgMessages({});
                }}
              >
                Limpar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Vazio = todas. Selecionadas = restringe.
            </p>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {ORGANIZATIONS.map(org => (
                  <label key={org} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOrgs.includes(org)}
                      onChange={() => toggleOrg(org)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">{org}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveConfig}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
          >
            SALVAR CONFIGURAÇÃO
          </Button>
        </div>
      </Card>

      {/* Test Orgs Section */}
      <Card className="card-premium p-8">
        <h2 className="text-xl font-semibold mb-4">Teste de Orgs</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Testa acesso, painel de fila, entra na fila, aguarda partida (1min) e verifica se a DM foi enviada.
        </p>
        <Button
          onClick={handleTestOrgs}
          className="w-full bg-slate-700 hover:bg-slate-600"
        >
          Testar Todas
        </Button>
      </Card>

      {/* Logs Section */}
      <Card className="card-premium p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Logs</h2>
          <Badge className="bg-slate-700">({logs.length})</Badge>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-64 overflow-y-auto mb-4 text-xs font-mono">
          {logs.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhum log ainda. Inicie o bot para ver a atividade.
            </p>
          ) : (
            logs.map((log, idx) => (
              <p key={idx} className="text-muted-foreground mb-1">
                {log}
              </p>
            ))
          )}
        </div>
        <Button
          onClick={handleClearLogs}
          className="w-full bg-slate-700 hover:bg-slate-600"
        >
          Limpar
        </Button>
      </Card>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground border-t border-slate-700 pt-6">
        <p>Use por sua conta e risco. Selfbots violam os Termos de Serviço do Discord.</p>
      </div>
    </div>
  );
}
