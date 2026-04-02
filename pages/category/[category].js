export default function CategoryPage({ category }) {
  return (
    <div>
      <h1>Category: {category}</h1>
      <p>SSR Enabled Category Page specifically implemented for Vercel</p>
    </div>
  );
}

// Ensure SSR (Server Side Rendering) for Category pages
export async function getServerSideProps(context) {
  const { category } = context.params;

  return {
    props: {
      category
    }
  };
}
