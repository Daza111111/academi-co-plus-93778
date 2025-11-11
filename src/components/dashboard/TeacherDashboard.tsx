import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, LogOut, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
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

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || "?";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-hero rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AcademiCO</h1>
              <p className="text-xs text-muted-foreground">Portal Docente</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={() => navigate("/profile")}
              className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {profile?.full_name ? getInitials(profile.full_name) : '?'}
                </AvatarFallback>
              </Avatar>
            </button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-1">Mis Clases</h2>
            <p className="text-muted-foreground">Gestiona y organiza tus clases</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="shadow-lg">
            <Plus className="h-5 w-5 mr-2" />
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
                className="group shadow-card hover:shadow-lg-custom transition-all duration-300 cursor-pointer border-2 hover:border-primary/20 bg-gradient-card"
                onClick={() => setSelectedClass(classData.id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="group-hover:text-primary transition-colors flex items-start justify-between">
                    <span>{classData.name}</span>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span className="font-mono font-semibold bg-muted px-2 py-1 rounded text-xs">
                      {classData.code}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                    {classData.description || "Sin descripción"}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center text-sm font-medium">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      <span>{classData.student_count}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {classData.student_count === 1 ? "estudiante" : "estudiantes"}
                    </span>
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
