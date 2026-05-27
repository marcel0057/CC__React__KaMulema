import { FiStar } from 'react-icons/fi';

const StarRating = ({
  value = 0,
  outOf = 5,
  onChange,
  size = '1rem',
  readonly = false
}) => {
  const current = Number(value || 0);

  return (
    <div className="star-rating">
      {Array.from({ length: outOf }).map((_, index) => {
        const starValue = index + 1;
        const filled = starValue <= Math.round(current);

        return (
          <button
            key={starValue}
            type="button"
            className={`star-button ${filled ? 'filled' : ''}`}
            style={{ fontSize: size }}
            onClick={() => !readonly && onChange?.(starValue)}
            disabled={readonly}
          >
            <FiStar />
          </button>
        );
      })}
      <span className="star-text">{current.toFixed ? current.toFixed(1) : current}</span>
    </div>
  );
};

export default StarRating;
