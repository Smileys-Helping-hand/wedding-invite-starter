import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import useUploadMemory from '../../hooks/useUploadMemory.js';
import './MemoryWall.css';

const MemoryUploadModal = ({ open, onClose }) => {
  const dialogRef = useRef(null);
  const { upload, isUploading, progress, error } = useUploadMemory();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setSuccess(false);
      setFile(null);
      setTimeout(() => dialogRef.current?.focus(), 150);
    }
  }, [open]);

  const reset = () => {
    setName('');
    setMessage('');
    setFile(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;

    try {
      await upload({ name, message, file });
      setSuccess(true);
      reset();
      setTimeout(() => {
        onClose?.();
        setSuccess(false);
      }, 1200);
    } catch (err) {
      /* error handled in hook */
    }
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    if (nextFile) {
      setFile(nextFile);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="memory-modal__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="memory-modal"
            role="dialog"
            aria-modal="true"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              className="memory-modal__close"
              onClick={onClose}
              aria-label="Close upload form"
            >
              ×
            </button>
            <h3 className="memory-modal__title">Share a cherished moment</h3>
            <p className="memory-modal__subtitle">
              Upload a message and photo to bless the couple&apos;s memory wall.
            </p>
            <form className="memory-form" onSubmit={handleSubmit}>
              <label className="memory-form__field">
                <span>Your name</span>
                <input
                  ref={dialogRef}
                  type="text"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                />
              </label>
              <label className="memory-form__field">
                <span>Message</span>
                <textarea
                  value={message}
                  maxLength={200}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Write a heartfelt dua or memory (max 200 characters)"
                />
              </label>
              <label className="memory-form__field memory-form__file">
                <span>Upload image (jpg/png, ≤3MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleFileChange}
                />
              </label>
              {error && <p className="memory-form__error">{error}</p>}
              {success && (
                <p className="memory-form__success">
                  Thank you! Your memory has been sent for review.
                </p>
              )}
              <button
                type="submit"
                className="memory-form__submit"
                disabled={isUploading}
              >
                {isUploading ? `Uploading… ${progress}%` : 'Share Memory'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MemoryUploadModal;
