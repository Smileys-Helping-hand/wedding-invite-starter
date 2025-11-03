import clsx from 'clsx';
import './Button.css';

const Button = ({ children, variant = 'primary', size = 'md', icon, loading = false, ...props }) => {
  const { disabled: disabledProp, ...rest } = props;
  const disabled = loading || disabledProp;

  return (
    <button className={clsx('ui-button', `ui-button--${variant}`, `ui-button--${size}`)} disabled={disabled} {...rest}>
      {loading && <span className="ui-button__spinner" aria-hidden="true" />}
      {icon && <span className="ui-button__icon" aria-hidden="true">{icon}</span>}
      <span className="ui-button__label">{children}</span>
    </button>
  );
};

export default Button;
