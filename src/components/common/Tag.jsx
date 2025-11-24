import './Tag.css';

const toneClass = {
  success: 'tag--success',
  warning: 'tag--warning',
  neutral: 'tag--neutral',
  info: 'tag--info',
};

const Tag = ({ children, tone = 'info' }) => (
  <span className={`tag ${toneClass[tone] ?? ''}`}>{children}</span>
);

export default Tag;
