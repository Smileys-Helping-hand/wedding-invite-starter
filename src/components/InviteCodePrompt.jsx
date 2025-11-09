import './InviteCodePrompt.css';

const InviteCodePrompt = ({ code, setCode, handleSubmit, error }) => {
  return (
    <form onSubmit={handleSubmit} className="invite-prompt-card" aria-label="Enter invite code">
      <label
        htmlFor="inviteCode"
        className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-2"
      >
        Invite Code
      </label>
      <input
        id="inviteCode"
        type="text"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        className="w-72 px-4 py-3 border border-gray-300 rounded-md text-center tracking-wide focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
        placeholder="Enter your personal code"
        aria-required="true"
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <button
        type="submit"
        className="mt-5 bg-gradient-to-b from-[#f7d889] to-[#d4af37] text-white font-semibold tracking-wide py-2 px-8 rounded-full hover:opacity-90 transition-all"
      >
        Unlock Invitation
      </button>
    </form>
  );
};

export default InviteCodePrompt;
