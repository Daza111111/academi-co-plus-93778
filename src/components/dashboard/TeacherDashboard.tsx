import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, LogOut, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreateClassDialog from "./CreateClassDialog";
import ClassDetailsDialog from "./ClassDetailsDialog";

interface TeacherDashboardProps {
  user: User;
}

interface ClassData {
  id: string;
  name: string;
  code: string;
  description: string;
  student_count: number;
}

const TeacherDashboard = ({ user }: TeacherDashboardProps) => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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
      const { data: classesData, error } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id);

      if (error) throw error;

      // Get student count for each class
      const classesWithCount = await Promise.all(
        (classesData || []).map(async (classItem) => {
          const { count } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classItem.id);

          return {
            id: classItem.id,
            name: classItem.name,
            code: classItem.code,
            description: classItem.description,
            student_count: count || 0,
          };
        })
      );

      setClasses(classesWithCount);
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

  const handleClassCreated = () => {
    fetchClasses(); // Refresh classes after creating
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">AcademiCO</h1>
              <p className="text-sm text-muted-foreground">Portal Docente</p>
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Mis Clases</h2>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Clase
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Cargando clases...</p>
          </div>
        ) : classes.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-8 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No has creado ninguna clase todavía
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                Crear Primera Clase
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((classData) => (
              <Card 
                key={classData.id} 
                className="shadow-card hover:shadow-lg-custom transition-shadow cursor-pointer"
                onClick={() => setSelectedClass(classData.id)}
              >
                <CardHeader>
                  <CardTitle>{classData.name}</CardTitle>
                  <CardDescription>
                    Código: <span className="font-mono font-semibold">{classData.code}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {classData.description || "Sin descripción"}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {classData.student_count} estudiante{classData.student_count !== 1 ? "s" : ""}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CreateClassDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleClassCreated}
          teacherId={user.id}
        />

        {selectedClass && (
          <ClassDetailsDialog
            classId={selectedClass}
            open={!!selectedClass}
            onOpenChange={(open) => !open && setSelectedClass(null)}
            onClassDeleted={fetchClasses}
          />
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
