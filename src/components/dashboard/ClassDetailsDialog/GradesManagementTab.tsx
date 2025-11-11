import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateGradeItemDialog from "./CreateGradeItemDialog";
import GradeItemsList from "./GradeItemsList";

interface GradesManagementTabProps {
  classId: string;
}

const GradesManagementTab = ({ classId }: GradesManagementTabProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCorte, setSelectedCorte] = useState<number>(1);
  const [refresh, setRefresh] = useState(0);

  const handleGradeItemCreated = () => {
    setRefresh((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestión de Calificaciones</CardTitle>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Evaluación
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCorte.toString()} onValueChange={(v) => setSelectedCorte(parseInt(v))}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1">Corte 1 (30%)</TabsTrigger>
              <TabsTrigger value="2">Corte 2 (35%)</TabsTrigger>
              <TabsTrigger value="3">Corte 3 (35%)</TabsTrigger>
            </TabsList>

            {[1, 2, 3].map((corte) => (
              <TabsContent key={corte} value={corte.toString()} className="mt-4">
                <GradeItemsList classId={classId} corte={corte} refresh={refresh} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <CreateGradeItemDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        classId={classId}
        onSuccess={handleGradeItemCreated}
      />
    </div>
  );
};

export default GradesManagementTab;
