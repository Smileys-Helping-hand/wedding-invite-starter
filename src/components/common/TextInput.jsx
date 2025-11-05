import clsx from 'clsx';
import './TextInput.css';

const TextInput = ({ label, hint, error, className, as = 'input', ...props }) => {
  const FieldTag = as === 'textarea' ? 'textarea' : 'input';
  return (
    <label className={clsx('text-input', className)}>
      {label && <span className="text-input__label">{label}</span>}
      <FieldTag className={clsx('text-input__field', { 'text-input__field--textarea': FieldTag === 'textarea' })} {...props} />
      {hint && !error && <span className="text-input__hint">{hint}</span>}
      {error && <span className="text-input__error">{error}</span>}
    </label>
  );
};

export default TextInput;
