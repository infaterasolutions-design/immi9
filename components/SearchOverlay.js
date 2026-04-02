import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { NewsData, AdminConfig } from '../data';

const STORAGE_KEY = 'dd_recent_searches';
const MAX_RECENT = 5;

function getRecent() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function saveRecent(term) {
  const list = getRecent().filter(t => t !== term);
  list.unshift(term);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

function clearRecent() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function SearchOverlay({ isOpen, onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const trending = AdminConfig?.searchSettings?.trendingKeywords || [];

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecent());
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setShowResults(false);
    }
  }, [isOpen]);

  // Live search filtering
  useEffect(() => {
    if (!query.trim()) {
      setShowResults(false);
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const matched = NewsData.filter(
      a => a.title.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    ).slice(0, 8);
    setResults(matched);
    setShowResults(true);
  }, [query]);

  const handleSearch = useCallback((term) => {
    if (!term.trim()) return;
    saveRecent(term.trim());
    setQuery(term);
    // Navigate to category or show filtered results
    onClose();
  }, [onClose]);

  const handleResultClick = useCallback((articleId) => {
    if (query.trim()) saveRecent(query.trim());
    onClose();
    router.push(`/article/${articleId}`);
  }, [query, onClose, router]);

  const popularArticles = NewsData.slice(0, 5);

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        .search-overlay {
          position: fixed; inset: 0; z-index: 100; background: white;
          animation: slideUp 0.35s cubic-bezier(0.25,0.8,0.25,1) forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .skeleton-bar {
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div className="search-overlay lg:hidden">
        <div className="min-h-screen flex flex-col">
          {/* Search Header */}
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 pt-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="flex-1 flex items-center bg-slate-100 px-4 h-12 rounded-full border border-slate-200 shadow-sm relative">
                <span className="material-symbols-outlined text-slate-400 text-lg mr-2">search</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                  className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full font-['Inter'] text-slate-800 placeholder-slate-400"
                  placeholder="Search visa news, guides..."
                  type="text"
                  autoComplete="off"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-700 transition-colors ml-1 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Search Content */}
          <div className="flex-1 px-4 py-5 space-y-6 overflow-y-auto">
            {!showResults ? (
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">history</span> Recent Searches
                      </h4>
                      <button
                        onClick={() => { clearRecent(); setRecentSearches([]); }}
                        className="text-[10px] font-semibold text-primary hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term, i) => (
                        <button
                          key={i}
                          onClick={() => { setQuery(term); handleSearch(term); }}
                          className="px-3 py-1.5 bg-slate-100 text-sm text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px] text-slate-400">history</span>
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                    <span className="material-symbols-outlined text-[14px] text-orange-500">local_fire_department</span> Trending Searches
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {trending.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => { setQuery(term); }}
                        className="px-3 py-1.5 bg-blue-50 text-sm text-blue-700 font-medium hover:bg-blue-100 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular Content */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                    <span className="material-symbols-outlined text-[14px] text-primary">star</span> Popular Right Now
                  </h4>
                  <div className="space-y-1">
                    {popularArticles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => handleResultClick(article.id)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 transition-colors text-left"
                      >
                        <img src={article.image} alt="" className="w-14 h-10 object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{article.title}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">{article.tag}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : results.length > 0 ? (
              /* Live Results */
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                  <span className="material-symbols-outlined text-[14px]">article</span> Results
                </h4>
                {results.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => handleResultClick(article.id)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 transition-colors text-left animate-fadeIn"
                  >
                    <img src={article.image} alt="" className="w-14 h-10 object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-2">{article.title}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">{article.tag} • {article.date}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* No Results */
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-[48px] text-slate-300 mb-3 block">search_off</span>
                <p className="text-sm font-semibold text-slate-500 mb-1">No results found</p>
                <p className="text-xs text-slate-400">Try a different keyword or check trending topics</p>
                <div className="mt-5 flex flex-wrap gap-2 justify-center">
                  {trending.slice(0, 3).map((term, i) => (
                    <button key={i} onClick={() => setQuery(term)} className="px-3 py-1.5 bg-slate-100 text-sm text-slate-600">
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
