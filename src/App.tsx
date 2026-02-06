import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Workflows from "./pages/Workflows";
import WorkflowDetail from "./pages/WorkflowDetail";
import Templates from "./pages/Templates";
import CreateTemplate from "./pages/CreateTemplate";
import StartProcess from "./pages/StartProcess";
import MyTasks from "./pages/MyTasks";
import AdminMonitoring from "./pages/AdminMonitoring";
import EmployeeDirectory from "./pages/EmployeeDirectory";
import EmployeeForm from "./pages/EmployeeForm";
import EmployeeDetail from "./pages/EmployeeDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Login />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
    return (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/my-tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
          <Route path="/admin/monitoring" element={<ProtectedRoute><AdminMonitoring /></ProtectedRoute>} />
          <Route path="/admin/directory" element={<ProtectedRoute><EmployeeDirectory /></ProtectedRoute>} />
          <Route path="/admin/directory/new" element={<ProtectedRoute><EmployeeForm /></ProtectedRoute>} />
          <Route path="/admin/directory/:id/edit" element={<ProtectedRoute><EmployeeForm /></ProtectedRoute>} />
          <Route path="/admin/directory/:id" element={<ProtectedRoute><EmployeeDetail /></ProtectedRoute>} />
          <Route path="/workflows" element={<ProtectedRoute><Workflows /></ProtectedRoute>} />
          <Route path="/workflows/:id" element={<ProtectedRoute><WorkflowDetail /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/templates/create" element={<ProtectedRoute><CreateTemplate /></ProtectedRoute>} />
          <Route path="/templates/:id/edit" element={<ProtectedRoute><CreateTemplate /></ProtectedRoute>} />
          <Route path="/start/:type" element={<ProtectedRoute><StartProcess /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);


export default App;
