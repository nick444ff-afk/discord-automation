import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import InstanceLogs from "@/components/InstanceLogs";

export default function Logs() {
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);

  const { data: instances, isLoading: instancesLoading } = trpc.instances.list.useQuery();
  const { data: logs, isLoading: logsLoading } = trpc.logs.list.useQuery(
    { instanceId: selectedInstanceId || 0 },
    { enabled: selectedInstanceId !== null }
  );

  if (instancesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Logs em Tempo Real</h1>
        <p className="text-muted-foreground mt-1">
          Monitore os logs de suas instâncias de bots
        </p>
      </div>

      {/* Instance Selector */}
      <Card className="card-premium">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Selecione uma instância:</label>
          <Select
            value={selectedInstanceId?.toString() || ""}
            onValueChange={(value) => setSelectedInstanceId(parseInt(value))}
          >
            <SelectTrigger className="w-64 bg-input border-slate-700">
              <SelectValue placeholder="Escolha uma instância..." />
            </SelectTrigger>
            <SelectContent>
              {instances?.map((instance) => (
                <SelectItem key={instance?.id} value={instance?.id?.toString() || ""}>
                  {instance?.name || `Bot ${instance?.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Logs Display */}
      {selectedInstanceId ? (
        logsLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <InstanceLogs logs={logs || []} instanceId={selectedInstanceId} />
        )
      ) : (
        <Card className="card-premium flex items-center justify-center h-64">
          <p className="text-muted-foreground">Selecione uma instância para ver os logs</p>
        </Card>
      )}
    </div>
  );
}
