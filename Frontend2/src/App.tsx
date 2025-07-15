import React, { useState, useEffect } from "react";
import { LogOut, Shield } from "lucide-react";
import AgentConsole from "./components/AgentConsole/AgentConsole";
import authService from "./services/auth";
import apiService from "./services/api";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginForm, setLoginForm] = useState({ email: "", password: "" });
    const [loginError, setLoginError] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Function to get URL parameters
    const getUrlParams = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            email: urlParams.get("email"),
            password: urlParams.get("password"),
            token: urlParams.get("token"),
        };
    };

    // Function to update URL with login data
    const updateUrlWithLoginData = (
        email: string,
        password: string,
        token?: string
    ) => {
        const url = new URL(window.location.href);
        url.searchParams.set("email", email);
        url.searchParams.set("password", password);
        if (token) {
            url.searchParams.set("token", token);
        }
        window.history.replaceState({}, "", url.toString());
    };

    // Function to clear URL parameters
    const clearUrlParams = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete("email");
        url.searchParams.delete("password");
        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.toString());
    };

    // Auto-login from URL parameters
    const autoLoginFromUrl = async () => {
        const params = getUrlParams();

        if (params.email && params.password) {
            try {
                const result = await apiService.login({
                    email: params.email,
                    password: params.password,
                });

                authService.setUser(result.user);
                localStorage.setItem("auth_token", result.token);
                setIsAuthenticated(true);

                // Update URL with token if not present
                if (!params.token) {
                    updateUrlWithLoginData(
                        params.email,
                        params.password,
                        result.token
                    );
                }

                return true;
            } catch (error) {
                console.error("Auto-login failed:", error);
                // Clear invalid URL parameters
                clearUrlParams();
                return false;
            }
        }
        return false;
    };

    useEffect(() => {
        // Check if already authenticated from localStorage
        if (authService.isAuthenticated()) {
            setIsAuthenticated(true);
        } else {
            // Try auto-login from URL parameters
            autoLoginFromUrl();
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setLoginError("");

        try {
            const result = await apiService.login(loginForm);

            authService.setUser(result.user);
            localStorage.setItem("auth_token", result.token);
            setIsAuthenticated(true);
            setShowLoginModal(false);

            // Update URL with login data
            updateUrlWithLoginData(
                loginForm.email,
                loginForm.password,
                result.token
            );
        } catch (error) {
            setLoginError(
                error instanceof Error ? error.message : "Login failed"
            );
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        setIsAuthenticated(false);
        // Clear URL parameters on logout
        clearUrlParams();
    };

    if (isAuthenticated) {
        return <AgentConsole />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">
                                Agent Console
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Agent Login
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Welcome to Agent Console
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Manage customer support chats and provide excellent
                        service
                    </p>
                    <button
                        onClick={() => setShowLoginModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors"
                    >
                        Sign In as Agent
                    </button>
                </div>
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Agent Login
                            </h2>
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={loginForm.email}
                                    onChange={(e) =>
                                        setLoginForm({
                                            ...loginForm,
                                            email: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={loginForm.password}
                                    onChange={(e) =>
                                        setLoginForm({
                                            ...loginForm,
                                            password: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {loginError && (
                                <div className="text-red-600 text-sm">
                                    {loginError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoggingIn}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                            >
                                {isLoggingIn ? "Signing In..." : "Sign In"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
