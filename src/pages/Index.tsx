import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold text-primary">AcademiCO</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Iniciar Sesión
          </Button>
          <Button onClick={() => navigate("/auth")}>Registrarse</Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <section className="py-20 text-center max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Sistema de Gestión Académica Colombiana
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Plataforma integral para docentes y estudiantes con gestión de cursos, calificaciones
            por cortes y reportes académicos del sistema educativo colombiano.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="xl" variant="hero" onClick={() => navigate("/auth")}>
              Comenzar Ahora
            </Button>
            <Button size="xl" variant="heroOutline" onClick={() => navigate("/auth")}>
              Iniciar Sesión
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-card p-8 rounded-xl shadow-card hover:shadow-lg-custom transition-all duration-200">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Para Estudiantes</h3>
            <p className="text-muted-foreground">
              Visualiza tus notas por cortes, asistencia y reportes académicos. Únete a clases
              con códigos simples.
            </p>
          </div>

          <div className="bg-card p-8 rounded-xl shadow-card hover:shadow-lg-custom transition-all duration-200">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Para Docentes</h3>
            <p className="text-muted-foreground">
              Crea clases, gestiona calificaciones por cortes (30%, 35%, 35%) y registra
              asistencia de forma eficiente.
            </p>
          </div>

          <div className="bg-card p-8 rounded-xl shadow-card hover:shadow-lg-custom transition-all duration-200">
            <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Sistema Colombiano</h3>
            <p className="text-muted-foreground">
              Diseñado específicamente para el sistema de evaluación por cortes del sistema
              educativo colombiano.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="bg-gradient-hero rounded-2xl p-12 max-w-3xl mx-auto shadow-lg-custom">
            <h2 className="text-3xl font-bold text-white mb-4">
              Comienza a Transformar tu Gestión Académica
            </h2>
            <p className="text-white/90 mb-6">
              Sin confirmación de correo. Regístrate en segundos y empieza a usar todas las
              funcionalidades.
            </p>
            <Button size="xl" variant="heroOutline" onClick={() => navigate("/auth")}>
              Crear Cuenta Gratis
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center border-t border-border">
        <p className="text-muted-foreground">
          © 2025 AcademiCO - Sistema de Gestión Académica Colombiana
        </p>
      </footer>
    </div>
  );
};

export default Index;
