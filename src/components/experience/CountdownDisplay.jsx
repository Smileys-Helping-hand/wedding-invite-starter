import { motion } from 'framer-motion';
import { useCountdown } from '../../hooks/useCountdown.js';
import './CountdownDisplay.css';

const CountdownDisplay = () => {
  const { days, hours, minutes, seconds, isComplete } = useCountdown();

  const items = [
    { label: 'Days', value: days },
    { label: 'Hours', value: hours },
    { label: 'Minutes', value: minutes },
    { label: 'Seconds', value: seconds },
  ];

  if (isComplete) {
    return (
      <div className="countdown complete">
        <span className="countdown__label">The celebration has begun</span>
        <span className="countdown__value">Alhamdulillah</span>
      </div>
    );
  }

  return (
    <div className="countdown">
      {items.map(({ label, value }) => (
        <motion.div
          key={label}
          className="countdown__item"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="countdown__value">{String(value).padStart(2, '0')}</span>
          <span className="countdown__label">{label}</span>
        </motion.div>
      ))}
    </div>
  );
};

export default CountdownDisplay;
