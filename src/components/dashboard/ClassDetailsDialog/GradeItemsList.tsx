import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface GradeItemsListProps {
  classId: string;
  corte: number;
  refresh: number;
}

interface GradeItem {
  id: string;
  name: string;
  percentage: number;
}

interface StudentGrade {
  student_id: string;
  student_name: string;
  grades: Record<string, number>;
}

const GradeItemsList = ({ classId, corte, refresh }: GradeItemsListProps) => {
  const [gradeItems, setGradeItems] = useState<GradeItem[]>([]);
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [classId, corte, refresh]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch grade items for this corte
      const { data: items, error: itemsError } = await supabase
        .from("grade_items")
        .select("id, name, percentage")
        .eq("class_id", classId)
        .eq("corte", corte)
        .order("created_at");

      if (itemsError) throw itemsError;
      setGradeItems(items || []);

      // Fetch students
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select(`
          student_id,
          profiles!enrollments_student_id_fkey (
            full_name
          )
        `)
        .eq("class_id", classId);

      if (enrollError) throw enrollError;

      // Fetch existing grades
      const gradeItemIds = items?.map((item) => item.id) || [];
      const { data: existingGrades } = await supabase
        .from("grades")
        .select("student_id, grade_item_id, score")
        .in("grade_item_id", gradeItemIds);

      // Build grades map
      const gradesMap = new Map<string, Record<string, number>>();
      existingGrades?.forEach((grade) => {
        if (!gradesMap.has(grade.student_id)) {
          gradesMap.set(grade.student_id, {});
        }
        gradesMap.get(grade.student_id)![grade.grade_item_id] = grade.score;
      });

      const studentsData: StudentGrade[] = enrollments.map((enrollment: any) => ({
        student_id: enrollment.student_id,
        student_name: enrollment.profiles.full_name,
        grades: gradesMap.get(enrollment.student_id) || {},
      }));

      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId: string, gradeItemId: string, value: string) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.student_id === studentId
          ? {
              ...student,
              grades: {
                ...student.grades,
                [gradeItemId]: parseFloat(value) || 0,
              },
            }
          : student
      )
    );
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    try {
      const gradesToUpsert = students.flatMap((student) =>
        Object.entries(student.grades).map(([gradeItemId, score]) => ({
          student_id: student.student_id,
          grade_item_id: gradeItemId,
          score: Math.min(Math.max(score, 0), 5), // Clamp between 0 and 5
        }))
      );

      const { error } = await supabase.from("grades").upsert(gradesToUpsert, {
        onConflict: "student_id,grade_item_id",
      });

      if (error) throw error;

      toast.success("Calificaciones guardadas exitosamente");
    } catch (error: any) {
      toast.error(error.message || "Error al guardar calificaciones");
    } finally {
      setSaving(false);
    }
  };

  const calculateUsedPercentage = () => {
    return gradeItems.reduce((sum, item) => sum + item.percentage, 0);
  };

  const maxPercentage = corte === 1 ? 30 : 35;
  const usedPercentage = calculateUsedPercentage();
  const remainingPercentage = maxPercentage - usedPercentage;

  if (loading) {
    return <p className="text-center py-4 text-muted-foreground">Cargando...</p>;
  }

  if (gradeItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-2">No hay evaluaciones creadas para este corte</p>
        <Badge variant="outline">
          Disponible: {maxPercentage}%
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant={remainingPercentage < 0 ? "destructive" : "outline"}>
          Usado: {usedPercentage.toFixed(1)}% / {maxPercentage}%
        </Badge>
        <Button onClick={handleSaveGrades} disabled={saving}>
          {saving ? "Guardando..." : "Guardar Calificaciones"}
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Estudiante</TableHead>
              {gradeItems.map((item) => (
                <TableHead key={item.id} className="text-center min-w-[120px]">
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {item.percentage}%
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.student_id}>
                <TableCell className="font-medium">{student.student_name}</TableCell>
                {gradeItems.map((item) => (
                  <TableCell key={item.id}>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      placeholder="0.00"
                      value={student.grades[item.id] || ""}
                      onChange={(e) =>
                        handleGradeChange(student.student_id, item.id, e.target.value)
                      }
                      className="w-full text-center"
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GradeItemsList;
