// src/App.tsx
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { BoardPage } from "./pages/BoardPage";
import { Toaster } from "sonner";
import { useEffect } from "react";

// Helper component to generate a random board ID when hitting "/"
function HomeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Generate a random UUID and redirect to it immediately
    const newId = crypto.randomUUID();
    navigate(`/board/${newId}`, { replace: true });
  }, [navigate]);

  return null;
}

function App() {
  return (
    <>
      <Routes>
        {/* 1. The Main App: The Board */}
        <Route path="/board/:boardId" element={<BoardPage />} />

        {/* 2. Root Path: Redirect to a new random board */}
        <Route path="/" element={<HomeRedirect />} />

        {/* 3. Catch-all: Redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster richColors />
    </>
  );
}

export default App;