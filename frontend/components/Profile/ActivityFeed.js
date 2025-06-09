// components/Profile/ActivityFeed.js

import Link from 'next/link';
import {
  CodeBracketIcon,
  BookmarkIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

export default function ActivityFeed({ activities = [] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
      </div>
    );
  }

  const getIcon = (type) => {
    switch (type) {
      case 'problem':
        return <CodeBracketIcon className="h-5 w-5 text-indigo-600" />;
      case 'bookmark':
        return <BookmarkIcon className="h-5 w-5 text-indigo-600" />;
      case 'room':
        return <UserGroupIcon className="h-5 w-5 text-indigo-600" />;
      case 'chat':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600" />;
      default:
        return <CodeBracketIcon className="h-5 w-5 text-indigo-600" />;
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity._id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span
                  className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {getIcon(activity.type)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {activity.resourceType && activity.resourceId && (
                    <div className="mt-2 text-sm text-gray-700">
                      <Link href={`/${activity.resourceType}/${activity.resourceId}`} className="text-indigo-600 hover:text-indigo-500">
                          View {activity.resourceType}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
