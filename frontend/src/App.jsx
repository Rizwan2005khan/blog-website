import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './components/context/AuthContext'
import { Toaster } from 'react-hot-toast'

// Layout Components
import Layout from './components/common/Layout'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Page Components
import Home from './pages/Home'
import Blog from './pages/Blog'
import Post from './pages/Post'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Categories from './pages/categories/Categories'
import Tags from './pages/Tags/Tags'
import NotFound from './pages/NotFound/NotFound'

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard/AdminDashboard'
import ManagePosts from './pages/Admin/ManagePosts/ManagePosts'
import ManageUsers from './pages/Admin/ManageUsers/ManageUsers'
import ManageCategories from './pages/Admin/ManageCategories/ManageCategories'
import CommentModeration from './pages/Admin/CommentModeration/CommentModeration'
import NewsletterAdmin from './pages/Admin/Newsletter/NewsletterAdmin'
import AnalyticsDashboard from './pages/Admin/Analytics/AnalyticsDashboard'
import SiteSettings from './pages/Admin/SiteSettings/SiteSettings'
import BackupRestore from './pages/Admin/BackupRestore/BackupRestore'
import MonitoringDashboard from './pages/Admin/Monitoring/MonitoringDashboard'
import APIDocumentation from './pages/Admin/APIDocumentation/APIDocumentation'

// Global Styles
// import './styles/global.css'
// import './styles/animations.css'
// import './styles/components.css'
// import './styles/utilities.css'

function App() {
  const { user } = useAuth()
  const location = useLocation()

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location])

  // Set page title and meta tags
  useEffect(() => {
    const pageTitles = {
      '/': 'Home - Blog CMS',
      '/blog': 'Blog - Blog CMS',
      '/categories': 'Categories - Blog CMS',
      '/tags': 'Tags - Blog CMS',
      '/login': 'Login - Blog CMS',
      '/register': 'Register - Blog CMS',
      '/profile': 'Profile - Blog CMS',
      '/admin': 'Admin Dashboard - Blog CMS',
      '/admin/posts': 'Manage Posts - Blog CMS',
      '/admin/users': 'Manage Users - Blog CMS',
      '/admin/categories': 'Manage Categories - Blog CMS',
      '/admin/comments': 'Comment Moderation - Blog CMS',
      '/admin/newsletter': 'Newsletter - Blog CMS',
      '/admin/analytics': 'Analytics - Blog CMS',
      '/admin/settings': 'Site Settings - Blog CMS',
      '/admin/backup': 'Backup & Restore - Blog CMS',
      '/admin/monitoring': 'Monitoring - Blog CMS',
      '/admin/api-docs': 'API Documentation - Blog CMS',
    }

    const defaultTitle = 'Blog CMS - Modern Blogging Platform'
    const currentTitle = pageTitles[location.pathname] || defaultTitle
    
    document.title = currentTitle
    
    // Update meta tags
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.content = 'A modern, full-featured blog content management system built with React and Node.js'
    }
  }, [location])

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="blog" element={<Blog />} />
          <Route path="post/:slug" element={<Post />} />
          <Route path="categories" element={<Categories />} />
          <Route path="tags" element={<Tags />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="posts" element={<ManagePosts />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="categories" element={<ManageCategories />} />
          <Route path="comments" element={<CommentModeration />} />
          <Route path="newsletter" element={<NewsletterAdmin />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="settings" element={<SiteSettings />} />
          <Route path="backup" element={<BackupRestore />} />
          <Route path="monitoring" element={<MonitoringDashboard />} />
          <Route path="api-docs" element={<APIDocumentation />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App