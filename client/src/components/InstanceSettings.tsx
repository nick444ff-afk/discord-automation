import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { InstanceSettings as InstanceSettingsType } from "@/types";

interface InstanceSettingsProps {
  instanceId: number;
  settings?: InstanceSettingsType | null;
}

const QUEUE_MODES = ["1x1", "2x2", "3x3", "4x4"];
const CATEGORIES = ["Mobile", "Emulador", "Misto", "Tático", "Full soco"];

export default function InstanceSettings({ instanceId, settings }: InstanceSettingsProps) {
  const [tokens, setTokens] = useState("");
  const [rotationMinutes, setRotationMinutes] = useState(60);
  const [delaySeconds, setDelaySeconds] = useState(12);
  const [mainMessage, setMainMessage] = useState("");
  const [category, setCategory] = useState("Mobile");
  const [selectedModes, setSelectedModes] = useState<string[]>([]);

  const saveSettingsMutation = trpc.settings.save.useMutation();
  const setQueueModesMutation = trpc.queueModes.set.useMutation();
  const { data: queueModes } = trpc.queueModes.get.useQuery({ instanceId });

  // Load settings when they change
  useEffect(() => {
    if (settings) {
      setTokens(settings.tokens);
      setRotationMinutes(settings.rotationMinutes);
      setDelaySeconds(settings.delaySeconds);
      setMainMessage(settings.mainMessage);
      setCategory(settings.category);
    }
  }, [settings]);

  // Load queue modes
  useEffect(() => {
    if (queueModes) {
      setSelectedModes(queueModes.map(m => m.mode));
    }
  }, [queueModes]);

  const handleSaveSettings = async () => {
    try {
      await saveSettingsMutation.mutateAsync({
        instanceId,
        tokens,
        rotationMinutes,
        delaySeconds,
        mainMessage,
        category,
      });

      await setQueueModesMutation.mutateAsync({
        instanceId,
        modes: selectedModes,
      });

      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    }
  };

  const toggleMode = (mode: string) => {
    setSelectedModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  const isLoading = saveSettingsMutation.isPending || setQueueModesMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Tokens Section */}
      <Card className="card-premium">
        <h3 className="text-lg font-semibold mb-4">Tokens</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="tokens" className="text-sm text-muted-foreground mb-2 block">
              Tokens (um por linha)
            </Label>
            <Textarea
              id="tokens"
              value={tokens}
              onChange={(e) => setTokens(e.target.value)}
              placeholder="token1&#10;token2&#10;token3"
              className="min-h-24 bg-input border-slate-700"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rotation" className="text-sm text-muted-foreground mb-2 block">
                Rotação de Tokens (minutos)
              </Label>
              <Input
                id="rotation"
                type="number"
                value={rotationMinutes}
                onChange={(e) => setRotationMinutes(parseInt(e.target.value))}
                className="bg-input border-slate-700"
              />
            </div>
            <div>
              <Label htmlFor="delay" className="text-sm text-muted-foreground mb-2 block">
                Delay de Mensagem (segundos)
              </Label>
              <Input
                id="delay"
                type="number"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(parseInt(e.target.value))}
                className="bg-input border-slate-700"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Messages Section */}
      <Card className="card-premium">
        <h3 className="text-lg font-semibold mb-4">Mensagens</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="mainMessage" className="text-sm text-muted-foreground mb-2 block">
              Mensagem Principal
            </Label>
            <Textarea
              id="mainMessage"
              value={mainMessage}
              onChange={(e) => setMainMessage(e.target.value)}
              placeholder="Digite a mensagem principal do bot..."
              className="min-h-20 bg-input border-slate-700"
            />
          </div>
        </div>
      </Card>

      {/* Category Section */}
      <Card className="card-premium">
        <h3 className="text-lg font-semibold mb-4">Categoria</h3>
        <div>
          <Label htmlFor="category" className="text-sm text-muted-foreground mb-2 block">
            Selecione a categoria
          </Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-input border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Queue Modes Section */}
      <Card className="card-premium">
        <h3 className="text-lg font-semibold mb-4">Modos de Fila</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUEUE_MODES.map((mode) => (
            <div key={mode} className="flex items-center gap-2">
              <Checkbox
                id={`mode-${mode}`}
                checked={selectedModes.includes(mode)}
                onCheckedChange={() => toggleMode(mode)}
              />
              <Label
                htmlFor={`mode-${mode}`}
                className="text-sm cursor-pointer font-medium"
              >
                {mode}
              </Label>
            </div>
          ))}
        </div>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSaveSettings}
        disabled={isLoading}
        className="btn-premium-primary w-full gap-2"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Salvar Configurações
          </>
        )}
      </Button>
    </div>
  );
}
