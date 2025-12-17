import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Send } from 'lucide-react';
import { useAuth } from '../../components/context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user]);

  // Function to resend verification email
  const resendVerificationEmail = async () => {
    setIsResending(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Verification email sent! Please check your inbox.');
        setShowResendButton(false);
      } else {
        toast.error(data.message || 'Failed to resend verification email.');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setShowResendButton(false); // Reset on new login attempt
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      const errorMessage = error.message || 'Login failed.';
      
      // Handle specific error cases
      if (errorMessage.includes('Email not verified') || errorMessage.includes('verify your email')) {
        setPendingEmail(data.email);
        setShowResendButton(true);
        toast.error('Please verify your email address before logging in.');
      } else if (errorMessage.includes('Invalid credentials')) {
        toast.error('Invalid email or password. Please try again.');
      } else if (errorMessage.includes('Account is locked')) {
        toast.error('Your account is temporarily locked. Please try again later.');
      } else if (errorMessage.includes('Account is not active')) {
        toast.error('Your account is not active. Please contact support.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">Sign in to your account</h2>
        
        {/* Email Verification Notice */}
        {showResendButton && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Email Verification Required
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Please verify your email address before logging in. Check your inbox for the verification email.
                </p>
                <div className="mt-3 flex items-center space-x-3">
                  <button
                    onClick={resendVerificationEmail}
                    disabled={isResending}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-800/20 hover:bg-yellow-200 dark:hover:bg-yellow-800/30 rounded-md transition-colors disabled:opacity-50"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {isResending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                  <Link 
                    to="/register" 
                    className="text-xs text-yellow-700 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
                  >
                    Use different email
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
                type="email"
                placeholder="Enter your email"
                className="pl-10 w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="pl-10 pr-10 w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading || isResending}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner size="small" className="mr-2" />
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;