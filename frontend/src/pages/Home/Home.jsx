import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import PostCard from '../../components/blog/PostCard/PostCard';

const Home = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  // 🔹 Featured posts
  const { data: featuredRes, isLoading: loadingFeatured } = useQuery({
    queryKey: ['posts', 'featured'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/posts?featured=true&limit=3`);
      if (!res.ok) throw new Error('Failed to load featured posts');
      return res.json();
    },
  });

  // 🔹 Latest posts
  const { data: latestRes, isLoading: loadingLatest } = useQuery({
    queryKey: ['posts', 'latest'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/posts?limit=6&sort=-createdAt`);
      if (!res.ok) throw new Error('Failed to load latest posts');
      return res.json();
    },
  });

  // 🔹 Most viewed posts
  const { data: popularRes, isLoading: loadingPopular } = useQuery({
    queryKey: ['posts', 'popular'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/posts?limit=4&sort=-views`);
      if (!res.ok) throw new Error('Failed to load popular posts');
      return res.json();
    },
  });

  // ✅ SAFE DATA NORMALIZATION (CRITICAL FIX)
  const featuredPosts = Array.isArray(featuredRes?.data)
    ? featuredRes.data
    : featuredRes?.data?.posts ?? [];

  const latestPosts = Array.isArray(latestRes?.data)
    ? latestRes.data
    : latestRes?.data?.posts ?? [];

  const popularPosts = Array.isArray(popularRes?.data)
    ? popularRes.data
    : popularRes?.data?.posts ?? [];

  // 🔄 Loading state
  if (loadingFeatured || loadingLatest || loadingPopular) {
    return <LoadingSpinner />;
  }

  return (
    <main className="container mx-auto px-4 py-10 space-y-16">

      {/* 🔥 FEATURED POSTS */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Featured Posts</h2>

        {featuredPosts.length === 0 ? (
          <p className="text-gray-500">No featured posts available.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {featuredPosts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* 🆕 LATEST POSTS */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Latest Posts</h2>
          <Link to="/blog" className="text-blue-600 hover:underline">
            View All
          </Link>
        </div>

        {latestPosts.length === 0 ? (
          <p className="text-gray-500">No posts found.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {latestPosts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* 🔥 MOST POPULAR */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Most Popular</h2>

        {popularPosts.length === 0 ? (
          <p className="text-gray-500">No popular posts yet.</p>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {popularPosts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </section>

    </main>
  );
};

export default Home;
