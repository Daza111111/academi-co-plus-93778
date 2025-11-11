import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JoinClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
}

const JoinClassDialog = ({ open, onOpenChange, onSuccess, userId }: JoinClassDialogProps) => {
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find class by code
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id")
        .eq("code", classCode.trim().toUpperCase())
        .maybeSingle();

      if (classError) {
        throw new Error("Error al buscar la clase");
      }

      if (!classData) {
        throw new Error("Código de clase inválido");
      }

      // Enroll student in class
      const { error: enrollError } = await supabase
        .from("enrollments")
        .insert({
          student_id: userId,
          class_id: classData.id,
        });

      if (enrollError) {
        if (enrollError.code === "23505") {
          throw new Error("Ya estás inscrito en esta clase");
        }
        throw enrollError;
      }

      toast.success("¡Te has unido a la clase exitosamente!");
      setClassCode("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al unirse a la clase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unirse a una Clase</DialogTitle>
          <DialogDescription>
            Ingresa el código que te proporcionó tu docente
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleJoinClass} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="classCode">Código de Clase</Label>
            <Input
              id="classCode"
              placeholder="ABC123"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              required
              className="font-mono"
            />
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
              {loading ? "Uniéndose..." : "Unirse"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinClassDialog;
