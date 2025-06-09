// hooks/useSocket.js

import { useEffect, useRef, useState } from 'react';
import socketManager from '../lib/socket';
import { getLanguageConfig } from '../components/Editor/CodeEditor';

function getDefaultSnippet(lang) {
  return getLanguageConfig(lang).defaultValue;
}

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = socketManager.connect();

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        socketRef.current.on('connect', handleConnect);
        socketRef.current.on('disconnect', handleDisconnect);

        // Set initial connection state
        setIsConnected(socketRef.current.connected);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('connect', handleConnect);
                socketRef.current.off('disconnect', handleDisconnect);
            }
        };
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
    };
};

export const useRoom = (roomId, userId) => {
    const { socket, isConnected } = useSocket();
    const [roomData, setRoomData] = useState(null);
    const [activeUsers, setActiveUsers] = useState([]);
    const [sharedCode, setSharedCode] = useState({ content: '', language: 'javascript' });
    const [chatMessages, setChatMessages] = useState([]);

    useEffect(() => {
        if (!socket || !isConnected || !roomId || !userId) return;

        // Join room
        socket.emit('join-room', { roomId, userId });

        // Listen for room events
        const handleRoomJoined = (data) => {
              setRoomData(data.room);
            //   setSharedCode(data.sharedCode || { content: '', language: 'javascript' });
            const { sharedCode: incoming } = data;
            // if there's no existing content, seed with a snippet
            const contentToUse = incoming.content || getDefaultSnippet(incoming.language);
            setSharedCode({ content: contentToUse, language: incoming.language });
        };

        const handleUserJoined = (data) => {
            console.log('User joined:', data.user);
        };

        const handleUserLeft = (data) => {
            console.log('User left:', data.user);
        };

        const handleActiveUsers = (users) => {
            setActiveUsers(users);
        };

        const handleCodeUpdate = (data) => {
            setSharedCode({
                content: data.code,
                language: data.language,
            });
        };

        const handleChatMessage = (data) => {
            setChatMessages(prev => [...prev, data]);
        };

        const handleError = (error) => {
            console.error('Socket error:', error);
        };

        // Register event listeners
        socket.on('room-joined', handleRoomJoined);
        socket.on('user-joined', handleUserJoined);
        socket.on('user-left', handleUserLeft);
        socket.on('active-users', handleActiveUsers);
        socket.on('code-update', handleCodeUpdate);
        socket.on('chat-message', handleChatMessage);
        socket.on('error', handleError);

        // Cleanup
        return () => {
            socket.off('room-joined', handleRoomJoined);
            socket.off('user-joined', handleUserJoined);
            socket.off('user-left', handleUserLeft);
            socket.off('active-users', handleActiveUsers);
            socket.off('code-update', handleCodeUpdate);
            socket.off('chat-message', handleChatMessage);
            socket.off('error', handleError);

            // Leave room
            socket.emit('leave-room', { roomId });
        };
    }, [socket, isConnected, roomId, userId]);

    const updateCode = (code, language, cursorPosition = null) => {
        if (socket && isConnected) {
            socket.emit('code-change', {
                roomId,
                code,
                language,
                cursorPosition,
            });
            setSharedCode({ content: code, language });
        }
    };

    const sendChatMessage = (message, type = 'text') => {
        if (socket && isConnected) {
            socket.emit('chat-message', {
                roomId,
                message,
                type,
            });
        }
    };

    const updateCursor = (cursorPosition) => {
        if (socket && isConnected) {
            socket.emit('cursor-change', {
                roomId,
                cursorPosition,
            });
        }
    };

    return {
        roomData,
        activeUsers,
        sharedCode,
        setSharedCode,
        chatMessages,
        updateCode,
        sendChatMessage,
        updateCursor,
        isConnected,
    };
};