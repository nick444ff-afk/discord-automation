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
  const [tokenRotation, setTokenRotation] = useState(false);
  const [messageDelay, setMessageDelay] = useState(12);
  const [mainMessage, setMainMessage] = useState("");
  const [category, setCategory] = useState("Mobile");
  const [queueMode, setQueueMode] = useState("1x1");

  const saveSettingsMutation = trpc.settings.save.useMutation();

  // Load settings when they change
  useEffect(() => {
    if (settings) {
      setTokens(settings.tokens);
      setMessageDelay(settings.delaySeconds);
      setMainMessage(settings.mainMessage);
      setCategory(settings.category);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    try {
      await saveSettingsMutation.mutateAsync({
        instanceId,
        tokens,
        tokenRotation,
        messageDelay,
        mainMessage,
        secondaryMessage: "",
        categoryName: category,
        organizations: "",
        queueMode: queueMode as "1x1" | "2x2" | "3x3" | "4x4",
      });

      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Configurações da Instância</h2>

        <div className="space-y-6">
          {/* Tokens */}
          <div>
            <Label className="text-slate-300">Tokens</Label>
            <Textarea
              value={tokens}
              onChange={(e) => setTokens(e.target.value)}
              placeholder="Cole os tokens aqui (um por linha)"
              className="mt-2 bg-slate-700/50 border-slate-600 text-white"
              rows={4}
            />
          </div>

          {/* Token Rotation */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tokenRotation"
              checked={tokenRotation}
              onCheckedChange={(checked) => setTokenRotation(checked as boolean)}
            />
            <Label htmlFor="tokenRotation" className="text-slate-300 cursor-pointer">
              Ativar rotação de tokens
            </Label>
          </div>

          {/* Message Delay */}
          <div>
            <Label className="text-slate-300">Delay da Mensagem (segundos)</Label>
            <Input
              type="number"
              value={messageDelay}
              onChange={(e) => setMessageDelay(parseInt(e.target.value))}
              className="mt-2 bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          {/* Main Message */}
          <div>
            <Label className="text-slate-300">Mensagem Principal</Label>
            <Textarea
              value={mainMessage}
              onChange={(e) => setMainMessage(e.target.value)}
              placeholder="Digite a mensagem principal"
              className="mt-2 bg-slate-700/50 border-slate-600 text-white"
              rows={3}
            />
          </div>

          {/* Category Name */}
          <div>
            <Label className="text-slate-300">Nome da Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-2 bg-slate-700/50 border-slate-600 text-white">
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

          {/* Queue Mode */}
          <div>
            <Label className="text-slate-300">Modo de Fila</Label>
            <Select value={queueMode} onValueChange={setQueueMode}>
              <SelectTrigger className="mt-2 bg-slate-700/50 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUEUE_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveSettings}
            disabled={saveSettingsMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saveSettingsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
