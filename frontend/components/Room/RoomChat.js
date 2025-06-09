import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function RoomChat({ messages = [], onSendMessage, currentUser }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() && onSendMessage) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="text-lg font-medium text-gray-900">Room Chat</h3>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.user?.id === currentUser?.id;
            const showAvatar = index === 0 || messages[index - 1]?.user?.id !== message.user?.id;

            return (
              <div
                key={index}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  {showAvatar && (
                    <img
                      className={`h-8 w-8 rounded-full ${isOwnMessage ? 'ml-2' : 'mr-2'}`}
                      src={
                        message.user?.profile?.avatar ||
                        `https://ui-avatars.com/api/?name=${message.user?.username}&background=6366f1&color=ffffff`
                      }
                      alt={message.user?.username}
                    />
                  )}
                  
                  {/* Message Content */}
                  <div className={`${showAvatar ? '' : isOwnMessage ? 'mr-10' : 'ml-10'}`}>
                    {/* Username and Time */}
                    {showAvatar && (
                      <div className={`flex items-center mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs font-medium text-gray-700">
                          {message.user?.username}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isOwnMessage
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      } ${message.type === 'system' ? 'bg-yellow-100 text-yellow-800 text-center italic' : ''}`}
                    >
                      {message.type === 'code' ? (
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {message.message}
                        </pre>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-w-0 rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}