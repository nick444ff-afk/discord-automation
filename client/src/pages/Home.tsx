import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Square, Settings, Activity, Zap, MessageSquare, Clock, Cpu } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useSocketIO } from "@/hooks/useSocketIO";
import InstanceCard from "@/components/InstanceCard";
import InstanceSettings from "@/components/InstanceSettings";
import InstanceLogs from "@/components/InstanceLogs";

export default function Home() {
  const { user, loading } = useAuth();
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);

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
      setSelectedInstanceId(instances[0].id);
    }
  }, [instances, selectedInstanceId]);

  if (loading || instancesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Calculate aggregated stats from selected instance
  const aggregatedStats = {
    entries: selectedInstanceStats?.entries || 0,
    activeQueues: selectedInstanceStats?.queues || 0,
    matchesFound: selectedInstanceStats?.matches || 0,
    dmsSent: selectedInstanceStats?.dms || 0,
    uptime: selectedInstanceStats?.uptime || 0,
    botsOnline: (instances || []).filter((inst: any) => inst.status === "online").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-2">Bem-vindo ao gerenciador de bots Discord</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Entradas</p>
              <p className="text-3xl font-bold text-white mt-2">{aggregatedStats.entries}</p>
            </div>
            <Activity className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-700/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Filas Ativas</p>
              <p className="text-3xl font-bold text-white mt-2">{aggregatedStats.activeQueues}</p>
            </div>
            <Zap className="w-12 h-12 text-purple-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Partidas Encontradas</p>
              <p className="text-3xl font-bold text-white mt-2">{aggregatedStats.matchesFound}</p>
            </div>
            <Cpu className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-700/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">DMs Enviadas</p>
              <p className="text-3xl font-bold text-white mt-2">{aggregatedStats.dmsSent}</p>
            </div>
            <MessageSquare className="w-12 h-12 text-orange-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 border-cyan-700/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Uptime</p>
              <p className="text-3xl font-bold text-white mt-2">{Math.floor(aggregatedStats.uptime / 3600)}h</p>
            </div>
            <Clock className="w-12 h-12 text-cyan-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-700/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Bots Online</p>
              <p className="text-3xl font-bold text-white mt-2">{aggregatedStats.botsOnline}</p>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
              {aggregatedStats.botsOnline}/{instances?.length || 0}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Instances and Details */}
      <Tabs defaultValue="instances" className="w-full">
        <TabsList className="bg-slate-800/50 border-slate-700/50">
          <TabsTrigger value="instances">Instâncias</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="instances" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instances?.map((instance: any) => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                isSelected={selectedInstanceId === instance.id}
                onSelect={() => setSelectedInstanceId(instance.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          {selectedInstanceId && selectedInstanceSettings && (
            <InstanceSettings
              instanceId={selectedInstanceId}
              settings={selectedInstanceSettings}
            />
          )}
        </TabsContent>

        <TabsContent value="logs">
          {selectedInstanceId && selectedInstanceLogs && (
            <InstanceLogs
              instanceId={selectedInstanceId}
              logs={selectedInstanceLogs}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
