import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('authToken');
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            setToken(storedToken);
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string) => {
        setToken(newToken);
        localStorage.setItem('authToken', newToken);
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem('authToken');
    };

    return (
        <AuthContext.Provider value={{ token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}