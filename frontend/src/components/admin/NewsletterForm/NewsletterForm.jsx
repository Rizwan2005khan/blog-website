import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const NewsletterForm = ({ newsletter, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      subject: newsletter?.subject || '',
      content: newsletter?.content || '',
      excerpt: newsletter?.excerpt || '',
      status: newsletter?.status || 'draft',
      scheduledFor: newsletter?.scheduledFor || '',
      recipientGroups: newsletter?.recipientGroups || ['all_subscribers']
    }
  });

  const watchedSubject = watch('subject');
  const watchedContent = watch('content');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Validate scheduled date if scheduling
      if (scheduleMode && data.scheduledFor) {
        const scheduledDate = new Date(data.scheduledFor);
        if (scheduledDate <= new Date()) {
          throw new Error('Scheduled date must be in the future');
        }
      }

      const url = newsletter 
        ? `${import.meta.env.VITE_API_URL}/newsletter/${newsletter._id}`
        : `${import.meta.env.VITE_API_URL}/newsletter`;
      
      const method = newsletter ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...data,
          status: scheduleMode ? 'scheduled' : data.status,
          scheduledFor: scheduleMode ? data.scheduledFor : null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save newsletter');
      }

      toast.success(newsletter ? 'Newsletter updated successfully!' : 'Newsletter created successfully!');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save newsletter');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
  };

  const handleScheduleToggle = () => {
    setScheduleMode(!scheduleMode);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {newsletter ? 'Edit Newsletter' : 'Create Newsletter'}
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePreview}
              className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {previewMode ? (
            <div className="p-6">
              <div className="max-w-2xl mx-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {watchedSubject || 'Untitled Newsletter'}
                </h1>
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: watchedContent || '<p>No content yet...</p>'
                  }}
                />
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
                  <p>You received this email because you subscribed to our newsletter.</p>
                  <p className="mt-2">
                    <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Unsubscribe</a> | 
                    <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Update Preferences</a>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject Line *
                </label>
                <input
                  {...register('subject', {
                    required: 'Subject is required',
                    maxLength: {
                      value: 200,
                      message: 'Subject must be less than 200 characters'
                    }
                  })}
                  type="text"
                  className={`block w-full px-4 py-3 border ${
                    errors.subject ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter newsletter subject"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.subject.message}
                  </p>
                )}
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Excerpt
                </label>
                <textarea
                  {...register('excerpt', {
                    maxLength: {
                      value: 300,
                      message: 'Excerpt must be less than 300 characters'
                    }
                  })}
                  rows="2"
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief summary of the newsletter content"
                />
                {errors.excerpt && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.excerpt.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This will appear in the email preview
                </p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  {...register('content', {
                    required: 'Content is required'
                  })}
                  rows="12"
                  className={`block w-full px-4 py-3 border ${
                    errors.content ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Write your newsletter content here..."
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.content.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  HTML is supported. Use basic HTML tags for formatting.
                </p>
              </div>

              {/* Recipient Groups */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient Groups
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      {...register('recipientGroups')}
                      type="checkbox"
                      value="all_subscribers"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      All Subscribers
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      {...register('recipientGroups')}
                      type="checkbox"
                      value="active_users"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Active Users Only
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      {...register('recipientGroups')}
                      type="checkbox"
                      value="premium_subscribers"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Premium Subscribers
                    </span>
                  </label>
                </div>
              </div>

              {/* Schedule Options */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Schedule Options
                  </h3>
                  <button
                    type="button"
                    onClick={handleScheduleToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      scheduleMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        scheduleMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {scheduleMode && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <ClockIcon className="h-4 w-4 inline mr-1" />
                        Schedule For
                      </label>
                      <input
                        {...register('scheduledFor')}
                        type="datetime-local"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Leave empty to send immediately
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="newsletter-form"
            disabled={isLoading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                {newsletter ? 'Update Newsletter' : 'Create Newsletter'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsletterForm;