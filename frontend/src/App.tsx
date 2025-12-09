// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { BoardPage } from "./pages/BoardPage";
import { Toaster } from "sonner";
import { DashboardPage } from "./pages/DashboardPage";
import { UserProvider } from "./contexts/UserContext";
import { ThemeProvider } from "./components/ui/theme-provider";


function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme" >
        <UserProvider>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/board/:boardId" element={<BoardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster richColors />
        </UserProvider>
      </ThemeProvider>

    </>
  );
}

export default App;