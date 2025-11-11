import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface ClassData {
  id: string;
  name: string;
}

interface StudentAttendanceViewProps {
  classes: ClassData[];
}

interface AttendanceData {
  date: string;
  present: boolean;
}

const StudentAttendanceView = ({ classes }: StudentAttendanceViewProps) => {
  const [attendanceByClass, setAttendanceByClass] = useState<Record<string, AttendanceData[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, [classes]);

  const fetchAttendance = async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const attendanceData: Record<string, AttendanceData[]> = {};

      for (const classItem of classes) {
        const { data, error } = await supabase
          .from("attendance")
          .select("date, present")
          .eq("student_id", userId)
          .eq("class_id", classItem.id)
          .order("date", { ascending: false });

        if (!error && data) {
          attendanceData[classItem.id] = data;
        }
      }

      setAttendanceByClass(attendanceData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendancePercentage = (attendance: AttendanceData[]) => {
    if (attendance.length === 0) return "0";
    const present = attendance.filter((a) => a.present).length;
    return ((present / attendance.length) * 100).toFixed(1);
  };

  if (loading) {
    return <p className="text-center py-8 text-muted-foreground">Cargando asistencia...</p>;
  }

  return (
    <div className="space-y-6">
      {classes.map((classItem) => {
        const classAttendance = attendanceByClass[classItem.id] || [];
        const percentage = calculateAttendancePercentage(classAttendance);

        return (
          <Card key={classItem.id} className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{classItem.name}</CardTitle>
                  <CardDescription>Registro de Asistencia</CardDescription>
                </div>
                <Badge 
                  variant={parseFloat(percentage) >= 80 ? "default" : "destructive"}
                  className="text-base px-4 py-1"
                >
                  {percentage}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {classAttendance.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  No hay registros de asistencia
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classAttendance.map((record, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {new Date(record.date).toLocaleDateString("es-CO", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {record.present ? (
                            <div className="inline-flex items-center gap-2 text-accent">
                              <CheckCircle2 className="h-5 w-5" />
                              <span>Presente</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 text-destructive">
                              <XCircle className="h-5 w-5" />
                              <span>Ausente</span>
                            </div>
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
    </div>
  );
};

export default StudentAttendanceView;
