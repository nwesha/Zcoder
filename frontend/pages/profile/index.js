// pages/profile/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/axios';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import {
    CodeBracketIcon,
    BookmarkIcon,
    UserGroupIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import ActivityFeed from '../../components/Profile/ActivityFeed';
import UserStats from '../../components/Profile/UserStats';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();
    const [profile, setProfile] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [stats, setStats] = useState({
        totalProblems: 0,
        totalBookmarks: 0,
        totalRooms: 0,
        totalCollaborations: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        bio: '',
        github: '',
        linkedin: '',
        website: '',
    });

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchProfileData();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (profile) {
            setEditForm({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                bio: profile.bio || '',
                github: profile.github || '',
                linkedin: profile.linkedin || '',
                website: profile.website || '',
            });
        }
    }, [profile]);

    const fetchProfileData = async () => {
        try {
            const [
                profileRes,
                activityRes,
                statsRes,
                solvedRes,
                roomsRes,
                bookmarksRes
            ] = await Promise.all([
                api.get('/users/profile'),
                api.get('/users/activity'),
                api.get('/users/stats'),
                api.get('/users/solved'),
                api.get('/users/rooms'),
                api.get('/bookmarks')
            ]);

            setProfile({
                ...profileRes.data.data.profile,
                solvedProblems: solvedRes.data.data.solvedProblems,
                bookmarkedProblems: bookmarksRes.data.data.bookmarks.map(b => b.problem),
                recentRooms: roomsRes.data.data.recentRooms
            });
            setRecentActivity(activityRes.data.data.activities);
            setStats(statsRes.data.data.stats);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.patch('/users/profile', editForm);
            setProfile(response.data.data.profile);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const cancelEdit = () => {
        setEditForm({
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            bio: profile.bio || '',
            github: profile.github || '',
            linkedin: profile.linkedin || '',
            website: profile.website || '',
        });
        setIsEditing(false);
    };

    if (loading || !isAuthenticated || isLoading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header */}
                <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="sm:flex sm:items-center sm:justify-between">
                            <div className="sm:flex sm:items-center">
                                <div className="relative">
                                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-gray-500 text-2xl font-semibold">
                                        {profile?.firstName?.charAt(0) || user?.username?.charAt(0)}
                                    </div>
                                </div>
                                <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                                    <div className="flex items-center">
                                        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                                            {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}` : user?.username}
                                        </h1>
                                        {!isEditing && (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                <PencilIcon className="h-3.5 w-3.5 mr-1" />
                                                Edit Profile
                                            </button>
                                        )}
                                    </div>
                                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                        @{user?.username} · Joined {new Date(user?.createdAt).toLocaleDateString()}
                                    </p>
                                    {!isEditing && profile?.bio && (
                                        <p className="mt-3 max-w-2xl text-sm text-gray-700">
                                            {profile.bio}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Stats Summary */}
                            <div className="mt-5 sm:mt-0">
                                <UserStats stats={stats} />
                            </div>

                        </div>

                        {/* Edit Form */}
                        {isEditing && (
                            <form onSubmit={handleSubmit} className="mt-6 border-t border-gray-200 pt-6">
                                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                    <div className="sm:col-span-3">
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                            First name
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            id="firstName"
                                            value={editForm.firstName}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                            Last name
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            id="lastName"
                                            value={editForm.lastName}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-6">
                                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                                            Bio
                                        </label>
                                        <textarea
                                            id="bio"
                                            name="bio"
                                            rows={3}
                                            value={editForm.bio}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div className="sm:col-span-6">
                                        <label htmlFor="github" className="block text-sm font-medium text-gray-700">
                                            GitHub
                                        </label>
                                        <div className="mt-1 flex rounded-md shadow-sm">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                                github.com/
                                            </span>
                                            <input
                                                type="text"
                                                name="github"
                                                id="github"
                                                value={editForm.github}
                                                onChange={handleInputChange}
                                                className="flex-1 block w-full border border-gray-300 rounded-none rounded-r-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-6">
                                        <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
                                            LinkedIn
                                        </label>
                                        <div className="mt-1 flex rounded-md shadow-sm">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                                linkedin.com/in/
                                            </span>
                                            <input
                                                type="text"
                                                name="linkedin"
                                                id="linkedin"
                                                value={editForm.linkedin}
                                                onChange={handleInputChange}
                                                className="flex-1 block w-full border border-gray-300 rounded-none rounded-r-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-6">
                                        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                                            Personal website
                                        </label>
                                        <input
                                            type="url"
                                            name="website"
                                            id="website"
                                            value={editForm.website}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <XMarkIcon className="h-4 w-4 inline mr-1" />
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <CheckIcon className="h-4 w-4 inline mr-1" />
                                        Save
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recent Activity */}
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Recent Activity
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:px-6">
                                <ActivityFeed activities={recentActivity} />
                            </div>
                        </div>


                        {/* Solved Problems */}
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Solved Problems
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:px-6">
                                {profile.solvedProblems?.length > 0 ? (
                                    profile.solvedProblems.map((p) => (
                                        <div key={p._id} className="border-l-4 border-indigo-500 pl-4 py-2">
                                            <Link href={`/problems/${p._id}`} className="text-base font-medium text-gray-900 hover:text-indigo-600">
                                                    {p.title}
                                            </Link>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {p.difficulty} · {p.category}
                                            </p>
                                            <div className="flex items-center mt-2 space-x-2">
                                                {p.tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No problems solved yet.</p>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Social Links */}
                        {!isEditing && (profile?.github || profile?.linkedin || profile?.website) && (
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Connect
                                    </h3>
                                </div>
                                <div className="px-4 py-5 sm:px-6 space-y-3">
                                    {profile?.github && (
                                        <a
                                            href={`https://github.com/${profile.github}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-gray-700 hover:text-indigo-600"
                                        >
                                            <span className="text-lg mr-2">
                                                <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
                                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                            GitHub
                                        </a>
                                    )}
                                    {profile?.linkedin && (
                                        <a
                                            href={`https://linkedin.com/in/${profile.linkedin}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-gray-700 hover:text-indigo-600"
                                        >
                                            <span className="text-lg mr-2">
                                                <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
                                                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                                                </svg>
                                            </span>
                                            LinkedIn
                                        </a>
                                    )}
                                    {profile?.website && (
                                        <a
                                            href={profile.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-gray-700 hover:text-indigo-600"
                                        >
                                            <span className="text-lg mr-2">
                                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                </svg>
                                            </span>
                                            Website
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bookmarked Problems */}
                        {/* Bookmarked Problems */}
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Bookmarked Problems
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:px-6">
                                {profile.bookmarkedProblems?.length > 0 ? (
                                    profile.bookmarkedProblems.map((p) => (
                                        <div key={p._id} className="flex items-start space-x-3">
                                            <BookmarkIcon className="h-5 w-5 text-indigo-600 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <Link href={`/problems/${p._id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                                                        {p.title}
                                                </Link>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {p.tags.slice(0, 2).map(tag => `#${tag}`).join(' ')}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No bookmarks yet.</p>
                                )}
                            </div>
                        </div>


                        {/* Recent Rooms */}
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Recent Rooms
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:px-6">
                                {profile.recentRooms?.length > 0 ? (
                                    profile.recentRooms.map((r) => (
                                        <div key={r._id} className="flex items-start space-x-3">
                                            <UserGroupIcon className="h-5 w-5 text-indigo-600 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <Link href={`/room/${r._id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                                                        {r.name}
                                                </Link>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(r.lastActive || r.createdAt).toLocaleDateString()}
                                                    {r.isActive && ' · Active Now'}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No recent rooms.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
}
