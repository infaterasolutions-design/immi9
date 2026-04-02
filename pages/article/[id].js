import Head from 'next/head';
import Link from 'next/link';
import { NewsData } from '../../data';

export default function ArticlePage({ article, relatedArticles }) {
  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500 text-lg">Article not found.</p>
      </div>
    );
  }

  const location = article.location || 'Washington, D.C.';
  const time = article.time || '10:00 AM EDT';

  return (
    <>
      <Head>
        <title>{article.title} | The Digital Diplomat</title>
        <meta name="description" content={article.title} />
        <meta property="og:title" content={article.title} />
        <meta property="og:image" content={article.image} />
        <meta property="og:type" content="article" />
      </Head>

      <div className="max-w-screen-lg mx-auto px-6 py-8">
        {/* Article Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
              {article.category?.replace(/-/g, ' ')}
            </span>
            <span className="w-1 h-1 bg-slate-300"></span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{article.tag}</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold headline-font text-slate-900 leading-tight mb-4">
            {article.title}
          </h1>
          <p className="text-sm text-slate-500">{location} • {article.date} at {time}</p>
        </div>

        {/* Hero Image */}
        <div className="mb-10">
          <img src={article.image} alt={article.title} className="w-full h-auto max-h-[500px] object-cover" />
        </div>

        {/* Article Body */}
        <div
          className="prose prose-slate prose-lg max-w-none mb-16"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="border-t border-slate-200 pt-10">
            <h2 className="text-xl font-bold headline-font text-slate-900 mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedArticles.map((related) => (
                <Link key={related.id} href={`/article/${related.id}`} className="group flex gap-4 pb-4 border-b border-slate-100">
                  <img src={related.image} alt="" className="w-28 h-20 object-cover shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{related.tag}</span>
                    <h3 className="text-base font-bold headline-font group-hover:text-primary transition-colors mt-1 line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{related.date}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params;
  const articleId = parseInt(id, 10);
  const article = NewsData.find(a => a.id === articleId) || null;

  if (!article) {
    return { notFound: true };
  }

  // ── Dynamic hybrid caching based on article age ──
  const publishDate = new Date(article.date);
  const now = new Date();
  const ageDays = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);

  if (ageDays > 3) {
    // Old article → SSG-like: cache at edge for 24 hours
    context.res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
  } else {
    // New article → SSR: re-render every 60 seconds
    context.res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=59');
  }

  // Find related articles from same category
  const relatedArticles = NewsData
    .filter(a => a.category === article.category && a.id !== article.id)
    .slice(0, 4)
    .map(({ content, ...rest }) => rest);

  return {
    props: {
      article,
      relatedArticles,
    },
  };
}
