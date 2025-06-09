// pages/dashboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../lib/axios';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import CodeEditor from '../components/Editor/CodeEditor';

import {
    CodeBracketIcon,
    UserGroupIcon,
    ArrowRightIcon,
    UserIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    
    const [recentProblems, setRecentProblems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [quickCode, setQuickCode] = useState('// Start typing...');
    const [quickLang, setQuickLang] = useState('javascript');

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                

                // Fetch recent problems
                const problemsResponse = await api.get('/problems?limit=5');
                setRecentProblems(problemsResponse.data.data.problems || []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated && user?.id) {
            fetchData();
        }
    }, [isAuthenticated, user?.id]);

    if (loading || !isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Welcome section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome, {user?.profile?.firstName || user?.username}!
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Continue your coding journey with ZCoder.
                    </p>
                </div>

                {/* Main content grid */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    

                    {/* Quick Code Editor Panel */}
                    <div className="bg-white shadow rounded-lg mt-8">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Quick Code Editor</h2>
                            <p className="text-sm text-gray-500">Try out code instantly (not collaborative)</p>
                        </div>
                        <div className="p-6">
                            <CodeEditor
                                value={quickCode}
                                language={quickLang}
                                onChange={(val) => setQuickCode(val)}
                                height="200px"
                                enableRun={true}
                            />
                            <select
                                value={quickLang}
                                onChange={e => setQuickLang(e.target.value)}
                                className="mt-2 border rounded px-2 py-1 text-sm"
                            >
                                {['javascript', 'python', 'java', 'cpp', 'html', 'css'].map(lang => (
                                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Recent Problems */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-medium text-gray-900">Recent Problems</h2>
                                <Link
                                    href="/problems"
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    View all
                                </Link>
                            </div>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {isLoading ? (
                                <li className="px-6 py-4 text-center text-gray-500">Loading...</li>
                            ) : recentProblems.length === 0 ? (
                                <li className="px-6 py-4 text-center text-gray-500">No problems found</li>
                            ) : (
                                recentProblems.map((problem) => (
                                    <li key={problem._id} className="px-6 py-4">
                                        <Link href={`/problems/${problem._id}`} className="group">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                                                        {problem.title}
                                                    </h3>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)} · {problem.category}
                                                    </p>
                                                </div>
                                                <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                                            </div>
                                        </Link>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>

                    {/* Quick Access */}
                    <div className="bg-white shadow rounded-lg lg:col-span-2">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Quick Access</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 p-6">
                            <Link
                                href="/problems"
                                className="bg-gray-50 hover:bg-gray-100 px-6 py-8 rounded-lg text-center border border-gray-200"
                            >
                                <CodeBracketIcon className="h-8 w-8 text-indigo-600 mx-auto" />
                                <h3 className="mt-3 text-base font-medium text-gray-900">Practice Problems</h3>
                                <p className="mt-1 text-sm text-gray-500">Solve coding challenges</p>
                            </Link>


                            <Link
                                href="/rooms"
                                className="bg-gray-50 hover:bg-gray-100 px-6 py-8 rounded-lg text-center border border-gray-200"
                            >
                                <UserGroupIcon className="h-8 w-8 text-indigo-600 mx-auto" />
                                <h3 className="mt-3 text-base font-medium text-gray-900">Join a Room</h3>
                                <p className="mt-1 text-sm text-gray-500">Collaborate with others</p>
                            </Link>

                            <Link
                                href="/profile"
                                className="bg-gray-50 hover:bg-gray-100 px-6 py-8 rounded-lg text-center border border-gray-200"
                            >
                                <UserIcon className="h-8 w-8 text-indigo-600 mx-auto" />
                                <h3 className="mt-3 text-base font-medium text-gray-900">My Profile</h3>
                                <p className="mt-1 text-sm text-gray-500">Manage your account</p>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}