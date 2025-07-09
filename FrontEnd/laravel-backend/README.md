# Laravel Support Chat Backend

A complete Laravel backend for the React support chat system with real-time WebSocket communication using Laravel Reverb.

## Features

- **Real-time messaging** with Laravel Reverb WebSocket
- **User authentication** with Laravel Sanctum
- **File upload support** for images, documents, and voice messages
- **Agent management** with status tracking and chat assignment
- **Queue system** for managing waiting customers
- **Typing indicators** with automatic cleanup
- **Message read receipts**
- **RESTful API** for all chat operations

## Installation

1. **Clone and setup**:
```bash
cd laravel-backend
composer install
cp .env.example .env
php artisan key:generate
```

2. **Database setup**:
```bash
# Configure your database in .env
php artisan migrate
php artisan db:seed
```

3. **Storage setup**:
```bash
php artisan storage:link
```

4. **Install and start Reverb**:
```bash
php artisan reverb:install
php artisan reverb:start
```

5. **Start the application**:
```bash
php artisan serve
```

## Environment Configuration

Update your `.env` file with the following settings:

```env
# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=support_chat
DB_USERNAME=root
DB_PASSWORD=

# Broadcasting (Reverb)
BROADCAST_DRIVER=reverb
REVERB_APP_ID=local
REVERB_APP_KEY=local
REVERB_APP_SECRET=local
REVERB_HOST=127.0.0.1
REVERB_PORT=6001
REVERB_SCHEME=http

# File Upload Settings
MAX_FILE_SIZE=10240
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,txt

# Chat Settings
MAX_VOICE_DURATION=60
CHAT_QUEUE_TIMEOUT=300
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user/agent
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/user` - Get authenticated user

### Chats
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/{chatId}` - Get specific chat
- `PUT /api/chats/{chatId}` - Update chat
- `DELETE /api/chats/{chatId}` - Delete chat

### Messages
- `GET /api/chats/{chatId}/messages` - Get chat messages
- `POST /api/chats/{chatId}/messages` - Send message
- `PUT /api/messages/{messageId}/read` - Mark message as read

### Files
- `POST /api/files/upload` - Upload file
- `DELETE /api/files` - Delete file
- `GET /api/files/{filename}/info` - Get file info

### Agent Operations
- `GET /api/agent/chats` - Get agent's chats
- `POST /api/agent/chats/{chatId}/assign` - Assign chat to agent
- `POST /api/agent/chats/{chatId}/close` - Close chat
- `PUT /api/agent/status` - Update agent status
- `GET /api/agent/stats` - Get agent statistics

### Typing Indicators
- `POST /api/chats/{chatId}/typing` - Update typing status
- `GET /api/chats/{chatId}/typing` - Get typing statuses

## WebSocket Events

### Chat Events
- `NewChatAssigned` - New chat created (to agents)
- `ChatUpdated` - Chat status/details updated
- `MessageSent` - New message sent
- `UserTyping` - User typing status
- `AgentJoined` - Agent joined chat

### Channels
- `chat.{chatId}` - Private channel for specific chat
- `agent.dashboard` - Private channel for agent notifications

## Demo Credentials

The seeder creates the following demo accounts:

**Agent Account:**
- Email: `agent@demo.com`
- Password: `agent123`

**User Account:**
- Email: `user@demo.com`
- Password: `user123`

**Admin Account:**
- Email: `admin@demo.com`
- Password: `admin123`

## Models

### User
- Basic user information and authentication
- Roles: `user`, `agent`, `admin`
- Online status tracking

### Agent
- Extended profile for agent users
- Status management (`available`, `busy`, `offline`)
- Chat capacity limits

### Chat
- Chat sessions between users and agents
- Status tracking (`waiting`, `active`, `closed`)
- Queue position management

### Message
- Individual messages within chats
- Support for text, files, images, voice, system messages
- Read receipt tracking

### TypingStatus
- Real-time typing indicators
- Automatic expiration

## Services

### ChatService
- Chat creation and management
- Agent assignment logic
- Queue position updates
- Auto-assignment of waiting chats

### MessageService
- Message creation and management
- Read receipt handling
- Message pagination

## File Upload

Supports the following file types:
- Images: jpg, jpeg, png, gif
- Documents: pdf, doc, docx, txt
- Voice messages: webm, mp3, wav

Files are stored in `storage/app/public/chat-files/` organized by chat ID.

## Queue Management

The system automatically manages a queue for waiting customers:
1. New chats are assigned queue positions
2. Available agents are automatically assigned to waiting chats
3. Queue positions are updated when chats are assigned or closed

## Real-time Features

Using Laravel Reverb for WebSocket communication:
- Instant message delivery
- Typing indicators
- Agent status updates
- Chat assignment notifications
- Real-time queue updates

## Security

- API authentication with Laravel Sanctum
- Role-based access control
- File upload validation
- Private WebSocket channels
- CORS configuration for frontend integration

## Development

### Running Tests
```bash
php artisan test
```

### Code Style
```bash
./vendor/bin/pint
```

### Queue Workers (if using queues)
```bash
php artisan queue:work
```

### Reverb Server
```bash
php artisan reverb:start --debug
```

## Production Deployment

1. Set `APP_ENV=production` in `.env`
2. Configure proper database credentials
3. Set up SSL for WebSocket connections
4. Configure file storage (S3, etc.)
5. Set up queue workers for background jobs
6. Configure proper CORS settings

## Frontend Integration

This backend is designed to work with the React frontend. Update the frontend's `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_PUSHER_APP_KEY=local
VITE_PUSHER_HOST=127.0.0.1
VITE_PUSHER_PORT=6001
VITE_PUSHER_SCHEME=http
```

## Troubleshooting

### WebSocket Connection Issues
- Ensure Reverb server is running: `php artisan reverb:start`
- Check firewall settings for port 6001
- Verify CORS configuration

### File Upload Issues
- Check storage permissions: `chmod -R 755 storage/`
- Verify `storage:link` was run
- Check file size limits in php.ini

### Database Issues
- Run migrations: `php artisan migrate:fresh --seed`
- Check database connection in `.env`
- Verify database user permissions