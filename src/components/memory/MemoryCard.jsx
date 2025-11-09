import { motion } from 'framer-motion';
import './MemoryWall.css';

const formatTimestamp = (value) => {
  if (!value) return '';
  try {
    const date = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
    return date.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (err) {
    return '';
  }
};

const MemoryCard = ({ memory, index }) => {
  return (
    <motion.article
      className="memory-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: 'easeOut' }}
    >
      <div className="memory-card__image">
        <img
          src={memory.imageUrl}
          alt={`Memory shared by ${memory.name}`}
          loading="lazy"
        />
      </div>
      <div className="memory-card__body">
        <h4 className="memory-card__name">{memory.name}</h4>
        {memory.message && <p className="memory-card__message">{memory.message}</p>}
        <span className="memory-card__timestamp">
          {formatTimestamp(memory.timestamp)}
        </span>
      </div>
    </motion.article>
  );
};

export default MemoryCard;
