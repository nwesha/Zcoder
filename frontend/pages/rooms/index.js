//pages/rooms/index.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout/Layout';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';

import {
    UserGroupIcon,
    LockClosedIcon,
    PlusIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function RoomsList() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [joined, setJoined] = useState([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomDescription, setNewRoomDescription] = useState('');
    const [newRoomType, setNewRoomType] = useState('open-discussion');
    const [isPrivate, setIsPrivate] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [invite, setInvite] = useState('');

    const handleInviteJoin = async () => {
        if (!invite.trim()) return;
        // extract ID if full URL
        const parts = invite.trim().split('/');
        const roomId = parts[parts.length - 1];
        try {
            await api.post(`/rooms/${roomId}/join`, {});
            router.push(`/rooms/${roomId}`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to join');
        }
    };

    // Fetch all active rooms
    useEffect(() => {
        fetchRooms();
    }, [searchTerm]);

    const fetchRooms = async () => {
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;

            const res = await api.get('/rooms', { params });
            const list = res.data.data?.rooms || res.data.rooms || [];
            setRooms(list);
        } catch (err) {
            console.error(err);
            setError('Failed to load rooms.');
        } finally {
            setLoading(false);
        }
    };

    // Create room handler - FIXED
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        if (!newRoomName.trim()) return;

        setCreating(true);
        setError('');

        try {
            const res = await api.post('/rooms', {
                name: newRoomName.trim(),
                description: newRoomDescription.trim(),
                type: newRoomType,
                isPrivate: isPrivate,
                password: isPrivate ? password : undefined,
                maxParticipants: 10,
            });

            const room = res.data.data?.room || res.data.room;

            // Reset form
            setNewRoomName('');
            setNewRoomDescription('');
            setPassword('');
            setShowCreateForm(false);

            // Redirect to the new room - THIS WAS MISSING
            router.push(`/rooms/${room._id}`);

        } catch (err) {
            console.error('Create room error:', err.response?.data);
            setError(
                err.response?.data.errors?.map(e => e.msg).join(', ') ||
                err.response?.data.message ||
                'Failed to create room'
            );
        } finally {
            setCreating(false);
        }
    };

    // Join room handler - ENHANCED
    const handleJoin = async (room) => {
        try {
            let payload = {};

            if (room.isPrivate) {
                const pw = window.prompt('Enter room password:');
                if (pw === null) return; // user cancelled
                payload.password = pw;
            }

            await api.post(`/rooms/${room._id}/join`, payload);
            router.push(`/rooms/${room._id}`);

        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message;

            // owner or prior‐join case → do nothing
            if (status === 400 && msg === 'Already in room') {
                console.info('🛈 Already in room, entering...');
                router.push(`/rooms/${room._id}`);
                return;
            }
             if (status === 401 || status === 403) {
      alert('Access denied. Maybe wrong password?');
    } else if (status === 400) {
      alert(msg || 'Room is full or cannot join.');
    } else {
      alert('Failed to join room. Please try again.');
    }
  }
        };

        useEffect(() => {
            api.get('/rooms/user/rooms').then(res => {
                setJoined(res.data.data.rooms);
            });
        }, []);

        const forgetRoom = async (roomId) => {
            if (!confirm('Forget this room?')) return;
            await api.post(`/rooms/${roomId}/leave`);
            setJoined(j => j.filter(r => r._id !== roomId));
        };

        return (
            <Layout>
                <div className="max-w-4xl mx-auto py-8 space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900">Coding Rooms</h1>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Create Room
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search rooms..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                            {error}
                        </div>
                    )}

                    <div>
                        <h2>Your Joined Rooms</h2>
                        {joined.map(r => (
                            <div key={r._id} className="flex justify-between">
                                <span>{r.name}</span>
                                <button
                                    onClick={() => forgetRoom(r._id)}
                                    className="text-red-600 hover:underline"
                                >
                                    Forget
                                </button>
                            </div>
                        ))}
                        {/* … the rest of your Create/Search UI … */}
                    </div>
                    {/* Paste‑to‑Join */}
                    <div className="bg-white p-4 rounded shadow-sm">
                        <h3 className="font-medium mb-2">Join by Link or ID</h3>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={invite}
                                onChange={e => setInvite(e.target.value)}
                                placeholder="https://…/rooms/ROOM_ID or ROOM_ID"
                                className="flex-1 px-3 py-2 border rounded-md"
                            />
                            <button
                                onClick={handleInviteJoin}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                Join
                            </button>
                        </div>
                    </div>
                    {/* Create Room Form */}
                    {showCreateForm && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4">Create New Room</h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Room Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newRoomName}
                                        onChange={(e) => setNewRoomName(e.target.value)}
                                        placeholder="Enter room name..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={newRoomDescription}
                                        onChange={(e) => setNewRoomDescription(e.target.value)}
                                        placeholder="Room description (optional)..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        rows="3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Room Type
                                    </label>
                                    <select
                                        value={newRoomType}
                                        onChange={(e) => setNewRoomType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="open-discussion">Open Discussion</option>
                                        <option value="study-group">Study Group</option>
                                        <option value="interview-prep">Interview Prep</option>
                                        <option value="project-collaboration">Project Collaboration</option>
                                    </select>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isPrivate"
                                        checked={isPrivate}
                                        onChange={(e) => setIsPrivate(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-900">
                                        Private Room (require password)
                                    </label>
                                </div>

                                {isPrivate && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter room password..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required={isPrivate}
                                        />
                                    </div>
                                )}

                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {creating ? 'Creating...' : 'Create Room'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateForm(false)}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Rooms List */}
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-2 text-gray-500">Loading rooms...</p>
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="text-center py-12">
                            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto" />
                            <p className="mt-2 text-lg text-gray-500">
                                {searchTerm ? 'No rooms found matching your search.' : 'No active rooms. Create one to get started!'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {rooms.map((room) => (
                                <div
                                    key={room._id}
                                    className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                                {room.name}
                                                {room.isPrivate && (
                                                    <LockClosedIcon className="h-4 w-4 text-gray-500 ml-2" />
                                                )}
                                            </h3>
                                            {room.description && (
                                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                                    {room.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                                            <div className="flex items-center">
                                                <UserGroupIcon className="h-4 w-4 mr-1" />
                                                <span>
                                                    {room.participants?.length || 0}/{room.maxParticipants || 10}
                                                </span>
                                            </div>
                                            <span className="capitalize text-xs bg-gray-100 px-2 py-1 rounded">
                                                {room.type?.replace('-', ' ')}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleJoin(room)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                                        >
                                            Join
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Layout>
        );
    }
