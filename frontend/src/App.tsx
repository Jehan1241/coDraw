// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { BoardPage } from "./pages/BoardPage";
import { Toaster } from "sonner";
import { DashboardPage } from "./pages/DashboardPage";
import { UserProvider } from "./contexts/UserContext";


function App() {
  return (
    <>
      <UserProvider>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/board/:boardId" element={<BoardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster richColors />
      </UserProvider>
    </>
  );
}

export default App;