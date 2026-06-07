import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Square, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Instance } from "@/types";
import { toast } from "sonner";

interface InstanceCardProps {
  instance: Instance;
  isSelected: boolean;
  onSelect: () => void;
}

export default function InstanceCard({ instance, isSelected, onSelect }: InstanceCardProps) {
  const updateStatusMutation = trpc.instances.updateStatus.useMutation();
  const { data: stats } = trpc.statistics.get.useQuery({ instanceId: instance.id });

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = instance.status === "online" ? "offline" : "online";
      await updateStatusMutation.mutateAsync({
        id: instance.id,
        status: newStatus as any,
      });
      toast.success(`Bot ${newStatus === "online" ? "iniciado" : "parado"}`);
    } catch (error) {
      toast.error("Erro ao atualizar status do bot");
    }
  };

  const uptime = stats?.uptime || 0;
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  return (
    <Card
      onClick={onSelect}
      className={`p-4 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "bg-accent/10 border-accent shadow-lg"
          : "bg-card/50 border-slate-700 hover:border-accent/50 hover:bg-card/70"
      }`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{instance.name}</h3>
          <Badge
            variant="outline"
            className={`gap-1 ${
              instance.status === "online"
                ? "bg-green-500/10 text-green-400 border-green-500/30"
                : instance.status === "error"
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-gray-500/10 text-gray-400 border-gray-500/30"
            }`}
          >
            <div className={`status-indicator ${instance.status}`} />
            {instance.status}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <p className="text-gray-400">Uptime</p>
            <p className="font-mono text-foreground">{hours}h {minutes}m</p>
          </div>
          <div>
            <p className="text-gray-400">Entradas</p>
            <p className="font-mono text-foreground">{stats?.entries || 0}</p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          size="sm"
          className={`w-full gap-2 ${
            instance.status === "online"
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
          }`}
          onClick={handleToggleStatus}
          disabled={updateStatusMutation.isPending}
        >
          {updateStatusMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : instance.status === "online" ? (
            <>
              <Square className="h-4 w-4" />
              Parar
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Iniciar
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
