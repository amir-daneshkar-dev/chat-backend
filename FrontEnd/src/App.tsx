import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, Settings, Monitor, Eye } from 'lucide-react';
import ChatWidget from './components/ChatWidget/ChatWidget';
import AgentConsole from './components/AgentConsole/AgentConsole';
import authService from './services/auth';
import apiService from './services/api';

function App() {
  const [view, setView] = useState<'demo' | 'agent' | 'widget'>('demo');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginType, setLoginType] = useState<'agent' | 'user'>('agent');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const handleAuthLogin = (userType: 'agent' | 'user') => {
    if (isDemoMode) {
      // In demo mode, show login modal with pre-filled credentials
      setLoginType(userType);
      setLoginForm({
        email:
          userType === 'agent'
            ? import.meta.env.VITE_DEMO_AGENT_EMAIL || 'agent@demo.com'
            : import.meta.env.VITE_DEMO_USER_EMAIL || 'user@demo.com',
        password:
          userType === 'agent'
            ? import.meta.env.VITE_DEMO_AGENT_PASSWORD || 'agent123'
            : import.meta.env.VITE_DEMO_USER_PASSWORD || 'user123',
      });
      setShowLoginModal(true);
    } else {
      // In non-demo mode, show login modal for real authentication
      setLoginType(userType);
      setLoginForm({ email: '', password: '' });
      setShowLoginModal(true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const result = await apiService.login(loginForm);

      authService.setUser(result.user);
      localStorage.setItem('auth_token', result.token);
      setIsAuthenticated(true);
      setShowLoginModal(false);
      setView(loginType === 'agent' ? 'agent' : 'widget');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setView('demo');
  };

  if (view === 'agent' && isAuthenticated) {
    return <AgentConsole />;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className='bg-yellow-100 border-b border-yellow-200 px-4 py-2'>
          <div className='max-w-7xl mx-auto flex items-center justify-center space-x-2'>
            <Eye className='h-4 w-4 text-yellow-600' />
            <span className='text-sm font-medium text-yellow-800'>
              Demo Mode Active - Using dummy data and simulated responses
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
                <MessageCircle className='h-5 w-5 text-white' />
              </div>
              <span className='text-xl font-bold text-gray-900'>
                SupportChat
              </span>
              {isDemoMode && (
                <span className='px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full'>
                  DEMO
                </span>
              )}
            </div>

            <div className='flex items-center space-x-4'>
              <button
                onClick={() => setView('demo')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  view === 'demo'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Demo
              </button>

              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className='px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
                >
                  Logout
                </button>
              ) : (
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={() => handleAuthLogin('agent')}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                  >
                    Agent Login
                  </button>
                  <button
                    onClick={() => handleAuthLogin('user')}
                    className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    User Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            Complete Support Chat System
          </h1>
          <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
            A fully-featured React.js chat system with real-time messaging, file
            uploads, voice messages, and Laravel backend integration using
            Reverb WebSockets.
          </p>
          {isDemoMode && (
            <div className='mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
              <h3 className='text-lg font-semibold text-blue-900 mb-2'>
                Demo Credentials
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                <div className='bg-white p-3 rounded border'>
                  <strong className='text-blue-800'>Agent Login:</strong>
                  <br />
                  Email:{' '}
                  {import.meta.env.VITE_DEMO_AGENT_EMAIL || 'agent@demo.com'}
                  <br />
                  Password:{' '}
                  {import.meta.env.VITE_DEMO_AGENT_PASSWORD || 'agent123'}
                </div>
                <div className='bg-white p-3 rounded border'>
                  <strong className='text-blue-800'>User Login:</strong>
                  <br />
                  Email:{' '}
                  {import.meta.env.VITE_DEMO_USER_EMAIL || 'user@demo.com'}
                  <br />
                  Password:{' '}
                  {import.meta.env.VITE_DEMO_USER_PASSWORD || 'user123'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12'>
          <div className='bg-white rounded-xl shadow-sm p-6 border'>
            <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
              <MessageCircle className='h-6 w-6 text-blue-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Real-time Messaging
            </h3>
            <p className='text-gray-600'>
              Instant messaging with typing indicators, read receipts, and
              WebSocket connections.
            </p>
          </div>

          <div className='bg-white rounded-xl shadow-sm p-6 border'>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4'>
              <Users className='h-6 w-6 text-green-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Agent Console
            </h3>
            <p className='text-gray-600'>
              Complete agent dashboard with chat management, user info, and
              queue handling.
            </p>
          </div>

          <div className='bg-white rounded-xl shadow-sm p-6 border'>
            <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4'>
              <Settings className='h-6 w-6 text-purple-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Rich Media Support
            </h3>
            <p className='text-gray-600'>
              File uploads, image sharing, voice messages, and clipboard paste
              support.
            </p>
          </div>
        </div>

        {/* Demo Section */}
        <div className='bg-white rounded-xl shadow-sm p-8 border'>
          <div className='text-center mb-8'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              Try the Demo
            </h2>
            <p className='text-gray-600'>
              Experience the chat system from both customer and agent
              perspectives. The chat widget will appear in the bottom-right
              corner.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Customer Features
              </h3>
              <ul className='space-y-2 text-gray-600'>
                <li className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-blue-600 rounded-full'></div>
                  <span>Send and receive messages</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-blue-600 rounded-full'></div>
                  <span>Upload files and images</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-blue-600 rounded-full'></div>
                  <span>Record voice messages</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-blue-600 rounded-full'></div>
                  <span>Paste screenshots from clipboard</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-blue-600 rounded-full'></div>
                  <span>See queue position and agent status</span>
                </li>
              </ul>
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Agent Features
              </h3>
              <ul className='space-y-2 text-gray-600'>
                <li className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-green-600 rounded-full'></div>
                  <span>Manage multiple chat sessions</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-green-600 rounded-full'></div>
                  <span>View customer information</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-green-600 rounded-full'></div>
                  <span>Quick response templates</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-green-600 rounded-full'></div>
                  <span>File sharing and voice messages</span>
                </li>
                <li className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-green-600 rounded-full'></div>
                  <span>Real-time typing indicators</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className='mt-12 bg-gray-50 rounded-xl p-8'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            Technical Implementation
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Frontend Stack
              </h3>
              <ul className='space-y-2 text-gray-600'>
                <li>• React.js with TypeScript</li>
                <li>• TailwindCSS for styling</li>
                <li>• Laravel Echo for WebSockets</li>
                <li>• Axios for API communication</li>
                <li>• React Hooks for state management</li>
                <li>• Lucide React for icons</li>
              </ul>
            </div>

            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Backend Integration
              </h3>
              <ul className='space-y-2 text-gray-600'>
                <li>• Laravel Reverb WebSocket server</li>
                <li>• Pusher-compatible protocol</li>
                <li>• RESTful API endpoints</li>
                <li>• File upload handling</li>
                <li>• Authentication system</li>
                <li>• Environment-based configuration</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h2 className='text-xl font-bold text-gray-900 mb-4'>
              {loginType === 'agent' ? 'Agent' : 'User'} Login
            </h2>

            {isDemoMode && (
              <div className='mb-4 p-3 bg-blue-50 rounded border border-blue-200'>
                <p className='text-sm text-blue-800'>
                  Demo credentials are pre-filled. Click "Login" to continue.
                </p>
              </div>
            )}

            <form onSubmit={handleLogin} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Email
                </label>
                <input
                  type='email'
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Password
                </label>
                <input
                  type='password'
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  required
                />
              </div>

              {loginError && (
                <div className='text-red-600 text-sm'>{loginError}</div>
              )}

              <div className='flex space-x-3'>
                <button
                  type='submit'
                  disabled={isLoggingIn}
                  className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors'
                >
                  {isLoggingIn ? 'Logging in...' : 'Login'}
                </button>
                <button
                  type='button'
                  onClick={() => setShowLoginModal(false)}
                  className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Widget */}
      <ChatWidget position='bottom-right' />
    </div>
  );
}

export default App;
