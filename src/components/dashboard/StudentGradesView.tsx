import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ClassData {
  id: string;
  name: string;
}

interface StudentGradesViewProps {
  classes: ClassData[];
}

interface GradeData {
  grade_item_name: string;
  corte: number;
  percentage: number;
  score: number;
}

const StudentGradesView = ({ classes }: StudentGradesViewProps) => {
  const [gradesByClass, setGradesByClass] = useState<Record<string, GradeData[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, [classes]);

  const fetchGrades = async () => {
    try {
      const gradesData: Record<string, GradeData[]> = {};

      for (const classItem of classes) {
        const { data, error } = await supabase
          .from("grades")
          .select(`
            score,
            grade_items (
              name,
              corte,
              percentage
            )
          `)
          .eq("student_id", (await supabase.auth.getUser()).data.user?.id)
          .in("grade_item_id", 
            await supabase
              .from("grade_items")
              .select("id")
              .eq("class_id", classItem.id)
              .then(({ data }) => data?.map((item) => item.id) || [])
          );

        if (!error && data) {
          gradesData[classItem.id] = data.map((grade: any) => ({
            grade_item_name: grade.grade_items.name,
            corte: grade.grade_items.corte,
            percentage: grade.grade_items.percentage,
            score: grade.score,
          }));
        }
      }

      setGradesByClass(gradesData);
    } catch (error) {
      console.error("Error fetching grades:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCorteAverage = (grades: GradeData[], corte: number) => {
    const corteGrades = grades.filter((g) => g.corte === corte);
    if (corteGrades.length === 0) return null;

    const totalPercentage = corteGrades.reduce((sum, grade) => sum + grade.percentage, 0);
    const totalWeighted = corteGrades.reduce(
      (sum, grade) => sum + (grade.score * grade.percentage / 100),
      0
    );
    
    // Calculate the corte average (0-5.0 scale)
    const corteAverage = totalPercentage > 0 ? (totalWeighted / totalPercentage) * 100 : 0;
    return corteAverage;
  };

  const getCorteWeight = (corte: number) => {
    return corte === 1 ? 0.3 : 0.35;
  };

  const calculateFinalGrade = (grades: GradeData[]) => {
    const corte1 = calculateCorteAverage(grades, 1);
    const corte2 = calculateCorteAverage(grades, 2);
    const corte3 = calculateCorteAverage(grades, 3);

    if (!corte1 && !corte2 && !corte3) return null;

    const final =
      (corte1 || 0) * 0.3 +
      (corte2 || 0) * 0.35 +
      (corte3 || 0) * 0.35;

    return final;
  };

  if (loading) {
    return <p className="text-center py-8 text-muted-foreground">Cargando notas...</p>;
  }

  return (
    <div className="space-y-6">
      {classes.map((classItem) => {
        const classGrades = gradesByClass[classItem.id] || [];
        const finalGrade = calculateFinalGrade(classGrades);

        return (
          <Card key={classItem.id} className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{classItem.name}</CardTitle>
                  <CardDescription>Calificaciones por Corte</CardDescription>
                </div>
                {finalGrade !== null && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Nota Global</p>
                    <p className="text-3xl font-bold text-primary">{finalGrade.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">sobre 5.0</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {classGrades.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  No hay calificaciones registradas
                </p>
              ) : (
                <div className="space-y-6">
                  {[1, 2, 3].map((corte) => {
                    const corteGrades = classGrades.filter((g) => g.corte === corte);
                    const corteAvg = calculateCorteAverage(classGrades, corte);
                    const corteWeight = getCorteWeight(corte);
                    const corteWeightPercentage = corteWeight * 100;
                    const corteContribution = corteAvg ? corteAvg * corteWeight : 0;

                    return corteGrades.length > 0 ? (
                      <div key={corte} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold">Corte {corte}</h4>
                          <div className="text-right">
                            <Badge variant="secondary" className="text-base px-3 py-1">
                              Nota del corte: {corteAvg?.toFixed(2)} / 5.0
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              Vale {corteWeightPercentage}% de la nota final
                            </p>
                            <p className="text-sm font-semibold text-primary">
                              Aporte a nota global: {corteContribution.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Evaluación</TableHead>
                              <TableHead className="text-right">% del corte</TableHead>
                              <TableHead className="text-right">Nota</TableHead>
                              <TableHead className="text-right">Aporte</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {corteGrades.map((grade, idx) => {
                              const contribution = (grade.score * grade.percentage / 100);
                              return (
                                <TableRow key={idx}>
                                  <TableCell>{grade.grade_item_name}</TableCell>
                                  <TableCell className="text-right">{grade.percentage}%</TableCell>
                                  <TableCell className="text-right font-medium">
                                    {grade.score.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {contribution.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell colSpan={3} className="text-right">
                                Total del Corte {corte}:
                              </TableCell>
                              <TableCell className="text-right text-primary">
                                {corteAvg?.toFixed(2)} / 5.0
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StudentGradesView;
