import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import InstanceCard from "@/components/InstanceCard";
import InstanceSettings from "@/components/InstanceSettings";

const ORGANIZATIONS = [
  "Strike", "Tiger", "Nexus", "Venom", "Yakuza", "Helipa", "Fusion", "Complexo",
  "Colombia", "Olympus", "Gold", "Alfa", "Capao", "Whale", "Corolla", "Dragon",
  "Money", "Furia", "Coruja", "Monkey", "Hunter", "Win", "Hare", "Morcego",
  "King", "Surf", "Tokio", "Paris", "Panda", "Shark", "Pocoyo", "Duck",
  "Pato", "Wurf", "Goat", "Scorpion", "Cipher", "Snoopy", "Waves", "Dough",
  "Mirante", "Neon"
];

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

  const selectedInstance = instances?.find((inst: any) => inst && inst.id === selectedInstanceId);

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
            instances.map((instance: any) => (
              <div
                key={instance?.id}
                onClick={() => {
                  if (instance?.id) {
                    setSelectedInstanceId(instance.id);
                    setShowSettings(false);
                  }
                }}
                className="cursor-pointer transition-all"
              >
                <InstanceCard
                  instance={instance}
                  isSelected={selectedInstanceId === instance?.id}
                  onSelect={() => instance?.id && setSelectedInstanceId(instance.id)}
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
        {selectedInstance && (
          <div className="space-y-4">
            <Card className="card-premium p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedInstance?.name}</h3>
                  <Badge
                    className={
                      selectedInstance?.status === "online"
                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                        : "bg-red-500/10 text-red-400 border-red-500/30"
                    }
                  >
                    {selectedInstance?.status === "online"
                      ? "Online"
                      : "Offline"}
                  </Badge>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">ID</p>
                    <p className="font-mono text-foreground">{selectedInstance?.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uptime</p>
                    <p className="font-mono text-foreground">
                      {selectedInstance?.uptime || 0}h
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Criada em</p>
                    <p className="font-mono text-foreground">
                      {selectedInstance?.createdAt
                        ? new Date(selectedInstance.createdAt).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex-1 btn-premium-primary"
                >
                  Configurar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && selectedInstanceId && settings && (
        <InstanceSettings
          instanceId={selectedInstanceId}
          settings={settings}
          organizations={ORGANIZATIONS}
        />
      )}
    </div>
  );
}
