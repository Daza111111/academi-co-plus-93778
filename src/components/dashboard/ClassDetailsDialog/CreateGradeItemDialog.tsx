import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateGradeItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  onSuccess: () => void;
}

const CreateGradeItemDialog = ({ open, onOpenChange, classId, onSuccess }: CreateGradeItemDialogProps) => {
  const [name, setName] = useState("");
  const [corte, setCorte] = useState<string>("1");
  const [percentage, setPercentage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const percentageNum = parseFloat(percentage);
      const corteNum = parseInt(corte);

      if (percentageNum <= 0 || percentageNum > 100) {
        throw new Error("El porcentaje debe estar entre 1 y 100");
      }

      // Check if total percentage exceeds limit
      const maxPercentage = corteNum === 1 ? 30 : 35;
      
      const { data: existingItems, error: fetchError } = await supabase
        .from("grade_items")
        .select("percentage")
        .eq("class_id", classId)
        .eq("corte", corteNum);

      if (fetchError) throw fetchError;

      const totalPercentage = existingItems.reduce((sum, item) => sum + parseFloat(item.percentage.toString()), 0);
      
      if (totalPercentage + percentageNum > maxPercentage) {
        throw new Error(`El porcentaje total del corte ${corteNum} no puede exceder ${maxPercentage}%. Actual: ${totalPercentage}%`);
      }

      const { error } = await supabase.from("grade_items").insert({
        class_id: classId,
        name,
        corte: corteNum,
        percentage: percentageNum,
      });

      if (error) throw error;

      toast.success("Evaluación creada exitosamente");
      setName("");
      setPercentage("");
      setCorte("1");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al crear evaluación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nueva Evaluación</DialogTitle>
          <DialogDescription>
            Agrega talleres, trabajos u otras evaluaciones
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Ej: Taller 1, Parcial, Quiz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="corte">Corte</Label>
            <Select value={corte} onValueChange={setCorte}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Corte 1 (30%)</SelectItem>
                <SelectItem value="2">Corte 2 (35%)</SelectItem>
                <SelectItem value="3">Corte 3 (35%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="percentage">Porcentaje del Corte</Label>
            <Input
              id="percentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Ej: 10"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Corte 1: máx 30% | Corte 2 y 3: máx 35%
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGradeItemDialog;
