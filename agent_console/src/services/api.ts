import axios, { AxiosInstance, AxiosResponse } from "axios";

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL:
                import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
            timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || "10000"),
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem("auth_token");
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("user");
                    window.location.reload();
                }
                return Promise.reject(error);
            }
        );
    }

    // Authentication
    async login(credentials: { email: string; password: string }) {
        try {
            const response = await this.api.post(
                "/api/auth/login",
                credentials
            );

            if (response.data.token) {
                localStorage.setItem("auth_token", response.data.token);
            }

            return response.data;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Login failed. Please check your credentials.");
        }
    }

    async logout() {
        try {
            await this.api.post("/api/auth/logout");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user");
        }
    }

    async getCurrentUser() {
        try {
            const response = await this.api.get("/api/auth/user");
            return response.data.user;
        } catch (error) {
            console.error("Get current user error:", error);
            throw error;
        }
    }

    // Chat operations
    async createChat(userData: { name: string; email: string }) {
        try {
            const response = await this.api.post("/api/chats", userData);
            return response.data.chat;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to create chat.");
        }
    }

    async getChats() {
        try {
            const response = await this.api.get("/api/chats");
            return response.data.chats;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to fetch chats.");
        }
    }

    async getUserChats(email: string) {
        try {
            const response = await this.api.get(`/api/chats/user/${email}`);
            return response.data.chats;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to fetch user chats.");
        }
    }

    async getChatById(chatId: string) {
        try {
            const response = await this.api.get(`/api/chats/${chatId}`);
            return response.data.chat;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to fetch chat.");
        }
    }

    async sendMessage(
        chatId: string,
        messageData: {
            content: string;
            type: string;
            file_url?: string;
            file_name?: string;
            file_size?: number;
            voice_duration?: number;
        }
    ) {
        try {
            const response = await this.api.post(
                `/api/chats/${chatId}/messages`,
                messageData
            );
            return response.data.message;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to send message.");
        }
    }

    async markMessageAsRead(messageId: string) {
        try {
            const response = await this.api.put(
                `/api/messages/${messageId}/read`
            );
            return response.data.message;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to mark message as read.");
        }
    }

    async uploadFile(file: File, chatId: string) {
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("chat_id", chatId);

            console.log("API: Uploading file:", {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                chatId: chatId,
            });

            // Check if we have authentication token
            const token = localStorage.getItem("auth_token");
            console.log("API: Auth token present:", !!token);

            const response = await this.api.post(
                "/api/files/upload",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            console.log("API: Upload response:", response.data);

            // The Laravel backend returns the file data directly in response.data
            // No need to look for nested properties
            const fileData = response.data;

            if (!fileData) {
                console.error("API: No file data in response:", response.data);
                throw new Error(
                    "Upload failed: No file data received from server"
                );
            }

            return fileData;
        } catch (error: any) {
            console.error("API: Upload error:", error);
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to upload file.");
        }
    }

    // Agent operations
    async getAgentChats() {
        try {
            const response = await this.api.get("/api/agent/chats");
            return response.data;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to fetch agent chats.");
        }
    }

    async assignChatToAgent(chatId: string) {
        try {
            const response = await this.api.post(
                `/api/agent/chats/${chatId}/assign`
            );
            return response.data.chat;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to assign chat to agent.");
        }
    }

    async updateAgentStatus(status: string) {
        try {
            const response = await this.api.put("/api/agent/status", {
                status,
            });
            return response.data.agent;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to update agent status.");
        }
    }

    async getAgentStats() {
        try {
            const response = await this.api.get("/api/agent/stats");
            return response.data.stats;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to fetch agent stats.");
        }
    }

    async closeChatAsAgent(chatId: string) {
        try {
            const response = await this.api.post(
                `/api/agent/chats/${chatId}/close`
            );
            return response.data.chat;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to close chat.");
        }
    }

    async sendTypingStatus(chatId: string, isTyping: boolean) {
        try {
            const response = await this.api.post(
                `/api/chats/${chatId}/typing`,
                {
                    isTyping: isTyping,
                }
            );
            return response.data;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to send typing status.");
        }
    }

    async getTypingStatuses(chatId: string) {
        try {
            const response = await this.api.get(`/api/chats/${chatId}/typing`);
            return response.data;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error("Failed to fetch typing statuses.");
        }
    }
}

export default new ApiService();
