import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  MessageCircle,
  User,
  Trash2,
  Edit,
  X,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';

const CommentSection = ({ postId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments/post/${postId}`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          postId,
          content,
          parentId: replyTo,
        }),
      });
      if (!response.ok) throw new Error('Failed to add comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', postId]);
      queryClient.invalidateQueries(['post', postId]);
      setNewComment('');
      setReplyTo(null);
      toast.success('Comment added successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add comment');
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to update comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', postId]);
      setEditingComment(null);
      setEditContent('');
      toast.success('Comment updated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update comment');
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', postId]);
      queryClient.invalidateQueries(['post', postId]);
      toast.success('Comment deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete comment');
    },
  });

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    addCommentMutation.mutate(newComment.trim());
  };

  const handleUpdateComment = (commentId) => {
    if (!editContent.trim()) return;
    updateCommentMutation.mutate({ commentId, content: editContent.trim() });
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const startEditing = (comment) => {
    setEditingComment(comment._id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent('');
  };

  // Render comment tree
  const renderComment = (comment, depth = 0) => {
    const isEditing = editingComment === comment._id;
    const canEdit = user && (user._id === comment.author._id || user.role === 'admin');
    const canDelete = user && (user._id === comment.author._id || user.role === 'admin');

    return (
      <div key={comment._id} className={`${depth > 0 ? 'ml-8 mt-4' : 'mb-6'}`}>
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            {comment.author.avatar ? (
              <img
                src={comment.author.avatar}
                alt={comment.author.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {comment.author.username}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>

                {canEdit && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditing(comment)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateComment(comment._id)}
                      disabled={updateCommentMutation.isLoading}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors duration-200"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-800 dark:text-gray-200">{comment.content}</p>
              )}
            </div>

            {!isEditing && (
              <div className="mt-2">
                <button
                  onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {replyTo === comment._id ? 'Cancel Reply' : 'Reply'}
                </button>
              </div>
            )}

            {/* Reply Form */}
            {replyTo === comment._id && (
              <div className="mt-3 ml-4">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (newComment.trim()) {
                    addCommentMutation.mutate(newComment.trim());
                  }
                }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      type="submit"
                      disabled={addCommentMutation.isLoading}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Nested Comments */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4">
                {comment.replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <MessageCircle className="h-6 w-6 mr-2" />
        Comments ({comments.length})
      </h3>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-8">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? 'Write a comment...' : 'Please login to comment'}
          disabled={!user}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
          rows="4"
        />
        {user && (
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={addCommentMutation.isLoading || !newComment.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {addCommentMutation.isLoading ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        )}
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.filter(comment => !comment.parentId).map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;