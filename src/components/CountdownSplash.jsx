import { motion, AnimatePresence } from 'framer-motion';

import { useCountdown } from '../hooks/useCountdown.js';
import Button from './common/Button.jsx';
import { EVENT_DATE_GREGORIAN } from '../utils/constants.js';
import './CountdownSplash.css';

const CountdownSplash = ({ open, onContinue }) => {
  const countdown = useCountdown(EVENT_DATE_GREGORIAN);

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          className="countdown-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="countdown-splash__panel">
            <h2>Counting down to the soirée</h2>
            <p>
              May Allah bless the union of Razia &amp; Abduraziq with endless barakah.
            </p>
            <div className="countdown-splash__timer">
              {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
                <div key={unit} className="countdown-splash__pill">
                  <span>{String(countdown[unit]).padStart(2, '0')}</span>
                  <small>{unit}</small>
                </div>
              ))}
            </div>
            <Button variant="primary" size="lg" onClick={onContinue}>
              Enter Invitation
            </Button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default CountdownSplash;
