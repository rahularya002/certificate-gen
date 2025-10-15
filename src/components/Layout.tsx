import { NavLink, Outlet } from "react-router-dom";
import { FileSpreadsheet, FileText, Zap, History, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: FileSpreadsheet, label: "Upload Excel" },
  { to: "/mapping", icon: FileText, label: "Template Mapping" },
  { to: "/generate", icon: Zap, label: "Generate" },
  { to: "/results", icon: Download, label: "Results" },
  { to: "/history", icon: History, label: "History" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">CertGen Pro</h1>
              <p className="text-sm text-muted-foreground">Professional Certificate Generation System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}