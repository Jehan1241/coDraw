import { createContext, useContext, useState, useEffect } from "react";
import { generateRandomName, getRandomColor } from "@/utils/nameGenerator";
import type { ReactNode } from "react";

interface UserState {
  name: string;
  color: string;
}

interface UserContextType {
  user: UserState;
  updateName: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserState>(() => {
    const saved = localStorage.getItem("whiteboard_identity");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      name: generateRandomName(),
      color: getRandomColor(),
    };
  });

  useEffect(() => {
    localStorage.setItem("whiteboard_identity", JSON.stringify(user));
  }, [user]);

  const updateName = (name: string) => {
    setUser((prev) => ({ ...prev, name }));
  };

  return (
    <UserContext.Provider value={{ user, updateName }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}
