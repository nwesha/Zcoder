import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout/Layout';
import CodeEditor from '../../components/Editor/CodeEditor';
import RoomChat from '../../components/Room/RoomChat';
import { useRoom } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import {
  UserGroupIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon,
  ExclamationCircleIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  ClipboardIcon,
} from '@heroicons/react/24/outline';
import api from '../../lib/axios';

export default function RoomPage() {
  const router = useRouter();
  const { id: roomId } = router.query;
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  // Wait for Next router to hydrate
  if (!router.isReady) return null;

  // Local UI state
  const [restJoining, setRestJoining] = useState(true);
  const [joinError, setJoinError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('code');
  const [connectionError, setConnectionError] = useState(false);

  // Socket state & actions
  const {
    roomData,
    activeUsers,
    sharedCode,
    setSharedCode,
    chatMessages,
    updateCode,
    sendChatMessage,
    updateCursor,
    isConnected,
  } = useRoom(roomId, user?.id);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const doJoin = async () => {
      if (!isAuthenticated || !roomId) return;
      setRestJoining(true);
      setJoinError('');

      try {
        await api.post(`/rooms/${roomId}/join`, {});
      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.message;

        if (status === 401 || status === 403) {
          // private room → prompt password …
          
        } else if (status === 400) {
          if (msg === 'Already in room') {
            console.info('🛈 Already in room, continuing…');
            // **do not redirect**—we consider this success
          } else {
            alert(msg || 'Room is full or join failed');
            router.replace('/rooms');
            return;
          }
        } else if (status === 404) {
          alert('Room not found');
          router.replace('/rooms');
          return;
        } else {
          console.error('Join error:', err);
          alert('Failed to join room');
          router.replace('/rooms');
          return;
        }
      } finally {
        setRestJoining(false);
      }
    };

    doJoin();
  }, [isAuthenticated, roomId, router]);

  // Monitor connection status
  useEffect(() => {
    if (!restJoining && roomData !== undefined) {
      setPageLoading(false);
    }
  }, [restJoining, roomData]);

  // Handle connection errors
  useEffect(() => {
    if (!isConnected && !pageLoading && !restJoining) {
      setConnectionError(true);
    } else {
      setConnectionError(false);
    }
  }, [isConnected, pageLoading, restJoining]);

  // If REST join or socket says room not found, redirect
  useEffect(() => {
    if (!pageLoading && roomData === null) {
      router.replace('/rooms');
    }
  }, [pageLoading, roomData, router]);

  const handleCursorChange = useCallback((pos) => {
    updateCursor(pos);
  }, [updateCursor]);

  const handleCodeChange = useCallback((newCode, language) => {
    updateCode(newCode, language);
  }, [updateCode]);

  const handleLeaveRoom = () => {
    if (window.confirm('Are you sure you want to leave this room?')) {
      router.push('/rooms');
    }
  };

  // Loading state
  if (authLoading || pageLoading || restJoining) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">
              {authLoading ? 'Checking authentication...' :
                restJoining ? 'Joining room...' :
                  'Loading room...'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (!roomData) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Room not found</h2>
            <p className="text-gray-600 mb-4">The room you're looking for doesn't exist or you don't have access.</p>
            <button
              onClick={() => router.push('/rooms')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Rooms
            </button>
          </div>
        </div>
      </Layout>
    );
  }
  // Invite link
  const copyInviteLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link)
      .then(() => alert('Invite link copied to clipboard!'))
      .catch(() => alert('Failed to copy link'));
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="flex items-center justify-between bg-white border-b px-6 py-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/rooms')}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{roomData.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center">
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  <span>{activeUsers.length} active user{activeUsers.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center">
                  <span
                    className={`inline-block h-2 w-2 rounded-full mr-1 ${isConnected && !connectionError ? 'bg-green-500' : 'bg-red-500'
                      }`}
                  />
                  <span>{isConnected && !connectionError ? 'Connected' : 'Disconnected'}</span>
                </div>
                {roomData.type && (
                  <span className="capitalize text-xs bg-gray-100 px-2 py-1 rounded">
                    {roomData.type.replace('-', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language selector */}

            <select
              value={sharedCode.language}
              onChange={(e) => {
                const newLang = e.target.value;
                // 1) Optimistically update the UI
                setSharedCode(prev => ({ ...prev, language: newLang }));
                // 2) Notify everyone else
                updateCode(sharedCode.content, newLang);
              }}
              className="…"
            >
              {['javascript', 'python', 'java', 'cpp', 'html', 'css'].map(lang => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>

            {/* Invite button */}
            <button
              onClick={copyInviteLink}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              title="Copy invite link"
            >
              <ClipboardIcon className="h-5 w-5" />
            </button>

            <button
              onClick={handleLeaveRoom}
              className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
            >
              Leave Room
            </button>
          </div>
        </header>

        {/* Connection Error Banner */}
        {connectionError && (
          <div className="bg-red-100 border-b border-red-200 px-6 py-2">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">
                Connection lost. Attempting to reconnect...
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <nav className="bg-gray-50 border-b px-6">
          <ul className="flex space-x-8 text-sm">
            {[
              { key: 'code', label: 'Code Editor', icon: CodeBracketIcon },
              { key: 'problem', label: 'Problem', icon: ExclamationCircleIcon },
              { key: 'chat', label: 'Chat', icon: ChatBubbleLeftRightIcon },
              { key: 'users', label: 'Participants', icon: UserGroupIcon },
            ].map(tab => (
              <li key={tab.key}>
                <button
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-3 inline-flex items-center border-b-2 font-medium ${activeTab === tab.key
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
                    }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  {tab.key === 'chat' && chatMessages.length > 0 && (
                    <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs rounded-full px-2 py-1">
                      {chatMessages.length}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 relative">
            {activeTab === 'code' && (
              <div className="h-full">
                <CodeEditor
                  value={sharedCode.content}
                  language={sharedCode.language}
                  onChange={handleCodeChange}
                  onCursorActivity={handleCursorChange}
                  height="90%"
                  readOnly={!isConnected}
                  enableRun={true} 
                />
                {!isConnected && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-gray-700">Editor locked - reconnecting...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'problem' && (
              <div className="p-6 overflow-y-auto h-full prose max-w-none">
                {roomData.currentProblem ? (
                  <>
                    <h2 className="text-xl font-bold mb-4">{roomData.currentProblem.title}</h2>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <span className="text-sm font-medium text-gray-600">Difficulty: </span>
                      <span className={`text-sm font-bold ${roomData.currentProblem.difficulty === 'easy' ? 'text-green-600' :
                        roomData.currentProblem.difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {roomData.currentProblem.difficulty?.toUpperCase()}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-gray-700">
                      {roomData.currentProblem.description}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <ExclamationCircleIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No problem selected for this room</p>
                    <p className="text-sm text-gray-400 mt-2">Room owner can set a problem for collaborative solving</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="p-6 overflow-y-auto h-full">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">
                    Participants ({activeUsers.length})
                  </h3>

                  {activeUsers.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No active users</p>
                  ) : (
                    <div className="space-y-3">
                      {activeUsers.map((activeUser) => (
                        <div
                          key={activeUser.id}
                          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <img
                            src={
                              activeUser.profile?.avatar ||
                              `https://ui-avatars.com/api/?name=${activeUser.username}&background=6366f1&color=ffffff`
                            }
                            className="h-10 w-10 rounded-full"
                            alt={activeUser.username}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activeUser.username}</p>
                            <p className="text-sm text-gray-500">
                              {activeUser.id === user?.id ? 'You' : 'Participant'}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chat sidebar - only show when chat tab is active */}
          {activeTab === 'chat' && (
            <div className="w-80 border-l border-gray-200 bg-white">
              <RoomChat
                messages={chatMessages}
                onSendMessage={sendChatMessage}
                currentUser={user}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
