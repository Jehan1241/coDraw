// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRegistered, setIsRegistered] = useState(false); // New state for success message
    const navigate = useNavigate();
    const { login, logout } = useAuth();

    const API_URL = 'http://localhost:8080/api';

    const handleLogin = async () => {
        setError('');
        setIsRegistered(false);

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                // If status is 401/409/500, throw a specific error
                const errorData = await res.json();
                throw new Error(errorData.error || 'Login failed.');
            }

            const { token } = await res.json();
            login(token); // <-- Save the token to our global state

            // Successfully logged in, redirect to a new working board
            navigate('/boards');

        } catch (err: any) {
            setError(err.message || 'Network error.');
        }
    };

    const handleRegister = async () => {
        setError('');
        setIsRegistered(false);

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                // Handle unique constraint violation or other server errors
                const errorData = await res.json();
                throw new Error(errorData.error || 'Registration failed.');
            }

            // Registration successful! Clear the form and show the success message.
            setEmail('');
            setPassword('');
            setIsRegistered(true);

        } catch (err: any) {
            setError(err.message || 'Network error.');
        }
    };

    // 2 people could potentially roll the same id here?
    const handleSkip = () => {
        logout();
        const guestBoardId = `guest-${crypto.randomUUID()}`;
        navigate(`/board/${guestBoardId}`);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Welcome</CardTitle>
                    <CardDescription>
                        Log in or register to save your work.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleLogin();
                            }}
                        />
                    </div>
                    {/* Display error or success message */}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {isRegistered && (
                        <p className="text-sm text-green-600">
                            Registration successful! Please log in above.
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-y-4">
                    <div className="flex w-full gap-x-2">
                        <Button onClick={handleLogin} className="w-full">
                            Login
                        </Button>
                        <Button onClick={handleRegister} variant="outline" className="w-full">
                            Register
                        </Button>
                    </div>
                    <Button onClick={handleSkip} variant="link" className="w-full">
                        Continue as Guest
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}