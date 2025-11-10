import { motion } from 'framer-motion';
import './MemoryWallPlaceholder.css';

const MemoryWallPlaceholder = () => (
  <motion.section
    className="memory-wall"
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
  >
    <div className="memory-wall__content">
      <span className="badge">After the celebration</span>
      <h2 className="memory-wall__title text-script">Memory Wall &amp; Gallery</h2>
      <p>
        Relive the joy of the evening. Once the engagement concludes, this space will
        bloom with photographs, nasheed highlights, and heartfelt duas shared by family
        and friends.
      </p>
      <div className="memory-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="memory-tile">
            <span>Reserved for cherished moments</span>
          </div>
        ))}
      </div>
    </div>
  </motion.section>
);

export default MemoryWallPlaceholder;
