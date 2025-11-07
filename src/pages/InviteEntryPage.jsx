import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import Loader from "../components/common/Loader.jsx";
import InviteCodePrompt from "../components/InviteCodePrompt.jsx";
import EnvelopeStage from "../components/experience/EnvelopeStage.jsx";
import { useGuest } from "../providers/GuestProvider.jsx";
import "./InviteEntryPage.css";

const InviteEntryPage = () => {
  const navigate = useNavigate();
  const { lookupGuest, error, loading } = useGuest();

  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");
  const [showEnvelope, setShowEnvelope] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (!code.trim()) {
      setLocalError("Please enter your invite code");
      return;
    }

    const guestData = await lookupGuest(code);
    if (guestData) {
      // Trigger wax seal animation
      setShowEnvelope(true);

      // Redirect after animation completes (6 s)
      setTimeout(() => {
        navigate("/invite");
      }, 6000);
    } else {
      setLocalError("Invalid invite code");
    }
  };

  if (loading) return <Loader />;

  return (
    <motion.div
      className="invite-entry-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {showEnvelope ? (
        <EnvelopeStage />
      ) : (
        <InviteCodePrompt
          code={code}
          setCode={setCode}
          onSubmit={handleSubmit}
          error={localError || error}
        />
      )}
    </motion.div>
  );
};

export default InviteEntryPage;
