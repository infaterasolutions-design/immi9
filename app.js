document.addEventListener('DOMContentLoaded', () => {
    const homeView = document.getElementById('home-view');
    const categoryView = document.getElementById('category-view');
    const articleView = document.getElementById('article-view');
    const liveView = document.getElementById('live-view');
    const categoryTitle = document.getElementById('category-title');
    const categoryGrid = document.getElementById('category-grid');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const articleScrollContainer = document.getElementById('article-scroll-container');
    const articleTemplate = document.getElementById('article-template');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    let currentFilterData = [];
    let displayedCount = 0;
    const PAGE_SIZE = 6;
    let loadedArticleIds = new Set();
    let currentHashProgrammaticallyChanged = false;

    // ── Admin Config Modules: Language Switcher & Floating Card ──
    const adminCfg = window.AdminConfig || {};
    
    // Feature 1: Language Switcher
    if (adminCfg.languageSwitcher && adminCfg.languageSwitcher.enabled) {
        // Build language list
        const langList = document.getElementById('lang-list');
        adminCfg.languageSwitcher.allowedLanguages.forEach(lang => {
            const btn = document.createElement('button');
            btn.className = 'flex items-center gap-4 w-full px-4 py-3 hover:bg-slate-50 transition-colors rounded-xl text-left border border-transparent hover:border-slate-100 border-slate-200 shadow-sm';
            btn.innerHTML = `<span class="text-2xl">${lang.flag}</span> <span class="font-bold text-slate-800 text-sm font-['Inter']">${lang.name}</span>`;
            btn.onclick = () => {
                // Switch Google Translate dropdown
                const gtSelect = document.querySelector('select.goog-te-combo');
                if (gtSelect) {
                    gtSelect.value = lang.code;
                    gtSelect.dispatchEvent(new Event('change'));
                }
                closeLangMenu();
            };
            if(langList) langList.appendChild(btn);
        });

        const fabBtn = document.getElementById('lang-fab-btn');
        const fabContainer = document.getElementById('language-fab-container');
        const menuOverlay = document.getElementById('lang-menu-overlay');
        const menuSheet = document.getElementById('lang-menu-sheet');

        window.closeLangMenu = () => {
            if(menuOverlay) menuOverlay.dataset.open = 'false';
            if(menuSheet) menuSheet.dataset.open = 'false';
        };

        const openLangMenu = () => {
            if(menuOverlay) menuOverlay.dataset.open = 'true';
            if(menuSheet) menuSheet.dataset.open = 'true';
        };

        if (fabBtn) fabBtn.addEventListener('click', openLangMenu);
        if (menuOverlay) menuOverlay.addEventListener('click', closeLangMenu);
        
        // Show FAB with slight delay
        setTimeout(() => { if (fabContainer) fabContainer.dataset.visible = 'true'; }, 1500);

        // Load Google Translate API globally
        window.googleTranslateElementInit = function() {
            new google.translate.TranslateElement({
                pageLanguage: adminCfg.languageSwitcher.defaultLanguage || 'en',
                includedLanguages: adminCfg.languageSwitcher.allowedLanguages.map(l => l.code).join(','),
                autoDisplay: false
            }, 'google_translate_element');
            // Hide Google's native top banner
            const style = document.createElement('style');
            style.innerHTML = `body { top: 0 !important; } .skiptranslate { display: none !important; } #goog-gt-tt { display: none !important; }`;
            document.head.appendChild(style);
        };
        const gtScript = document.createElement('script');
        gtScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.head.appendChild(gtScript);
    } 

    // Feature 2: Floating Blog Recommendation Card
    if (adminCfg.floatingBlogCard && adminCfg.floatingBlogCard.enabled) {
        const cfg = adminCfg.floatingBlogCard;
        const recContainer = document.getElementById('rec-card-container');
        const recClose = document.getElementById('rec-card-close');
        
        // Setup content
        let targetPost = null;
        if (cfg.recommendedPostId && window.NewsData) {
            targetPost = window.NewsData.find(p => p.id === cfg.recommendedPostId);
        } else if (window.NewsData) {
            targetPost = window.NewsData[0]; // fallback
        }

        if (targetPost && recContainer) {
            document.getElementById('rec-card-title').textContent = (cfg.customOverride && cfg.customOverride.title) ? cfg.customOverride.title : targetPost.title;
            document.getElementById('rec-card-img').src = (cfg.customOverride && cfg.customOverride.image) ? cfg.customOverride.image : targetPost.image;
            document.getElementById('rec-card-link').onclick = (e) => {
                if(e.target.closest('#rec-card-close')) return;
                window.location.hash = (cfg.customOverride && cfg.customOverride.url) ? cfg.customOverride.url : `#/article/${targetPost.id}`;
            };
            
            if (recClose) {
                recClose.onclick = () => {
                    recContainer.dataset.visible = 'false';
                    localStorage.setItem('hasDismissedRecCard', 'true');
                };
            }

            // Setup Rules and Triggers
            const checkAndShowCard = () => {
                // Testing Mode: Bypassing local storage dismissal rule so you can preview it!
                // if (localStorage.getItem('hasDismissedRecCard')) return;
                
                // Display rule check
                if (cfg.displayRules && cfg.displayRules.showOn === 'article-only' && !window.location.hash.startsWith('#/article')) {
                    return;
                }
                
                recContainer.dataset.visible = 'true';
            };

            if (cfg.triggerSettings.type === 'time') {
                const delayMs = (cfg.triggerSettings.value || 5) * 1000;
                setTimeout(checkAndShowCard, delayMs);
            } else if (cfg.triggerSettings.type === 'scroll') {
                const scrollPct = (cfg.triggerSettings.value || 30) / 100;
                const scrollListener = () => {
                    const scrolled = window.scrollY / Math.max(1, (document.documentElement.scrollHeight - document.documentElement.clientHeight));
                    if (scrolled >= scrollPct) {
                        checkAndShowCard();
                        window.removeEventListener('scroll', scrollListener);
                    }
                };
                window.addEventListener('scroll', scrollListener);
            }
        }
    }
    // ── Nav Active State ──
    function updateNavActiveState(hash) {
        document.querySelectorAll('[data-nav]').forEach(el => {
            el.classList.remove('text-blue-700','border-b-2','border-blue-700','pb-1');
            el.classList.add('text-slate-600');
        });
        let key = 'home';
        if (hash.startsWith('#/category/visa-news')) key = 'visa-news';
        else if (hash.startsWith('#/category/visa-guides')) key = 'visa-guides';
        else if (hash.startsWith('#/category/visa-bulletin')) key = 'visa-bulletin';
        else if (hash.startsWith('#/category/processing-times')) key = 'processing-times';
        else if (!hash || hash === '#/' || hash === '#/home') key = 'home';
        else key = '';
        const el = document.querySelector(`[data-nav="${key}"]`);
        if (el) {
            el.classList.remove('text-slate-600');
            el.classList.add('text-blue-700','border-b-2','border-blue-700','pb-1');
        }
    }

    // ── Search ──
    function initSearch() {
        // Desktop search (untouched)
        if (searchInput && searchResults) {
            let timer = null;
            searchInput.addEventListener('input', () => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    const q = searchInput.value.trim().toLowerCase();
                    if (q.length < 2) { searchResults.classList.add('hidden'); return; }
                    const hits = window.NewsData.filter(i =>
                        i.title.toLowerCase().includes(q) || i.tag.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
                    ).slice(0, 6);
                    if (!hits.length) {
                        searchResults.innerHTML = '<div class="px-4 py-3 text-sm text-slate-500">No results found.</div>';
                    } else {
                        searchResults.innerHTML = hits.map(i => `
                            <a href="#/article/${i.id}" class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                <img src="${i.image}" class="w-12 h-9 object-cover flex-shrink-0" alt=""/>
                                <div><div class="text-[10px] font-bold text-primary uppercase tracking-widest">${i.tag}</div>
                                <div class="text-sm font-semibold text-slate-900 line-clamp-1">${i.title}</div></div>
                            </a>`).join('');
                    }
                    searchResults.classList.remove('hidden');
                }, 200);
            });
            searchInput.addEventListener('keydown', e => {
                if (e.key === 'Enter' && searchInput.value.trim()) {
                    window.location.hash = '#/search/' + encodeURIComponent(searchInput.value.trim());
                    searchResults.classList.add('hidden'); searchInput.blur();
                }
            });
            document.addEventListener('click', e => {
                if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) searchResults.classList.add('hidden');
            });
        }

        // ═══════════════════════════════════════════
        //  MOBILE SMART SEARCH — Full-Screen Premium
        // ═══════════════════════════════════════════
        const sCfg = (window.AdminConfig && window.AdminConfig.searchSettings) || {};
        if (sCfg.enabled === false) return;

        const sOverlay = document.getElementById('smart-search-overlay');
        const sInput = document.getElementById('smart-search-input');
        const sBack = document.getElementById('smart-search-back');
        const sClear = document.getElementById('smart-search-clear');
        const sVoice = document.getElementById('smart-search-voice');
        const sSkeleton = document.getElementById('smart-search-skeleton');
        const sDefault = document.getElementById('smart-search-default');
        const sResultsWrap = document.getElementById('smart-search-results');
        const sResultsList = document.getElementById('smart-search-results-list');
        const sEmpty = document.getElementById('smart-search-empty');
        const sEmptySuggestions = document.getElementById('smart-search-empty-suggestions');
        const sRecentSection = document.getElementById('smart-search-recent-section');
        const sRecentList = document.getElementById('smart-search-recent-list');
        const sTrendingList = document.getElementById('smart-search-trending-list');
        const sPopularList = document.getElementById('smart-search-popular-list');
        const sClearHistory = document.getElementById('smart-search-clear-history');
        const mobileSearchBtn = document.getElementById('mobile-search-btn');
        
        if (!sOverlay || !sInput) return;

        // Helpers
        const RECENT_KEY = 'smartSearchRecent';
        const getRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } };
        const saveRecent = (q) => {
            let arr = getRecent().filter(x => x !== q);
            arr.unshift(q);
            if (arr.length > 5) arr = arr.slice(0, 5);
            localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
        };

        // Fuzzy match helper
        const fuzzyMatch = (text, query) => {
            const t = text.toLowerCase();
            const q = query.toLowerCase();
            if (t.includes(q)) return true;
            // Simple typo tolerance: allow 1 char difference
            if (q.length >= 3) {
                for (let i = 0; i < q.length; i++) {
                    const partial = q.slice(0, i) + q.slice(i + 1);
                    if (t.includes(partial)) return true;
                }
            }
            return false;
        };

        // Highlight matched text
        const highlight = (text, query) => {
            if (!query) return text;
            const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return text.replace(regex, '<mark class="bg-yellow-100 text-slate-900 font-bold px-0.5">$1</mark>');
        };

        // Render a single result card
        const renderResultCard = (item, query) => `
            <a href="#/article/${item.id}" class="search-result-item flex items-center gap-3 px-3 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 active:scale-[0.98]" data-smart-result>
                <img src="${item.image}" class="w-14 h-10 object-cover flex-shrink-0 shadow-sm" alt=""/>
                <div class="flex-1 min-w-0">
                    <div class="text-[9px] font-bold text-primary uppercase tracking-widest mb-0.5">${item.tag}</div>
                    <div class="text-[13px] font-semibold text-slate-800 line-clamp-2 leading-snug">${highlight(item.title, query)}</div>
                </div>
                <span class="material-symbols-outlined text-slate-300 text-[16px] shrink-0">arrow_forward_ios</span>
            </a>`;

        // Render trending chips
        const renderTrending = () => {
            if (!sTrendingList) return;
            const keywords = sCfg.trendingKeywords || [];
            sTrendingList.innerHTML = keywords.map(kw => `
                <button class="px-3 py-1.5 bg-orange-50 border border-orange-100 text-orange-700 text-xs font-semibold hover:bg-orange-100 active:scale-95 transition-all flex items-center gap-1" data-trending-kw="${kw}">
                    <span class="material-symbols-outlined text-[12px]">trending_up</span> ${kw}
                </button>`).join('');
            sTrendingList.querySelectorAll('[data-trending-kw]').forEach(btn => {
                btn.addEventListener('click', () => {
                    sInput.value = btn.dataset.trendingKw;
                    sInput.dispatchEvent(new Event('input'));
                });
            });
        };

        // Render recent chips
        const renderRecent = () => {
            const items = getRecent();
            if (!sRecentSection || !sRecentList) return;
            if (!items.length) { sRecentSection.classList.add('hidden'); return; }
            sRecentSection.classList.remove('hidden');
            sRecentList.innerHTML = items.map(q => `
                <button class="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-1" data-recent-kw="${q}">
                    <span class="material-symbols-outlined text-[12px]">history</span> ${q}
                </button>`).join('');
            sRecentList.querySelectorAll('[data-recent-kw]').forEach(btn => {
                btn.addEventListener('click', () => {
                    sInput.value = btn.dataset.recentKw;
                    sInput.dispatchEvent(new Event('input'));
                });
            });
        };

        // Render popular articles
        const renderPopular = () => {
            if (!sPopularList || !window.NewsData) return;
            const popular = window.NewsData.slice(0, 4);
            sPopularList.innerHTML = popular.map(item => `
                <a href="#/article/${item.id}" class="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 active:scale-[0.98]" data-smart-result>
                    <img src="${item.image}" class="w-12 h-9 object-cover flex-shrink-0 shadow-sm" alt=""/>
                    <div class="flex-1 min-w-0">
                        <div class="text-[9px] font-bold text-primary uppercase tracking-widest mb-0.5">${item.tag}</div>
                        <div class="text-[12px] font-semibold text-slate-800 line-clamp-1 leading-snug">${item.title}</div>
                    </div>
                </a>`).join('');
        };

        // Open
        const openSmartSearch = () => {
            sOverlay.classList.add('is-open');
            document.body.style.overflow = 'hidden';
            // Show skeleton briefly
            if (sSkeleton) { sSkeleton.classList.remove('hidden'); sDefault.classList.add('hidden'); }
            setTimeout(() => {
                if (sSkeleton) sSkeleton.classList.add('hidden');
                if (sDefault) sDefault.classList.remove('hidden');
                renderRecent();
                renderTrending();
                renderPopular();
                sInput.focus();
            }, 500);
        };

        // Close
        const closeSmartSearch = () => {
            sOverlay.classList.remove('is-open');
            document.body.style.overflow = '';
            sInput.value = '';
            if (sClear) sClear.classList.add('hidden');
            if (sVoice) sVoice.classList.remove('hidden');
            if (sResultsWrap) sResultsWrap.classList.add('hidden');
            if (sEmpty) sEmpty.classList.add('hidden');
            if (sDefault) sDefault.classList.remove('hidden');
        };

        // Wire open/close
        if (mobileSearchBtn) mobileSearchBtn.addEventListener('click', openSmartSearch);
        if (sBack) sBack.addEventListener('click', closeSmartSearch);

        // Clear input
        if (sClear) sClear.addEventListener('click', () => {
            sInput.value = '';
            sClear.classList.add('hidden');
            if (sVoice) sVoice.classList.remove('hidden');
            if (sResultsWrap) sResultsWrap.classList.add('hidden');
            if (sEmpty) sEmpty.classList.add('hidden');
            if (sDefault) sDefault.classList.remove('hidden');
            sInput.focus();
        });

        // Clear history
        if (sClearHistory) sClearHistory.addEventListener('click', () => {
            localStorage.removeItem(RECENT_KEY);
            renderRecent();
        });

        // Voice search
        if (sCfg.voiceSearchEnabled && sVoice && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            sVoice.classList.remove('hidden');
            sVoice.addEventListener('click', () => {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.lang = 'en-US';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;
                sVoice.querySelector('.material-symbols-outlined').textContent = 'graphic_eq';
                sVoice.classList.add('text-red-500');
                recognition.start();
                recognition.onresult = (e) => {
                    const transcript = e.results[0][0].transcript;
                    sInput.value = transcript;
                    sInput.dispatchEvent(new Event('input'));
                    sVoice.querySelector('.material-symbols-outlined').textContent = 'mic';
                    sVoice.classList.remove('text-red-500');
                };
                recognition.onerror = () => {
                    sVoice.querySelector('.material-symbols-outlined').textContent = 'mic';
                    sVoice.classList.remove('text-red-500');
                };
                recognition.onend = () => {
                    sVoice.querySelector('.material-symbols-outlined').textContent = 'mic';
                    sVoice.classList.remove('text-red-500');
                };
            });
        }

        // Live search with debounce
        let searchTimer = null;
        sInput.addEventListener('input', () => {
            const q = sInput.value.trim();
            // Toggle clear / voice icons
            if (sClear) sClear.classList.toggle('hidden', !q);
            if (sVoice) sVoice.classList.toggle('hidden', !!q);

            clearTimeout(searchTimer);
            if (q.length < 2) {
                if (sResultsWrap) sResultsWrap.classList.add('hidden');
                if (sEmpty) sEmpty.classList.add('hidden');
                if (sDefault) sDefault.classList.remove('hidden');
                return;
            }

            searchTimer = setTimeout(() => {
                const qLower = q.toLowerCase();
                const hits = window.NewsData.filter(i =>
                    fuzzyMatch(i.title, qLower) || fuzzyMatch(i.tag, qLower) || fuzzyMatch(i.category, qLower)
                ).slice(0, 8);

                if (sDefault) sDefault.classList.add('hidden');

                if (hits.length) {
                    if (sEmpty) sEmpty.classList.add('hidden');
                    if (sResultsWrap) sResultsWrap.classList.remove('hidden');
                    if (sResultsList) sResultsList.innerHTML = hits.map(i => renderResultCard(i, q)).join('');
                } else {
                    if (sResultsWrap) sResultsWrap.classList.add('hidden');
                    if (sEmpty) sEmpty.classList.remove('hidden');
                    // Show trending as suggestions in empty state
                    if (sEmptySuggestions && sCfg.trendingKeywords) {
                        sEmptySuggestions.innerHTML = sCfg.trendingKeywords.slice(0, 3).map(kw => `
                            <button class="px-3 py-1.5 bg-blue-50 border border-blue-100 text-primary text-xs font-semibold hover:bg-blue-100 active:scale-95 transition-all" data-suggest-kw="${kw}">${kw}</button>`).join('');
                        sEmptySuggestions.querySelectorAll('[data-suggest-kw]').forEach(btn => {
                            btn.addEventListener('click', () => {
                                sInput.value = btn.dataset.suggestKw;
                                sInput.dispatchEvent(new Event('input'));
                            });
                        });
                    }
                }
            }, 300);
        });

        // Enter key saves to recent and navigates
        sInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && sInput.value.trim()) {
                saveRecent(sInput.value.trim());
                window.location.hash = '#/search/' + encodeURIComponent(sInput.value.trim());
                closeSmartSearch();
            }
        });

        // Click result → save & close
        if (sResultsList) sResultsList.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && sInput.value.trim()) {
                saveRecent(sInput.value.trim());
                closeSmartSearch();
            }
        });
        if (sPopularList) sPopularList.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) closeSmartSearch();
        });

        // Also redirect hamburger-menu search input to smart search
        const mobileMenuSearchInput = document.getElementById('mobile-search-input');
        if (mobileMenuSearchInput) {
            mobileMenuSearchInput.addEventListener('focus', () => {
                openSmartSearch();
                mobileMenuSearchInput.blur();
            });
        }
    }

    // ── Horizontal Scrollers ──
    function initScrollers() {
        [['top-stories','top-stories-scroll'],['video-highlights','video-highlights-scroll']].forEach(([prefix, scrollId]) => {
            const c = document.getElementById(scrollId);
            const pv = document.getElementById(prefix+'-prev');
            const nx = document.getElementById(prefix+'-next');
            if (c && pv && nx) {
                pv.addEventListener('click', () => c.scrollBy({left:-300,behavior:'smooth'}));
                nx.addEventListener('click', () => c.scrollBy({left:300,behavior:'smooth'}));
            }
        });
    }

    // ── Observers ──
    const scrollSpyObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('data-article-id');
                const h = `#/article/${id}`;
                if (window.location.hash !== h) {
                    currentHashProgrammaticallyChanged = true;
                    history.replaceState(null, null, window.location.pathname + window.location.search + h);
                }
            }
        });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

    const infiniteScrollObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cid = parseInt(entry.target.getAttribute('data-article-id'));
                infiniteScrollObserver.unobserve(entry.target);
                loadNextArticle(cid);
            }
        });
    }, { rootMargin: '0px 0px 800px 0px', threshold: 0 });

    function loadNextArticle(currentId) {
        if (loadedArticleIds.size >= 4) return;
        const idx = window.NewsData.findIndex(i => i.id === currentId);
        if (idx === -1 || idx >= window.NewsData.length - 1) return;
        const next = window.NewsData[idx + 1];
        if (!loadedArticleIds.has(next.id)) {
            const node = renderArticle(next);
            if (node) { 
                const divider = document.createElement('div');
                divider.className = "flex items-center justify-center w-full opacity-0 animate-fadeIn pb-12 pt-8";
                divider.innerHTML = `
                    <div class="h-px bg-slate-200 flex-grow"></div>
                    <span class="px-6 text-xs font-bold text-slate-500 tracking-widest flex items-center gap-2 uppercase">
                        Next Article <span class="material-symbols-outlined text-[14px]">arrow_downward</span>
                    </span>
                    <div class="h-px bg-slate-200 flex-grow"></div>
                `;
                node.insertBefore(divider, node.firstChild);
                articleScrollContainer.appendChild(node); 
                infiniteScrollObserver.observe(node); 
                scrollSpyObserver.observe(node); 
            }
        }
    }

    // ── Article Renderer ──
    function renderArticle(data) {
        if (!articleTemplate) return null;
        loadedArticleIds.add(data.id);
        const clone = articleTemplate.content.cloneNode(true);
        const root = clone.querySelector('.article-instance');
        root.setAttribute('data-article-id', data.id);
        root.querySelector('.article-title').textContent = data.title;
        root.querySelector('.article-tag').textContent = data.category.replace(/-/g,' ') + ' | ' + data.tag;
        const location = data.location || 'Washington, D.C.';
        const time = data.time || '10:00 AM EDT';
        const formattedDate = data.date || data.startDate || '';
        root.querySelector('.article-date').textContent = `${location} • ${formattedDate} at ${time}`;

        // Populate dynamic description/excerpt
        const descEl = root.querySelector('.article-description');
        let excerpt = data.description || data.summary;
        if (!excerpt && data.content) {
            const match = data.content.match(/<p[^>]*>(.*?)<\/p>/);
            if (match) {
                const tmp = document.createElement('div');
                tmp.innerHTML = match[1];
                excerpt = tmp.textContent || tmp.innerText || '';
                // Limit to roughly 2 lines
                if (excerpt.length > 180) excerpt = excerpt.substring(0, 177).trim() + '...';
            }
        }
        
        if (excerpt && descEl) {
            descEl.textContent = excerpt;
            descEl.classList.remove('hidden');
        } else if (descEl) {
            root.querySelector('.article-title').classList.replace('mb-6', 'mb-8');
            descEl.remove();
        }
        root.querySelector('.article-image').src = data.image;
        root.querySelector('.article-body').innerHTML = data.content;
        const wrapper = root.querySelector('.article-content-wrapper');
        const keepReading = root.querySelector('.article-keep-reading');
        const gradient = root.querySelector('.article-gradient');
        keepReading.querySelector('button').addEventListener('click', () => {
            wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
            gradient.style.opacity = '0';
            setTimeout(() => { keepReading.remove(); wrapper.style.maxHeight = 'none'; }, 1000);
            
            // Explicitly set URL when interacting with Keep Reading to guarantee state
            const h = `#/article/${data.id}`;
            if (window.location.hash !== h) {
                currentHashProgrammaticallyChanged = true;
                history.replaceState(null, null, window.location.pathname + window.location.search + h);
            }
        });
        return root;
    }

    // ── View Switcher ──
    function showView(name) {
        [homeView, categoryView, articleView, liveView].forEach(v => { if(v) v.classList.add('hidden'); });
        const map = { home: homeView, category: categoryView, article: articleView, live: liveView };
        if (map[name]) map[name].classList.remove('hidden');
        // Stop live updates timer when leaving live view
        if (name !== 'live' && liveAutoUpdateTimer) { clearInterval(liveAutoUpdateTimer); liveAutoUpdateTimer = null; }
    }

    // ── Router ──
    function handleRoute() {
        if (currentHashProgrammaticallyChanged) { currentHashProgrammaticallyChanged = false; return; }
        const hash = window.location.hash;
        updateNavActiveState(hash);
        if (typeof closeMobileMenu === 'function') closeMobileMenu();

        if (!hash || hash === '#/home' || hash === '#/') {
            showView('home');
            loadedArticleIds.clear(); scrollSpyObserver.disconnect(); infiniteScrollObserver.disconnect();
            return;
        }
        if (hash.startsWith('#/search/')) {
            const q = decodeURIComponent(hash.split('/search/')[1] || '');
            showView('category');
            loadedArticleIds.clear(); scrollSpyObserver.disconnect(); infiniteScrollObserver.disconnect();
            categoryTitle.textContent = 'Search: "' + q + '"';
            currentFilterData = window.NewsData.filter(i =>
                i.title.toLowerCase().includes(q.toLowerCase()) || i.tag.toLowerCase().includes(q.toLowerCase()) || i.category.toLowerCase().includes(q.toLowerCase())
            );
            displayedCount = 0; categoryGrid.innerHTML = ''; renderCards();
            window.scrollTo({top:0,behavior:'auto'});
            return;
        }
        if (hash.startsWith('#/article/')) {
            const aid = parseInt(hash.split('/')[2]);
            
            // Handle deep linking for articles that are already loaded in the DOM
            if (loadedArticleIds.has(aid)) {
                const targetNode = document.querySelector(`[data-article-id="${aid}"]`);
                if (targetNode) {
                    currentHashProgrammaticallyChanged = true;
                    targetNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Prevent immediate reverse navigation loops
                    setTimeout(() => { currentHashProgrammaticallyChanged = false; }, 800);
                    return;
                }
            }

            const article = window.NewsData.find(i => i.id === aid);
            if (article && articleView && articleTemplate) {
                showView('article');
                articleScrollContainer.innerHTML = ''; loadedArticleIds.clear();
                infiniteScrollObserver.disconnect(); scrollSpyObserver.disconnect();
                const node = renderArticle(article);
                if (node) { articleScrollContainer.appendChild(node); infiniteScrollObserver.observe(node); scrollSpyObserver.observe(node); window.scrollTo({top:0,behavior:'auto'}); }
            }
            return;
        }
        if (hash.startsWith('#/category/')) {
            const parts = hash.split('/');
            const cat = parts[2]||'', sub = parts[3]||'';
            showView('category');
            loadedArticleIds.clear(); scrollSpyObserver.disconnect(); infiniteScrollObserver.disconnect();
            let title = cat.replace(/-/g,' ');
            if (sub && sub !== 'index') title += ' — ' + sub.replace(/-/g,' ');
            categoryTitle.textContent = title;
            currentFilterData = window.NewsData.filter(i => {
                if (sub && sub !== 'index') return i.category === cat && i.subcategory === sub;
                return i.category === cat;
            });
            displayedCount = 0; categoryGrid.innerHTML = ''; renderCards();
            window.scrollTo({top:0,behavior:'auto'});
        }
        if (hash.startsWith('#/live/')) {
            const slug = hash.split('/live/')[1] || '';
            showView('live');
            loadedArticleIds.clear(); scrollSpyObserver.disconnect(); infiniteScrollObserver.disconnect();
            renderLiveUpdatesPage(slug);
            window.scrollTo({top:0,behavior:'auto'});
        }
    }

    // ── Category Cards ──
    function renderCards() {
        const batch = currentFilterData.slice(displayedCount, displayedCount + PAGE_SIZE);
        if (!batch.length && !displayedCount) {
            categoryGrid.innerHTML = '<div class="col-span-full py-12 text-center text-slate-500"><span class="material-symbols-outlined text-4xl mb-2 opacity-50">article</span><p>No articles found for this category yet.</p></div>';
            if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
            return;
        }
        batch.forEach(a => {
            const card = document.createElement('a');
            card.href = `#/article/${a.id}`;
            card.className = 'group block relative bg-white border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow';
            card.innerHTML = `<div class="aspect-[4/3] overflow-hidden mb-3"><img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="${a.image}" alt="${a.title}"/></div><span class="text-primary text-[10px] font-bold uppercase tracking-widest block mb-2">${a.tag}</span><h3 class="font-bold font-['Plus_Jakarta_Sans'] text-base leading-tight group-hover:text-primary transition-colors text-slate-900 line-clamp-3">${a.title}</h3><p class="text-[10px] text-slate-400 font-medium mt-3 uppercase">${a.date}</p>`;
            categoryGrid.appendChild(card);
        });
        displayedCount += batch.length;
        if (loadMoreBtn) { loadMoreBtn.classList[displayedCount >= currentFilterData.length ? 'add' : 'remove']('hidden'); }
    }

    // ── Event Listeners ──
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', renderCards);

    // ══════════════════════════════════════
    // ── Live Updates Engine ──
    // ══════════════════════════════════════
    let liveAutoUpdateTimer = null;
    let liveAutoScroll = false;
    let liveDisplayedCount = 0;
    const LIVE_PAGE_SIZE = 6;
    let currentLiveData = null;

    // Convert video URLs to embeddable iframe src
    function getVideoEmbedUrl(url) {
        if (!url) return null;
        // YouTube: various formats
        let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
        if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1`;
        // Vimeo
        m = url.match(/vimeo\.com\/(\d+)/);
        if (m) return `https://player.vimeo.com/video/${m[1]}?title=0&byline=0`;
        // Direct video file (mp4, webm)
        if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return url;
        return url; // fallback: try as-is
    }

    function renderVideoEmbed(url, caption) {
        const embedUrl = getVideoEmbedUrl(url);
        if (!embedUrl) return '';
        // If direct video file
        if (/\.(mp4|webm|ogg)(\?|$)/i.test(embedUrl)) {
            return `<div class="mt-4"><video class="w-full aspect-video bg-black" controls preload="metadata"><source src="${embedUrl}"></video>${caption ? `<p class="text-[10px] text-slate-400 italic mt-2">${caption}</p>` : ''}</div>`;
        }
        // iframe embed (YouTube/Vimeo)
        return `<div class="mt-4"><div class="aspect-video w-full"><iframe class="w-full h-full" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>${caption ? `<p class="text-[10px] text-slate-400 italic mt-2">${caption}</p>` : ''}</div>`;
    }

    function renderLiveUpdateCard(u, isNew) {
        const isBreaking = u.type === 'breaking';
        const isImportant = u.type === 'important';
        const isPinned = u.type === 'pinned';
        let badgeHTML = '';
        if (isBreaking) badgeHTML = '<span class="inline-flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest mr-2"><span class="material-symbols-outlined text-[10px]">bolt</span>Breaking</span>';
        else if (isImportant) badgeHTML = '<span class="inline-flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest mr-2"><span class="material-symbols-outlined text-[10px]">priority_high</span>Important</span>';
        else if (isPinned) badgeHTML = '<span class="inline-flex items-center gap-1 bg-primary text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest mr-2"><span class="material-symbols-outlined text-[10px]">push_pin</span>Pinned</span>';

        let mediaHTML = '';
        if (u.media) {
            if (u.media.type === 'video' && u.media.url) {
                mediaHTML = renderVideoEmbed(u.media.url, u.media.caption);
            } else if (u.media.type === 'image') {
                mediaHTML = `<div class="mt-4 overflow-hidden"><img class="w-full aspect-[16/9] object-cover" src="${u.media.src}" alt="${u.media.caption || ''}"/>${u.media.caption ? `<p class="text-[10px] text-slate-400 italic mt-2">${u.media.caption}</p>` : ''}</div>`;
            }
        }

        const borderColor = isBreaking ? 'border-l-red-600' : isImportant ? 'border-l-amber-500' : isPinned ? 'border-l-primary' : 'border-l-slate-200';

        const el = document.createElement('div');
        el.className = `relative pl-12 sm:pl-14 pb-8 ${isNew ? 'update-flash' : ''}`;
        el.innerHTML = `
            <div class="absolute left-2.5 sm:left-3 top-1 w-3.5 h-3.5 border-2 ${isBreaking ? 'border-red-600 bg-red-100' : isImportant ? 'border-amber-500 bg-amber-100' : isPinned ? 'border-primary bg-blue-100' : 'border-slate-300 bg-white'} z-10"></div>
            <div class="border-l-4 ${borderColor} bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                    ${badgeHTML}
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${u.time}</span>
                    <span class="text-[10px] text-slate-300">${u.date}</span>
                </div>
                <h3 class="text-base font-bold headline-font text-slate-900 mb-2 leading-snug">${u.headline}</h3>
                <p class="text-sm text-slate-600 leading-relaxed">${u.content}</p>
                ${mediaHTML}
            </div>`;
        return el;
    }

    function renderLiveUpdatesPage(slug) {
        const data = (window.LiveUpdatesData || []).find(d => d.slug === slug);
        if (!data) { showView('home'); return; }
        currentLiveData = data;

        // Header
        document.getElementById('live-title').textContent = data.title;
        document.getElementById('live-category').textContent = data.category;
        document.getElementById('live-date').textContent = data.startDate;
        document.getElementById('live-summary').textContent = data.summary;
        document.getElementById('live-status-badge').textContent = data.isLive ? 'LIVE' : 'ENDED';

        // Featured Media: Video > Image fallback
        const mediaContainer = document.getElementById('live-featured-media');
        if (mediaContainer) {
            if (data.video) {
                const embedUrl = getVideoEmbedUrl(data.video);
                mediaContainer.innerHTML = `<div class="aspect-video w-full bg-black"><iframe class="w-full h-full" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><div class="p-3 bg-slate-50 text-slate-500 text-[10px] italic font-medium">Live coverage by The Digital Diplomat Editorial Team.</div>`;
            } else if (data.image) {
                mediaContainer.innerHTML = `<img class="w-full aspect-[16/9] object-cover" src="${data.image}" alt="${data.title}"/><div class="p-3 bg-slate-50 text-slate-500 text-[10px] italic font-medium">Live coverage by The Digital Diplomat Editorial Team.</div>`;
            } else {
                mediaContainer.innerHTML = '';
            }
        }

        // Pinned updates
        const pinnedContainer = document.getElementById('live-pinned-container');
        const pinnedUpdates = document.getElementById('live-pinned-updates');
        const pinned = data.updates.filter(u => u.type === 'pinned');
        pinnedUpdates.innerHTML = '';
        if (pinned.length) {
            pinnedContainer.classList.remove('hidden');
            pinned.forEach(u => {
                const card = renderLiveUpdateCard(u, false);
                pinnedUpdates.appendChild(card);
            });
        } else {
            pinnedContainer.classList.add('hidden');
        }

        // Timeline (non-pinned, first batch)
        const timeline = document.getElementById('live-timeline');
        timeline.innerHTML = '';
        const nonPinned = data.updates.filter(u => u.type !== 'pinned');
        liveDisplayedCount = 0;
        const batch = nonPinned.slice(0, LIVE_PAGE_SIZE);
        batch.forEach((u, i) => {
            const card = renderLiveUpdateCard(u, false);
            timeline.appendChild(card);
            // Ad slot after every 4th update
            if ((i + 1) % 4 === 0 && i < batch.length - 1) {
                const ad = document.createElement('div');
                ad.className = 'pl-12 sm:pl-14 pb-8';
                ad.innerHTML = '<div class="bg-slate-50 border border-dashed border-slate-300 p-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Advertisement</div>';
                timeline.appendChild(ad);
            }
        });
        liveDisplayedCount = batch.length;

        // Load more button
        const liveLoadMore = document.getElementById('live-load-more');
        if (liveDisplayedCount < nonPinned.length) {
            liveLoadMore.classList.remove('hidden');
            liveLoadMore.onclick = () => {
                const nextBatch = nonPinned.slice(liveDisplayedCount, liveDisplayedCount + LIVE_PAGE_SIZE);
                nextBatch.forEach(u => {
                    timeline.appendChild(renderLiveUpdateCard(u, false));
                });
                liveDisplayedCount += nextBatch.length;
                if (liveDisplayedCount >= nonPinned.length) liveLoadMore.classList.add('hidden');
            };
        } else {
            liveLoadMore.classList.add('hidden');
        }

        // Stats
        document.getElementById('live-update-count').textContent = data.updates.length;
        document.getElementById('live-last-time').textContent = data.updates[0]?.time || '--';

        // Sidebar: other live stories
        const sidebar = document.getElementById('live-sidebar-stories');
        sidebar.innerHTML = '';
        (window.LiveUpdatesData || []).filter(d => d.slug !== slug).forEach(d => {
            const link = document.createElement('a');
            link.href = `#/live/${d.slug}`;
            link.className = 'group block';
            link.innerHTML = `
                <div class="flex items-center gap-2 mb-1">
                    ${d.isLive ? '<span class="w-1.5 h-1.5 bg-red-600 live-dot inline-block"></span><span class="text-[9px] font-bold text-red-600 uppercase">Live</span>' : '<span class="text-[9px] font-bold text-slate-400 uppercase">Ended</span>'}
                </div>
                <h4 class="text-sm font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">${d.title}</h4>
                <p class="text-[10px] text-slate-400 font-medium mt-1 uppercase">${d.startDate} • ${d.updates.length} updates</p>`;
            sidebar.appendChild(link);
        });

        // Auto-scroll toggle
        liveAutoScroll = false;
        const autoBtn = document.getElementById('live-auto-scroll-btn');
        if (autoBtn) {
            autoBtn.onclick = () => {
                liveAutoScroll = !liveAutoScroll;
                autoBtn.innerHTML = liveAutoScroll
                    ? '<span class="material-symbols-outlined text-sm">vertical_align_top</span> Manual scroll'
                    : '<span class="material-symbols-outlined text-sm">vertical_align_bottom</span> Auto-scroll';
            };
        }

        // Refresh button
        const refreshBtn = document.getElementById('live-refresh-btn');
        if (refreshBtn) {
            refreshBtn.onclick = () => { renderLiveUpdatesPage(slug); };
        }

        // Simulate real-time updates from pendingUpdates queue
        if (liveAutoUpdateTimer) clearInterval(liveAutoUpdateTimer);
        if (data.pendingUpdates && data.pendingUpdates.length > 0 && data.isLive) {
            let pendingIdx = 0;
            liveAutoUpdateTimer = setInterval(() => {
                if (pendingIdx >= data.pendingUpdates.length) {
                    clearInterval(liveAutoUpdateTimer);
                    liveAutoUpdateTimer = null;
                    return;
                }
                const newUpdate = data.pendingUpdates[pendingIdx];
                pendingIdx++;
                // Add to front of timeline
                const card = renderLiveUpdateCard(newUpdate, true);
                timeline.insertBefore(card, timeline.firstChild);
                // Update stats
                data.updates.unshift(newUpdate);
                document.getElementById('live-update-count').textContent = data.updates.length;
                document.getElementById('live-last-time').textContent = newUpdate.time;
                // Auto-scroll to top if enabled
                if (liveAutoScroll) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 15000); // New update every 15 seconds
        }
    }

    // ══════════════════════════════════════
    const homeLoadMore = document.getElementById('home-load-more');
    const homeMoreStories = document.getElementById('home-more-stories');
    let homeDisplayed = 0;
    const HOME_PAGE_SIZE = 6;
    // IDs already visible in the hardcoded Latest Updates section
    const excludedHomeIds = new Set([1, 2, 4, 10]);
    const homeStories = window.NewsData ? window.NewsData.filter(i => !excludedHomeIds.has(i.id)) : [];

    // ── Reliable Home Navigation ──
    function navigateHome() {
        // Force-clear all article state
        loadedArticleIds.clear();
        scrollSpyObserver.disconnect();
        infiniteScrollObserver.disconnect();
        currentHashProgrammaticallyChanged = false;

        // Reset the home "load more" dynamic stories
        if (homeMoreStories) homeMoreStories.innerHTML = '';
        homeDisplayed = 0;
        if (homeLoadMore) homeLoadMore.classList.remove('hidden');
        loadMoreHomeStories(); // Re-populate the first 6 dynamic stories so 10 total are visible

        // Set hash and show home
        if (window.location.hash !== '#/home') {
            window.location.hash = '#/home';
        } else {
            // Already on #/home — force show home view anyway
            showView('home');
            updateNavActiveState('#/home');
        }
        window.scrollTo({ top: 0, behavior: 'auto' });

        // Close mobile menu if open
        if (typeof closeMobileMenu === 'function') closeMobileMenu();
    }

    // Wire up ALL home-bound links (logo + nav + mobile + dropdowns)
    document.querySelectorAll('a[href="#/home"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateHome();
        });
    });

    function getShortDescription(htmlContent) {
        const tmp = document.createElement('div');
        tmp.innerHTML = htmlContent;
        const firstP = tmp.querySelector('p');
        if (firstP) {
            const text = firstP.textContent.trim();
            return text.length > 150 ? text.slice(0, 150) + '…' : text;
        }
        return '';
    }

    function loadMoreHomeStories() {
        const batch = homeStories.slice(homeDisplayed, homeDisplayed + HOME_PAGE_SIZE);
        batch.forEach(a => {
            const desc = getShortDescription(a.content);
            const article = document.createElement('article');
            article.className = 'group pb-6 border-b border-slate-100 flex gap-6 cursor-pointer relative animate-fadeIn';
            article.innerHTML = `
                <a href="#/article/${a.id}" class="absolute inset-0 z-10"><span class="sr-only">Read Article</span></a>
                <div class="flex-grow">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-[10px] font-bold text-primary uppercase tracking-widest">${a.tag}</span>
                        <span class="w-1 h-1 bg-slate-300"></span>
                        <span class="text-[10px] text-slate-400 font-medium uppercase">${a.date}</span>
                    </div>
                    <h3 class="text-lg font-bold headline-font group-hover:text-primary transition-colors mb-2">${a.title}</h3>
                    <p class="text-sm text-slate-600 leading-relaxed line-clamp-2">${desc}</p>
                </div>
                <div class="w-32 h-20 overflow-hidden flex-shrink-0">
                    <img class="w-full h-full object-cover" src="${a.image}" alt="${a.title}"/>
                </div>`;
            homeMoreStories.appendChild(article);
        });
        homeDisplayed += batch.length;
        // Hide button when all stories shown
        if (homeDisplayed >= homeStories.length && homeLoadMore) {
            homeLoadMore.classList.add('hidden');
        }
    }

    if (homeLoadMore) {
        homeLoadMore.addEventListener('click', loadMoreHomeStories);
        // Auto-load first batch so homepage shows 10 posts total (4 hardcoded + 6 dynamic)
        loadMoreHomeStories();
    }
    // ── Mobile Menu Toggle (Premium Hamburger ↔ X morph) ──
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOverlay = document.getElementById('mobile-menu-overlay');

    // Wire ripple position tracking for all mob-icon-btns
    document.querySelectorAll('.mob-icon-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
            const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
            btn.style.setProperty('--ripple-x', x + '%');
            btn.style.setProperty('--ripple-y', y + '%');
        });
    });

    function closeMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('is-open');
        if (menuOverlay) menuOverlay.classList.remove('is-open');
        if (mobileMenuBtn) mobileMenuBtn.classList.remove('is-active');
    }

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('is-open');
            if (menuOverlay) menuOverlay.classList.toggle('is-open', isOpen);
            mobileMenuBtn.classList.toggle('is-active', isOpen);
        });

        if (menuOverlay) {
            menuOverlay.addEventListener('click', closeMobileMenu);
        }
    }

    // ── Mobile Accordion ──
    document.querySelectorAll('.mob-accordion').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.nextElementSibling;
            const arrow = btn.querySelector('.mob-arrow');
            const isCurrentlyOpen = panel.classList.contains('is-open');

            // Close all other panels (single-open accordion)
            document.querySelectorAll('.mob-panel').forEach(p => {
                p.classList.remove('is-open');
                p.previousElementSibling?.querySelector('.mob-arrow')?.style.setProperty('transform', 'rotate(0deg)');
            });

            // Toggle current
            if (!isCurrentlyOpen) {
                panel.classList.add('is-open');
                if (arrow) arrow.style.transform = 'rotate(180deg)';
            }
        });
    });

    // ── Lazy load all images ──
    document.querySelectorAll('img:not([loading])').forEach(img => { img.loading = 'lazy'; });
    // Also catch dynamically added images
    new MutationObserver(mutations => {
        mutations.forEach(m => m.addedNodes.forEach(n => {
            if (n.nodeType === 1) {
                if (n.tagName === 'IMG' && !n.loading) n.loading = 'lazy';
                n.querySelectorAll?.('img:not([loading])').forEach(img => { img.loading = 'lazy'; });
            }
        }));
    }).observe(document.body, { childList: true, subtree: true });

    // ── Close mobile menu on navigation ──
    window.addEventListener('hashchange', () => {
        if (typeof closeMobileMenu === 'function') closeMobileMenu();
    });

    // ── Share Dropdown Toggle Logic ──
    document.addEventListener('click', (e) => {
        const shareBtn = e.target.closest('.share-btn');
        if (shareBtn) {
            e.preventDefault();
            const wrapper = shareBtn.closest('.share-wrapper');
            const dropdown = wrapper.querySelector('.share-dropdown');
            const isOpen = dropdown.classList.contains('opacity-100');
            
            // Close any currently open dropdowns
            document.querySelectorAll('.share-dropdown.opacity-100').forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
                    d.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
                }
            });

            if (!isOpen) {
                dropdown.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
                dropdown.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
            } else {
                dropdown.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
                dropdown.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
            }
            return;
        }
        
        // Close if clicking outside or on an option
        if (!e.target.closest('.share-dropdown') || e.target.closest('button')) {
            document.querySelectorAll('.share-dropdown.opacity-100').forEach(d => {
                d.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
                d.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
            });
        }
    });

    initSearch();
    initScrollers();
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
});
