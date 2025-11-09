import { motion } from 'framer-motion';

import TextInput from './common/TextInput.jsx';
import Button from './common/Button.jsx';
import './InviteCodePrompt.css';

const InviteCodePrompt = ({ code, onCodeChange, onSubmit, loading, error }) => {
  return (
    <form className="invite-code-prompt" onSubmit={onSubmit}>
      <span className="invite-code-prompt__divider" aria-hidden="true" />
      <TextInput
        label="Invite Code"
        placeholder="Enter your personal code"
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
        error={error}
        autoComplete="one-time-code"
      />
      <Button type="submit" variant="primary" size="lg" loading={loading}>
        Unlock Invitation
      </Button>
      <motion.div
        className="invite-code-prompt__glow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.4 }}
        aria-hidden="true"
      />
    </form>
  );
};

export default InviteCodePrompt;
