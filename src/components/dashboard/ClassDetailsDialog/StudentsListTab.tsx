import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface StudentsListTabProps {
  classId: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  enrolled_at: string;
}

const StudentsListTab = ({ classId }: StudentsListTabProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [classId]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          enrolled_at,
          profiles!enrollments_student_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq("class_id", classId);

      if (error) {
        console.error("Error fetching students:", error);
        throw error;
      }

      const studentsData = data?.map((enrollment: any) => ({
        id: enrollment.profiles.id,
        full_name: enrollment.profiles.full_name,
        email: enrollment.profiles.email,
        enrolled_at: enrollment.enrolled_at,
      })) || [];

      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    toast.success("Lista de estudiantes actualizada");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <p className="text-center py-8 text-muted-foreground">Cargando estudiantes...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lista de Estudiantes ({students.length})</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">
            No hay estudiantes inscritos en esta clase
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Fecha de Inscripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(student.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>
                    {new Date(student.enrolled_at).toLocaleDateString("es-CO")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentsListTab;
