import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";

interface AttendanceManagementTabProps {
  classId: string;
}

interface Student {
  id: string;
  full_name: string;
  present: boolean;
}

const AttendanceManagementTab = ({ classId }: AttendanceManagementTabProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [classId, selectedDate]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data: enrollments, error } = await supabase
        .from("enrollments")
        .select(`
          profiles!enrollments_student_id_fkey (
            id,
            full_name
          )
        `)
        .eq("class_id", classId);

      if (error) throw error;

      const dateStr = selectedDate.toISOString().split("T")[0];

      // Fetch attendance for selected date
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("student_id, present")
        .eq("class_id", classId)
        .eq("date", dateStr);

      const attendanceMap = new Map(
        attendanceData?.map((a) => [a.student_id, a.present]) || []
      );

      const studentsData: Student[] = enrollments.map((enrollment: any) => ({
        id: enrollment.profiles.id,
        full_name: enrollment.profiles.full_name,
        present: attendanceMap.get(enrollment.profiles.id) ?? true,
      }));

      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Error al cargar estudiantes");
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceToggle = (studentId: string, present: boolean) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, present } : s))
    );
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];

      // Delete existing attendance for this date
      await supabase
        .from("attendance")
        .delete()
        .eq("class_id", classId)
        .eq("date", dateStr);

      // Insert new attendance records
      const attendanceRecords = students.map((student) => ({
        student_id: student.id,
        class_id: classId,
        date: dateStr,
        present: student.present,
      }));

      const { error } = await supabase.from("attendance").insert(attendanceRecords);

      if (error) throw error;

      toast.success("Asistencia guardada exitosamente");
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Error al guardar asistencia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Fecha</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Asistencia - {selectedDate.toLocaleDateString("es-CO")}
            </CardTitle>
            <Button onClick={handleSaveAttendance} disabled={saving || loading}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4 text-muted-foreground">Cargando...</p>
          ) : students.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              No hay estudiantes inscritos
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead className="text-right">Presente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.full_name}</TableCell>
                    <TableCell className="text-right">
                      <Checkbox
                        checked={student.present}
                        onCheckedChange={(checked) =>
                          handleAttendanceToggle(student.id, checked as boolean)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceManagementTab;
