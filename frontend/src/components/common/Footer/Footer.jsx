import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const Footer = () => {
  // ✅ FIXED settings
  const { data: settingsResponse } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/settings`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  const settings = settingsResponse?.data ?? {};

  // ✅ FIXED categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  const categories = Array.isArray(categoriesResponse?.data)
    ? categoriesResponse.data
    : [];

  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">

          <div className="md:col-span-2">
            <Link to="/" className="text-2xl font-bold">
              <span className="text-blue-400">Blog</span>CMS
            </Link>
            <p className="text-gray-400 mt-4 max-w-md">
              {settings.siteDescription || 'Modern Blog CMS built with MERN stack'}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/categories">Categories</Link></li>
              <li><Link to="/tags">Tags</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Categories</h3>
            <ul className="space-y-2 text-gray-400">
              {categories.slice(0, 5).map(cat => (
                <li key={cat._id}>
                  <Link to={`/categories/${cat.slug}`}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          © {year} {settings.siteTitle || 'Blog CMS'}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
