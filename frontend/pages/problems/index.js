import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/axios';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CodeBracketIcon,
  BookmarkIcon as BookmarkOutlineIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

export default function Problems() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    difficulty: '',
    category: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({});

  // Local maps for solved/bookmarked state per problem
  const [solvedMap, setSolvedMap] = useState({});
  const [bookmarkMap, setBookmarkMap] = useState({});

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    fetchProblems();
  }, [filters]);

  const fetchProblems = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await api.get(`/problems?${params}`);
      const data = response.data.data.problems;
      setProblems(data);
      setPagination(response.data.data.pagination);

      // initialize state maps
      const solvedInit = {};
      const bookmarkInit = {};
      await Promise.all(data.map(async problem => {
        const bm = await api.get(`/bookmarks/problem/${problem._id}`);
        if (bm.data.data.bookmark) {
          bookmarkInit[problem._id] = true;
          solvedInit[problem._id] = bm.data.data.bookmark.progress === 'completed';
        } else {
          bookmarkInit[problem._id] = false;
          solvedInit[problem._id] = false;
        }
      }));
      setBookmarkMap(bookmarkInit);
      setSolvedMap(solvedInit);
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const toggleBookmark = async (problemId) => {
    try {
      if (bookmarkMap[problemId]) {
        const bm = await api.get(`/bookmarks/problem/${problemId}`);
        await api.delete(`/bookmarks/${bm.data.data.bookmark._id}`);
        setBookmarkMap(prev => ({ ...prev, [problemId]: false }));
      } else {
        await api.post('/bookmarks', { problemId });
        setBookmarkMap(prev => ({ ...prev, [problemId]: true }));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const toggleSolved = async (problemId) => {
    try {
      if (!bookmarkMap[problemId]) {
        // create bookmark if none
        const res = await api.post('/bookmarks', { problemId, progress: 'completed' });
        setBookmarkMap(prev => ({ ...prev, [problemId]: true }));
      } else {
        const bm = await api.get(`/bookmarks/problem/${problemId}`);
        const newProg = solvedMap[problemId] ? 'not-started' : 'completed';
        await api.put(`/bookmarks/${bm.data.data.bookmark._id}/progress`, { progress: newProg });
      }
      setSolvedMap(prev => ({ ...prev, [problemId]: !prev[problemId] }));
    } catch (error) {
      console.error('Error toggling solved:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Coding Problems</h1>
          <p className="mt-2 text-lg text-gray-600">
            Practice your coding skills with our collection of problems.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search problems..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Difficulty */}
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            {/* Category */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="algorithms">Algorithms</option>
              <option value="data-structures">Data Structures</option>
              <option value="databases">Databases</option>
              <option value="system-design">System Design</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => setFilters({ search: '', difficulty: '', category: '', page: 1 })}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Problems List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading problems...</p>
            </div>
          ) : problems.length === 0 ? (
            <div className="text-center py-12">
              <CodeBracketIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-2 text-gray-500">No problems found</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {problems.map((problem) => (
                <li key={problem._id} className="hover:bg-gray-50">
                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <Link href={`/problems/${problem._id}`} className="block group">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 truncate">
                            {problem.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>{problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 truncate">{problem.description.substring(0, 100)}...</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500"><span>{problem.category.replace('-', ' ')}</span><span>•</span><span>{problem.stats.attempts} attempts</span><span>•</span><span>{problem.likes.length} likes</span></div>
                      </Link>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Solved Toggle */}
                      <button onClick={() => toggleSolved(problem._id)} className="p-2 hover:bg-gray-100 rounded">
                        {solvedMap[problem._id] ? (
                          <CheckSolidIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <CheckSolidIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      {/* Bookmark Toggle */}
                      <button onClick={() => toggleBookmark(problem._id)} className="p-2 hover:bg-gray-100 rounded">
                        {bookmarkMap[problem._id] ? (
                          <BookmarkSolidIcon className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <BookmarkOutlineIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.current} of {pagination.pages}
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handlePageChange(pagination.current - 1)} disabled={pagination.current === 1} className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              <button onClick={() => handlePageChange(pagination.current + 1)} disabled={pagination.current === pagination.pages} className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
