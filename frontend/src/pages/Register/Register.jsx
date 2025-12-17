import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../components/context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { username:'', email:'', password:'', confirmPassword:'', firstName:'', lastName:'', bio:'' }
  });

  const password = watch('password');

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...userData } = data;
      await registerUser(userData);
      toast.success('Account created successfully!');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">Create your account</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <input {...register('username', { required: 'Username required' })} placeholder="Username" className="px-3 py-3 border rounded-lg" />
            <input {...register('email', { required: 'Email required' })} placeholder="Email" className="px-3 py-3 border rounded-lg" />
            <input {...register('firstName')} placeholder="First Name" className="px-3 py-3 border rounded-lg" />
            <input {...register('lastName')} placeholder="Last Name" className="px-3 py-3 border rounded-lg" />
          </div>
          <textarea {...register('bio')} placeholder="Bio" className="w-full px-3 py-3 border rounded-lg" />
          <div className="relative">
            <input {...register('password', { required: 'Password required' })} type={showPassword ? 'text':'password'} placeholder="Password" className="w-full px-3 py-3 border rounded-lg" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          <div className="relative">
            <input {...register('confirmPassword', { validate: val => val === password || 'Passwords do not match' })} type={showConfirmPassword ? 'text':'password'} placeholder="Confirm Password" className="w-full px-3 py-3 border rounded-lg" />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-400">
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
