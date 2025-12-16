import { Link } from 'react-router-dom';

const TagCloud = ({ tags = [] }) => {
  // Generate random font sizes based on popularity or index
  const getTagSize = (index) => {
    const sizes = [
      'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'
    ];
    return sizes[index % sizes.length];
  };

  const getTagColor = (index) => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800',
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800',
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800',
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-800',
    ];
    return colors[index % colors.length];
  };

  if (tags.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No tags available
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {tags.map((tag, index) => (
        <Link
          key={tag._id || tag.name || index}
          to={`/tags/${tag.slug || tag.name}`}
          className={`inline-block px-3 py-2 rounded-full font-medium transition-all duration-200 hover:scale-105 ${getTagSize(index)} ${getTagColor(index)}`}
          style={{
            animationDelay: `${index * 0.1}s`,
          }}
        >
          {tag.name}
          {tag.postsCount && (
            <span className="ml-1 text-xs opacity-75">
              ({tag.postsCount})
            </span>
          )}
        </Link>
      ))}
    </div>
  );
};

export default TagCloud;