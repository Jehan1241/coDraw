import { Route, Routes, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { BoardPage } from "./pages/BoardPage";
import { DashboardPage } from "./pages/DashboardPage";
import { useAuth } from "./contexts/AuthContext";
import { type JSX } from "react";
import { Toaster } from "sonner";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token, isLoading } = useAuth(); // 3. Get isLoading state
  if (isLoading) {
    return null; // Or a loading spinner
  }
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}


function App() {

  const { isLoading, token } = useAuth()

  if (isLoading) {
    return null; // Or a full-screen loading spinner
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={
          token ? <Navigate to="/boards" replace /> : <LoginPage />
        } />
        <Route path="/board/:boardId" element={<BoardPage />}
        />
        <Route
          path="/boards"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/boards" replace />} />
        <Route path="*" element={<Navigate to="/boards" replace />} />
      </Routes>
      <Toaster richColors />
    </>
  );
}

export default App
