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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/my-tasks" element={<MyTasks />} />
          <Route path="/admin/monitoring" element={<AdminMonitoring />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/workflows/:id" element={<WorkflowDetail />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/create" element={<CreateTemplate />} />
          <Route path="/templates/:id/edit" element={<CreateTemplate />} />
          <Route path="/start/:type" element={<StartProcess />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
