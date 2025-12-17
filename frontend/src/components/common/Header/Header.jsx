import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Menu,
  X,
  UserCircle,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // ✅ FIXED: Safe categories fetch
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories', 'header'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = Array.isArray(categoriesResponse?.data)
    ? categoriesResponse.data
    : [];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      setIsProfileMenuOpen(false);
    } catch {
      toast.error('Logout failed');
    }
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/blog', label: 'Blog' },
    { path: '/categories', label: 'Categories' },
    { path: '/tags', label: 'Tags' },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
            <span className="text-blue-600 dark:text-blue-400">Blog</span>CMS
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium ${
                  isActive(link.path)
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Categories Dropdown */}
            <div className="relative group">
              <button className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                More
                <svg className="ml-1 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="absolute mt-2 w-48 bg-white dark:bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible">
                {categories.slice(0, 5).map(category => (
                  <Link
                    key={category._id}
                    to={`/categories/${category.slug}`}
                    className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme}>
              {theme === 'dark' ? <Sun /> : <Moon />}
            </button>

            {user ? (
              <div className="relative">
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                  {user.avatar ? (
                    <img src={user.avatar} className="h-8 w-8 rounded-full" />
                  ) : (
                    <UserCircle className="h-8 w-8" />
                  )}
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded shadow">
                    <Link to="/profile" className="block px-4 py-2">Profile</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="block px-4 py-2">Admin</Link>
                    )}
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login">Login</Link>
            )}

            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
