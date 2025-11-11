import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FileText, CheckSquare, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface StudentClassDetailsDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

interface ClassInfo {
  name: string;
  description: string;
  code: string;
  teacher_name: string;
}

interface GradeItem {
  id: string;
  name: string;
  corte: number;
  percentage: number;
  score?: number;
}

interface AttendanceRecord {
  date: string;
  present: boolean;
}

const StudentClassDetailsDialog = ({ classId, open, onOpenChange, studentId }: StudentClassDetailsDialogProps) => {
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && classId) {
      fetchClassDetails();
    }
  }, [open, classId]);

  const fetchClassDetails = async () => {
    setLoading(true);
    try {
      // Fetch class info
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select(`
          name,
          description,
          code,
          profiles!classes_teacher_id_fkey (
            full_name
          )
        `)
        .eq("id", classId)
        .single();

      if (classError) throw classError;

      setClassInfo({
        name: classData.name,
        description: classData.description,
        code: classData.code,
        teacher_name: classData.profiles.full_name,
      });

      // Fetch grades
      const { data: gradeItems, error: gradeItemsError } = await supabase
        .from("grade_items")
        .select("id, name, corte, percentage")
        .eq("class_id", classId)
        .order("corte", { ascending: true })
        .order("created_at", { ascending: true });

      if (gradeItemsError) throw gradeItemsError;

      // Fetch student's grades
      const gradeItemIds = gradeItems?.map((item) => item.id) || [];
      const { data: studentGrades, error: gradesError } = await supabase
        .from("grades")
        .select("grade_item_id, score")
        .eq("student_id", studentId)
        .in("grade_item_id", gradeItemIds);

      if (gradesError) throw gradesError;

      const gradesWithScores = gradeItems?.map((item) => ({
        ...item,
        score: studentGrades?.find((g) => g.grade_item_id === item.id)?.score,
      })) || [];

      setGrades(gradesWithScores);

      // Fetch attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("date, present")
        .eq("student_id", studentId)
        .eq("class_id", classId)
        .order("date", { ascending: false });

      if (attendanceError) throw attendanceError;

      setAttendance(attendanceData || []);
    } catch (error) {
      console.error("Error fetching class details:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCorteAverage = (corte: number) => {
    const corteGrades = grades.filter((g) => g.corte === corte && g.score !== undefined);
    if (corteGrades.length === 0) return null;

    const totalWeightedScore = corteGrades.reduce(
      (sum, grade) => sum + (grade.score! * grade.percentage) / 100,
      0
    );
    return totalWeightedScore.toFixed(2);
  };

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return "N/A";
    const present = attendance.filter((a) => a.present).length;
    return `${((present / attendance.length) * 100).toFixed(1)}%`;
  };

  const getCortePercentage = (corte: number) => {
    if (corte === 1) return "30%";
    if (corte === 2) return "35%";
    if (corte === 3) return "35%";
    return "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{classInfo?.name || "Detalles de la Clase"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Cargando información...</p>
          </div>
        ) : (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">
                <Info className="h-4 w-4 mr-2" />
                Información
              </TabsTrigger>
              <TabsTrigger value="grades">
                <FileText className="h-4 w-4 mr-2" />
                Notas
              </TabsTrigger>
              <TabsTrigger value="attendance">
                <CheckSquare className="h-4 w-4 mr-2" />
                Asistencia
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Clase</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Código</p>
                    <p className="font-mono font-semibold text-lg">{classInfo?.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Docente</p>
                    <p className="font-medium">{classInfo?.teacher_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Descripción</p>
                    <p>{classInfo?.description || "Sin descripción"}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grades" className="space-y-4">
              {[1, 2, 3].map((corte) => {
                const corteGrades = grades.filter((g) => g.corte === corte);
                const average = calculateCorteAverage(corte);

                return (
                  <Card key={corte}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Corte {corte}</CardTitle>
                          <CardDescription>{getCortePercentage(corte)} de la nota final</CardDescription>
                        </div>
                        {average !== null && (
                          <Badge variant="secondary" className="text-lg px-4 py-2">
                            Promedio: {average}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {corteGrades.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          No hay calificaciones para este corte
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Evaluación</TableHead>
                              <TableHead>Porcentaje</TableHead>
                              <TableHead>Nota</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {corteGrades.map((grade) => (
                              <TableRow key={grade.id}>
                                <TableCell>{grade.name}</TableCell>
                                <TableCell>{grade.percentage}%</TableCell>
                                <TableCell>
                                  {grade.score !== undefined ? (
                                    <Badge variant={grade.score >= 3 ? "default" : "destructive"}>
                                      {grade.score.toFixed(2)}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">Sin calificar</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Registro de Asistencia</CardTitle>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {calculateAttendancePercentage()} Asistencia
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {attendance.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No hay registros de asistencia
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendance.map((record, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(record.date).toLocaleDateString("es-CO", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={record.present ? "default" : "destructive"}>
                                {record.present ? "Presente" : "Ausente"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentClassDetailsDialog;
