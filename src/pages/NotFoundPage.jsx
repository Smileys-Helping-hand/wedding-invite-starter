import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import Button from '../components/common/Button.jsx';
import './NotFoundPage.css';

const NotFoundPage = () => (
  <div className="page-panel not-found">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9 }}
    >
      <span className="badge">404</span>
      <h1 className="page-title">Lost in the Garden</h1>
      <p className="page-subtitle">
        The page you seek has drifted behind silken curtains.
      </p>
      <Link to="/">
        <Button variant="primary" size="lg">
          Return Home
        </Button>
      </Link>
    </motion.div>
  </div>
);

export default NotFoundPage;
