import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Download, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Log } from "@/types";
import { useSocketIO } from "@/hooks/useSocketIO";

interface InstanceLogsProps {
  logs: Log[];
  instanceId: number;
}

type LogLevel = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "ALL";

export default function InstanceLogs({ logs: initialLogs, instanceId }: InstanceLogsProps) {
  const [logs, setLogs] = useState<Log[]>(initialLogs || []);
  const [filter, setFilter] = useState<LogLevel>("ALL");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const clearLogsMutation = trpc.logs.clear.useMutation();
  const { on, off } = useSocketIO(instanceId);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Update logs when initial logs change
  useEffect(() => {
    setLogs(initialLogs || []);
  }, [initialLogs]);

  // Listen for real-time logs via Socket.IO
  useEffect(() => {
    const handleNewLog = (data: any) => {
      const newLog: Log = {
        id: Date.now(),
        instanceId: data.instanceId,
        level: data.level,
        message: data.message,
        createdAt: new Date(data.timestamp),
      };
      setLogs(prev => [...prev, newLog]);
    };

    on("log", handleNewLog);

    return () => {
      off("log", handleNewLog);
    };
  }, [on, off]);

  const filteredLogs = filter === "ALL" ? logs : logs.filter(log => log.level === filter);

  const handleClearLogs = async () => {
    if (!confirm("Tem certeza que deseja limpar todos os logs?")) return;

    try {
      await clearLogsMutation.mutateAsync({ instanceId });
      setLogs([]);
      toast.success("Logs limpos com sucesso!");
    } catch (error) {
      toast.error("Erro ao limpar logs");
    }
  };

  const handleDownloadLogs = () => {
    const content = filteredLogs
      .map(log => `[${log.level}] ${new Date(log.createdAt).toLocaleString()}: ${log.message}`)
      .join("\n");

    const element = document.createElement("a");
    element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute("download", `logs-${instanceId}-${new Date().toISOString()}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Logs baixados com sucesso!");
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "INFO":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "SUCCESS":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "WARNING":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "ERROR":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <Card className="card-premium flex flex-col h-96">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold">Logs em Tempo Real</h3>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(value) => setFilter(value as LogLevel)}>
            <SelectTrigger className="w-32 bg-input border-slate-700 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="SUCCESS">Sucesso</SelectItem>
              <SelectItem value="WARNING">Aviso</SelectItem>
              <SelectItem value="ERROR">Erro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logs Container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 mb-4">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Nenhum log disponível</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-2 rounded-lg bg-card/50 border border-slate-700/50 hover:border-slate-700 transition-colors"
            >
              <Badge
                variant="outline"
                className={`mt-0.5 flex-shrink-0 ${getLevelColor(log.level)}`}
              >
                {log.level}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </p>
                <p className="text-sm break-words">{log.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-slate-700">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownloadLogs}
          disabled={filteredLogs.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Baixar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleClearLogs}
          disabled={clearLogsMutation.isPending || logs.length === 0}
          className="gap-2 text-red-400 hover:text-red-300"
        >
          {clearLogsMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Limpar
        </Button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          {filteredLogs.length} log{filteredLogs.length !== 1 ? "s" : ""}
        </span>
      </div>
    </Card>
  );
}
