import { useState, useEffect } from 'react';
import {
  CodeBracketIcon,
  BookmarkIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

import api from '../../lib/axios';

export default function UserStats({ userId }) {
  const [stats, setStats] = useState({
    totalProblems: 0,
    totalBookmarks: 0,
    totalRooms: 0,
    totalCollaborations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      const response = await api.get(`/users/stats${userId ? `?userId=${userId}` : ''}`);
      setStats(response.data.data.stats || stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-gray-200 rounded-lg"></div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
      <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center justify-center">
        <CodeBracketIcon className="h-5 w-5 text-indigo-600" />
        <p className="text-xs font-medium text-gray-500 mt-1">Solved</p>
        <p className="text-xl font-semibold text-gray-900">{stats.totalProblems}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center justify-center">
        <BookmarkIcon className="h-5 w-5 text-indigo-600" />
        <p className="text-xs font-medium text-gray-500 mt-1">Bookmarks</p>
        <p className="text-xl font-semibold text-gray-900">{stats.totalBookmarks}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center justify-center">
        <UserGroupIcon className="h-5 w-5 text-indigo-600" />
        <p className="text-xs font-medium text-gray-500 mt-1">Rooms</p>
        <p className="text-xl font-semibold text-gray-900">{stats.totalRooms}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center justify-center">
        <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600" />
        <p className="text-xs font-medium text-gray-500 mt-1">Collaborations</p>
        <p className="text-xl font-semibold text-gray-900">{stats.totalCollaborations}</p>
      </div>
    </div>
  );
}
