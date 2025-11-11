import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, CheckSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import StudentsListTab from "./ClassDetailsDialog/StudentsListTab";
import GradesManagementTab from "./ClassDetailsDialog/GradesManagementTab";
import AttendanceManagementTab from "./ClassDetailsDialog/AttendanceManagementTab";

interface ClassDetailsDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClassDeleted?: () => void;
}

const ClassDetailsDialog = ({ classId, open, onOpenChange, onClassDeleted }: ClassDetailsDialogProps) => {
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open && classId) {
      fetchClassData();
    }
  }, [classId, open]);

  const fetchClassData = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .single();

      if (error) throw error;
      setClassData(data);
    } catch (error) {
      console.error("Error fetching class data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async () => {
    try {
      setDeleting(true);

      // Delete the class - all related data will be deleted automatically due to ON DELETE CASCADE
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classId);

      if (error) throw error;

      toast.success("Clase eliminada exitosamente");
      setDeleteDialogOpen(false);
      onOpenChange(false);
      
      // Notify parent to refresh the list
      if (onClassDeleted) {
        onClassDeleted();
      }
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Error al eliminar la clase");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{classData?.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Código: <span className="font-mono font-semibold">{classData?.code}</span>
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Clase
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-2" />
              Estudiantes
            </TabsTrigger>
            <TabsTrigger value="grades">
              <FileText className="h-4 w-4 mr-2" />
              Calificaciones
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <CheckSquare className="h-4 w-4 mr-2" />
              Asistencia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-4">
            <StudentsListTab classId={classId} />
          </TabsContent>

          <TabsContent value="grades" className="mt-4">
            <GradesManagementTab classId={classId} />
          </TabsContent>

          <TabsContent value="attendance" className="mt-4">
            <AttendanceManagementTab classId={classId} />
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la clase{" "}
                <strong>{classData?.name}</strong> y todos los datos asociados:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Inscripciones de estudiantes</li>
                  <li>Todas las calificaciones</li>
                  <li>Registros de asistencia</li>
                  <li>Ítems de evaluación</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteClass}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar clase"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default ClassDetailsDialog;
