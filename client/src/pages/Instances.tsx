import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import InstanceCard from "@/components/InstanceCard";
import InstanceSettings from "@/components/InstanceSettings";

export default function Instances() {
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const { data: instances, isLoading } = trpc.instances.list.useQuery();
  const { data: settings } = trpc.settings.get.useQuery(
    { instanceId: selectedInstanceId || 0 },
    { enabled: selectedInstanceId !== null }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instâncias de Bots</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas múltiplas instâncias de bots Discord
          </p>
        </div>
        <Button className="btn-premium-primary gap-2">
          <Plus className="h-4 w-4" />
          Nova Instância
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instances List */}
        <div className="lg:col-span-2 space-y-4">
          {instances && instances.length > 0 ? (
            instances.map((instance) => (
              <div
                key={instance.id}
                onClick={() => {
                  setSelectedInstanceId(instance.id);
                  setShowSettings(false);
                }}
                className="cursor-pointer transition-all"
              >
                <InstanceCard
                  instance={instance}
                  isSelected={selectedInstanceId === instance.id}
                  onSelect={() => setSelectedInstanceId(instance.id)}
                />
              </div>
            ))
          ) : (
            <Card className="card-premium flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Nenhuma instância criada ainda</p>
                <Button className="btn-premium-primary gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeira Instância
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Details Panel */}
        <div className="space-y-4">
          {selectedInstanceId ? (
            <>
              <Card className="card-premium">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Detalhes</h3>
                  <Badge
                    variant="outline"
                    className={
                      instances?.find(i => i.id === selectedInstanceId)?.status === "online"
                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                        : "bg-red-500/10 text-red-400 border-red-500/30"
                    }
                  >
                    {instances?.find(i => i.id === selectedInstanceId)?.status === "online"
                      ? "Online"
                      : "Offline"}
                  </Badge>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">ID</p>
                    <p className="font-mono text-foreground">{selectedInstanceId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uptime</p>
                    <p className="font-mono text-foreground">
                      {instances?.find(i => i.id === selectedInstanceId)?.uptime || 0}h
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Criada em</p>
                    <p className="font-mono text-foreground">
                      {instances?.find(i => i.id === selectedInstanceId)?.createdAt
                        ? new Date(instances.find(i => i.id === selectedInstanceId)!.createdAt).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  {showSettings ? "Detalhes" : "Configurações"}
                </Button>
              </div>
            </>
          ) : (
            <Card className="card-premium flex items-center justify-center h-32">
              <p className="text-muted-foreground text-sm">Selecione uma instância</p>
            </Card>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {selectedInstanceId && showSettings && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Configurações da Instância</h2>
          <InstanceSettings instanceId={selectedInstanceId} settings={settings} />
        </div>
      )}
    </div>
  );
}
