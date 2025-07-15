# Agent Console

A dedicated React.js application for customer support agents to manage chat sessions and provide excellent customer service.

## Features

-   **Real-time Chat Management**: Handle multiple customer chat sessions simultaneously
-   **Agent Dashboard**: View chat queue, customer information, and conversation history
-   **File Sharing**: Send and receive files, images, and voice messages
-   **Typing Indicators**: Real-time typing status for better communication
-   **Status Management**: Update availability status and manage workload
-   **WebSocket Integration**: Real-time updates using Laravel Echo and Pusher

## Technology Stack

-   **Frontend**: React.js with TypeScript
-   **Styling**: TailwindCSS
-   **WebSockets**: Laravel Echo with Pusher
-   **HTTP Client**: Axios
-   **Icons**: Lucide React
-   **Build Tool**: Vite

## Getting Started

1. Install dependencies:

    ```bash
    npm install
    ```

2. Set up environment variables:

    ```bash
    cp .env.example .env
    ```

    Configure the following variables:

    - `VITE_API_BASE_URL`: Backend API URL
    - `VITE_PUSHER_APP_KEY`: Pusher app key
    - `VITE_PUSHER_HOST`: Pusher host
    - `VITE_PUSHER_PORT`: Pusher port
    - `VITE_PUSHER_SCHEME`: Pusher scheme (ws/wss)
    - `VITE_PUSHER_CLUSTER`: Pusher cluster

3. Start the development server:

    ```bash
    npm run dev
    ```

4. Build for production:
    ```bash
    npm run build
    ```

## Usage

1. Navigate to the application URL
2. Click "Agent Login" to sign in with your agent credentials
3. Once authenticated, you'll see the agent console dashboard
4. Manage incoming chats, respond to customers, and update your status as needed

## API Integration

This application integrates with a Laravel backend API and requires the following endpoints:

-   Authentication: `/api/auth/login`, `/api/auth/logout`, `/api/auth/user`
-   Chat Management: `/api/agent/chats`, `/api/chats/{id}/messages`
-   File Upload: `/api/files/upload`
-   Typing Status: `/api/typing`
-   Agent Status: `/api/agent/status`

## WebSocket Events

The application listens for the following WebSocket events:

-   `MessageSent`: New messages in chat
-   `UserTyping`: Typing indicators
-   `AgentJoined`: Agent joins a chat
-   `AgentLeft`: Agent leaves a chat
-   `ChatCreated`: New chat created
-   `ChatUpdated`: Chat status updates
