import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, LogOut, BookOpen, CheckSquare, FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import JoinClassDialog from "./JoinClassDialog";
import StudentGradesView from "./StudentGradesView";
import StudentAttendanceView from "./StudentAttendanceView";
import StudentClassDetailsDialog from "./StudentClassDetailsDialog";

interface StudentDashboardProps {
  user: User;
}

interface ClassData {
  id: string;
  name: string;
  code: string;
  description: string;
  teacher_name: string;
}

const StudentDashboard = ({ user }: StudentDashboardProps) => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchClasses();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data: enrollments, error } = await supabase
        .from("enrollments")
        .select(`
          class_id,
          classes (
            id,
            name,
            code,
            description,
            teacher_id,
            profiles!classes_teacher_id_fkey (
              full_name
            )
          )
        `)
        .eq("student_id", user.id);

      if (error) throw error;

      const classesData = enrollments?.map((enrollment: any) => ({
        id: enrollment.classes.id,
        name: enrollment.classes.name,
        code: enrollment.classes.code,
        description: enrollment.classes.description,
        teacher_name: enrollment.classes.profiles.full_name,
      })) || [];

      setClasses(classesData);
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleJoinClass = () => {
    fetchClasses(); // Refresh classes after joining
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">AcademiCO</h1>
              <p className="text-sm text-muted-foreground">Portal Estudiante</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/profile")}
              className="text-right hover:opacity-80 transition-opacity"
            >
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold">Mis Clases</h2>
            <Button onClick={() => setJoinDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Unirse a Clase
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando clases...</p>
            </div>
          ) : classes.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="py-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No estás inscrito en ninguna clase
                </p>
                <Button onClick={() => setJoinDialogOpen(true)}>
                  Unirse a una Clase
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {classes.map((classData) => (
                <Card 
                  key={classData.id} 
                  className="shadow-card hover:shadow-lg-custom transition-shadow cursor-pointer"
                  onClick={() => setSelectedClass(classData.id)}
                >
                  <CardHeader>
                    <CardTitle>{classData.name}</CardTitle>
                    <CardDescription>
                      Profesor: {classData.teacher_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      {classData.description || "Sin descripción"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Código: <span className="font-mono font-semibold">{classData.code}</span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {classes.length > 0 && (
          <Tabs defaultValue="grades" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="grades">
                <FileText className="h-4 w-4 mr-2" />
                Notas
              </TabsTrigger>
              <TabsTrigger value="attendance">
                <CheckSquare className="h-4 w-4 mr-2" />
                Asistencia
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="h-4 w-4 mr-2" />
                Reportes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grades">
              <StudentGradesView classes={classes} />
            </TabsContent>

            <TabsContent value="attendance">
              <StudentAttendanceView classes={classes} />
            </TabsContent>

            <TabsContent value="reports">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Reportes Académicos</CardTitle>
                  <CardDescription>
                    Visualiza tus reportes de rendimiento académico
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Funcionalidad de reportes en desarrollo
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <JoinClassDialog
          open={joinDialogOpen}
          onOpenChange={setJoinDialogOpen}
          onSuccess={handleJoinClass}
          userId={user.id}
        />

        {selectedClass && (
          <StudentClassDetailsDialog
            classId={selectedClass}
            open={!!selectedClass}
            onOpenChange={(open) => !open && setSelectedClass(null)}
            studentId={user.id}
          />
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
