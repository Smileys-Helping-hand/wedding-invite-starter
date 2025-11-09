import MemoryCard from './MemoryCard.jsx';
import './MemoryWall.css';

const MemoryGrid = ({ memories }) => {
  if (!memories?.length) {
    return (
      <div className="memory-grid__empty">
        <p>No shared memories yet. Be the first to leave a heartfelt message.</p>
      </div>
    );
  }

  return (
    <div className="memory-grid">
      {memories.map((memory, index) => (
        <MemoryCard key={memory.id ?? index} memory={memory} index={index} />
      ))}
    </div>
  );
};

export default MemoryGrid;
