import Head from 'next/head';
import Link from 'next/link';
import { NewsData } from '../../data';

export default function CategoryPage({ category, subcategory, articles }) {
  const displayName = (subcategory || category).replace(/-/g, ' ');

  return (
    <>
      <Head>
        <title>{displayName} | The Digital Diplomat</title>
        <meta name="description" content={`Browse all ${displayName} articles — USA immigration updates, visa guides, and expert analysis.`} />
      </Head>

      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Category Header */}
        <div className="mb-8">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Category</p>
          <h1 className="text-3xl font-bold headline-font text-slate-900 capitalize">{displayName}</h1>
        </div>

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link key={article.id} href={`/article/${article.id}`} className="group">
                <div className="overflow-hidden mb-4">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{article.tag}</span>
                <h3 className="text-lg font-bold headline-font group-hover:text-primary transition-colors mt-1 mb-1 line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs text-slate-400">{article.date}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-[48px] text-slate-300 mb-3 block">folder_open</span>
            <p className="text-slate-500">No articles found in this category.</p>
          </div>
        )}
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const { category } = context.params;

  // category can be ['visa-news'] or ['visa-news', 'h1b-visa']
  const segments = Array.isArray(category) ? category : [category];
  const mainCategory = segments[0];
  const subcategory = segments[1] || null;

  context.res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=120');

  let articles = NewsData.filter(a => a.category === mainCategory);

  if (subcategory) {
    articles = articles.filter(a => a.subcategory === subcategory);
  }

  return {
    props: {
      category: mainCategory,
      subcategory,
      articles: articles.map(({ content, ...rest }) => rest),
    },
  };
}
