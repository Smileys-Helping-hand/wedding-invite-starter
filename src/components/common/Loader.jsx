import './Loader.css';

const Loader = ({ label = 'Loading' }) => (
  <div className="loader" role="status">
    <div className="loader__ring" />
    <span className="loader__label">{label}</span>
  </div>
);

export default Loader;
