import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/axios';
import Layout from '../../components/Layout/Layout';
import CodeEditor, { getLanguageConfig } from '../../components/Editor/CodeEditor';
import {
  BookmarkIcon as BookmarkOutlineIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

export default function ProblemDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');

  // Bookmark & solved state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchProblem();
  }, [id]);

  const fetchProblem = async () => {
    try {
      const res = await api.get(`/problems/${id}`);
      const data = res.data.data.problem;
      setProblem(data);
      // load starter code for current language
      const config = getLanguageConfig(language);
      setCode(data.starterCode?.[language] || config.defaultValue);
      // fetch bookmark state
      const bm = await api.get(`/bookmarks/problem/${id}`);
      if (bm.data.data.bookmark) {
        setIsBookmarked(true);
        setBookmarkId(bm.data.data.bookmark._id);
        setIsSolved(bm.data.data.bookmark.progress === 'completed');
      }
    } catch (err) {
      console.error('Error fetching problem:', err);
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (problem) {
      const config = getLanguageConfig(lang);
      setCode(problem.starterCode?.[lang] || config.defaultValue);
    }
  };

  const handleCodeChange = (value) => {
    setCode(value);
  };

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${bookmarkId}`);
        setIsBookmarked(false);
        setBookmarkId(null);
        setIsSolved(false);
      } else {
        const res = await api.post('/bookmarks', { problemId: id });
        setIsBookmarked(true);
        setBookmarkId(res.data.data.bookmark._id);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const toggleSolved = async () => {
    try {
      if (!isBookmarked) {
        const res = await api.post('/bookmarks', { problemId: id, progress: 'completed' });
        setBookmarkId(res.data.data.bookmark._id);
        setIsBookmarked(true);
      } else {
        const newProgress = isSolved ? 'not-started' : 'completed';
        await api.put(`/bookmarks/${bookmarkId}/progress`, { progress: newProgress });
      }
      setIsSolved(!isSolved);
    } catch (err) {
      console.error('Error toggling solved:', err);
    }
  };

  const runCode = async () => {
    try {
      setIsRunning(true);
      setOutput('');
      setError('');
      const res = await api.post('/execute', {
        language,
        code,
        testCases: problem.testCases,
      });
      setOutput(res.data.data.output);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Execution error');
    } finally {
      setIsRunning(false);
    }
  };

  if (!problem) {
    return (
      <Layout>
        <div className="text-center py-20">Loading...</div>
      </Layout>
    );
  }

  const languages = ['javascript', 'python', 'java', 'cpp'];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back to all problems */}
        <div className="mb-4">
          <Link href="/problems" className="inline-block px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
              View All Problems
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left pane: problem details */}
          <aside className="col-span-1 bg-white p-6 rounded-lg shadow space-y-4 overflow-y-auto h-[80vh]">
            <h1 className="text-2xl font-bold">{problem.title}</h1>
            <div className="flex flex-wrap gap-2">
              {problem.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-4 text-gray-700 whitespace-pre-line">{problem.description}</p>
            {problem.testCases.length > 0 && (
              <section className="mt-6">
                <h2 className="text-lg font-semibold">Test Cases</h2>
                <ul className="mt-2 space-y-2">
                  {problem.testCases.map((tc, idx) => (
                    <li key={idx} className="bg-gray-50 p-3 rounded">
                      <p><strong>Input:</strong> {tc.input}</p>
                      <p><strong>Output:</strong> {tc.expectedOutput}</p>
                      {tc.explanation && <p className="text-sm text-gray-500">{tc.explanation}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>

          {/* Right pane: code editor */}
          <main className="col-span-2 bg-white p-6 rounded-lg shadow flex flex-col">
            {/* Language tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              {languages.map(lang => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`py-2 px-4 -mb-px border-b-2 font-medium text-sm ${language === lang ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <CodeEditor
              value={code}
              language={language}
              onChange={handleCodeChange}
              height="80vh"
              enableRun={true}
            />

            {/* Action buttons */}
            <div className="mt-4 flex items-center justify-between">
              <div></div>
              <div className="flex space-x-2">
                <button
                  onClick={toggleSolved}
                  className="flex items-center px-4 py-2 border rounded-md hover:bg-gray-100"
                >
                  {isSolved ? (
                    <CheckSolidIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <CheckSolidIcon className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="ml-2 text-sm font-medium">
                    {isSolved ? 'Solved' : 'Mark as Solved'}
                  </span>
                </button>
                <button
                  onClick={toggleBookmark}
                  className="flex items-center px-4 py-2 border rounded-md hover:bg-gray-100"
                >
                  {isBookmarked ? (
                    <BookmarkSolidIcon className="h-5 w-5 text-indigo-600" />
                  ) : (
                    <BookmarkOutlineIcon className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="ml-2 text-sm font-medium">
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </span>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}
