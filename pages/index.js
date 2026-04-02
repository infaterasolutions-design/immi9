import Head from 'next/head';
import Link from 'next/link';
import { NewsData } from '../data';

export default function Home({ articles }) {
  const heroArticle = articles[0];
  const sideArticles = articles.slice(1, 4);
  const latestArticles = articles.slice(0, 10);

  return (
    <>
      <Head>
        <title>The Digital Diplomat | USA Immigration News</title>
        <meta name="description" content="Stay updated with the latest U.S. immigration news, visa guides, processing times, and policy changes. Expert analysis on H-1B, Green Card, F-1, and more." />
      </Head>

      <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-12">
        {/* ── Hero Section ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Hero Card */}
          <div className="lg:col-span-2 group relative">
            <Link href={`/article/${heroArticle.id}`} className="absolute inset-0 z-10">
              <span className="sr-only">Read Article</span>
            </Link>
            <div className="relative overflow-hidden">
              <img
                src={heroArticle.image}
                alt={heroArticle.title}
                className="w-full h-[400px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-2 block">{heroArticle.tag}</span>
                <h1 className="text-3xl lg:text-4xl font-bold text-white headline-font leading-tight mb-3">
                  {heroArticle.title}
                </h1>
                <p className="text-sm text-white/70">{heroArticle.date}</p>
              </div>
            </div>
          </div>

          {/* Side Cards */}
          <div className="flex flex-col gap-4">
            {sideArticles.map((article) => (
              <Link key={article.id} href={`/article/${article.id}`} className="group flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                <div className="flex-grow">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{article.tag}</span>
                  <h3 className="text-base font-bold headline-font group-hover:text-primary transition-colors mt-1 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{article.date}</p>
                </div>
                <img src={article.image} alt="" className="w-24 h-16 object-cover shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── Latest Updates Section ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold headline-font text-slate-900">Latest Updates</h2>
            <Link href="/category/visa-news" className="text-sm font-semibold text-primary hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-6">
            {latestArticles.map((article) => (
              <article key={article.id} className="group pb-6 border-b border-slate-100 flex gap-6 relative animate-fadeIn">
                <Link href={`/article/${article.id}`} className="absolute inset-0 z-10">
                  <span className="sr-only">Read Article</span>
                </Link>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{article.tag}</span>
                    <span className="w-1 h-1 bg-slate-300"></span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase">{article.date}</span>
                  </div>
                  <h3 className="text-lg font-bold headline-font group-hover:text-primary transition-colors mb-2">
                    {article.title}
                  </h3>
                </div>
                <div className="w-32 h-20 overflow-hidden flex-shrink-0">
                  <img className="w-full h-full object-cover" src={article.image} alt={article.title} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  // Set cache header for homepage: regenerate every 60s on Vercel edge
  context.res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=59');

  return {
    props: {
      articles: NewsData.map(({ content, ...rest }) => rest), // Strip heavy HTML content for homepage
    },
  };
}
