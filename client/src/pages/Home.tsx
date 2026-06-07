import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Square, Settings, Activity, Zap, MessageSquare, Clock, Cpu } from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useSocketIO } from "@/hooks/useSocketIO";
import InstanceCard from "@/components/InstanceCard";
import InstanceSettings from "@/components/InstanceSettings";
import InstanceLogs from "@/components/InstanceLogs";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);

  // Fetch instances and statistics
  const { data: instances, isLoading: instancesLoading } = trpc.instances.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: aggregatedStats } = trpc.statistics.aggregated.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: selectedInstanceStats } = trpc.statistics.get.useQuery(
    { instanceId: selectedInstanceId || 0 },
    { enabled: isAuthenticated && selectedInstanceId !== null }
  );

  const { data: selectedInstanceSettings } = trpc.settings.get.useQuery(
    { instanceId: selectedInstanceId || 0 },
    { enabled: isAuthenticated && selectedInstanceId !== null }
  );

  const { data: selectedInstanceLogs } = trpc.logs.list.useQuery(
    { instanceId: selectedInstanceId || 0, limit: 100 },
    { enabled: isAuthenticated && selectedInstanceId !== null }
  );

  // Socket.IO connection
  const { on, off } = useSocketIO(selectedInstanceId || undefined);

  // Auto-select first instance
  useEffect(() => {
    if (instances && instances.length > 0 && selectedInstanceId === null) {
      setSelectedInstanceId(instances[0].id);
    }
  }, [instances, selectedInstanceId]);

  // Handle real-time logs via Socket.IO
  useEffect(() => {
    const handleLog = (data: any) => {
      console.log("[Real-time Log]", data);
    };

    on("log", handleLog);

    return () => {
      off("log", handleLog);
    };
  }, [on, off]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Discord Bot Manager</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Painel SaaS premium para gerenciamento de múltiplas instâncias de bots Discord com controle em tempo real
          </p>
          <Button asChild size="lg" className="btn-premium-primary">
            <a href={getLoginUrl()}>Entrar com Manus</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-slate-700 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Discord Bot Manager</h1>
            <p className="text-sm text-muted-foreground">Bem-vindo, {user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Cpu className="h-3 w-3" />
              {aggregatedStats?.onlineBots || 0} / {aggregatedStats?.totalBots || 0} Bots Online
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon={<Zap className="h-5 w-5" />}
            label="Entradas"
            value={aggregatedStats?.totalEntries || 0}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="Filas Ativas"
            value={aggregatedStats?.totalQueues || 0}
            color="from-purple-500 to-purple-600"
          />
          <StatCard
            icon={<Cpu className="h-5 w-5" />}
            label="Partidas"
            value={aggregatedStats?.totalMatches || 0}
            color="from-green-500 to-green-600"
          />
          <StatCard
            icon={<MessageSquare className="h-5 w-5" />}
            label="DMs Enviadas"
            value={aggregatedStats?.totalDms || 0}
            color="from-pink-500 to-pink-600"
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="Uptime"
            value={`${Math.floor((selectedInstanceStats?.uptime || 0) / 3600)}h`}
            color="from-orange-500 to-orange-600"
          />
          <StatCard
            icon={<Cpu className="h-5 w-5" />}
            label="Bots Online"
            value={aggregatedStats?.onlineBots || 0}
            color="from-cyan-500 to-cyan-600"
          />
        </div>

        {/* Instances and Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instances List */}
          <div className="lg:col-span-1">
            <div className="card-premium">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-accent" />
                Instâncias
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                {instancesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  </div>
                ) : instances && instances.length > 0 ? (
                  instances.map((instance) => (
                    <InstanceCard
                      key={instance.id}
                      instance={instance}
                      isSelected={selectedInstanceId === instance.id}
                      onSelect={() => setSelectedInstanceId(instance.id)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma instância criada</p>
                )}
              </div>
            </div>
          </div>

          {/* Details and Settings */}
          <div className="lg:col-span-2">
            {selectedInstanceId ? (
              <Tabs defaultValue="settings" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-card border border-slate-700">
                  <TabsTrigger value="settings" className="gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Configurações</span>
                  </TabsTrigger>
                  <TabsTrigger value="status" className="gap-2">
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">Status</span>
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Logs</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="mt-4">
                  <InstanceSettings instanceId={selectedInstanceId} settings={selectedInstanceSettings} />
                </TabsContent>

                <TabsContent value="status" className="mt-4">
                  <div className="card-premium">
                    <h3 className="text-lg font-semibold mb-4">Status da Instância</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline" className="gap-2">
                          <div className={`status-indicator ${instances?.find(i => i.id === selectedInstanceId)?.status}`} />
                          {instances?.find(i => i.id === selectedInstanceId)?.status || "offline"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Uptime:</span>
                        <span className="font-mono">{Math.floor((selectedInstanceStats?.uptime || 0) / 3600)}h {Math.floor(((selectedInstanceStats?.uptime || 0) % 3600) / 60)}m</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Entradas:</span>
                        <span className="font-mono">{selectedInstanceStats?.entries || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Filas Ativas:</span>
                        <span className="font-mono">{selectedInstanceStats?.queues || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Partidas Encontradas:</span>
                        <span className="font-mono">{selectedInstanceStats?.matches || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">DMs Enviadas:</span>
                        <span className="font-mono">{selectedInstanceStats?.dms || 0}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="logs" className="mt-4">
                  <InstanceLogs logs={selectedInstanceLogs || []} instanceId={selectedInstanceId} />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="card-premium flex items-center justify-center h-96">
                <p className="text-muted-foreground">Selecione uma instância para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="card-premium group">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${color} text-white`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
