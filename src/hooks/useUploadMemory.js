import { useCallback, useMemo, useState } from 'react';

import { useFirebase } from '../providers/FirebaseProvider.jsx';

const MAX_FILE_SIZE = 3 * 1024 * 1024;

export const useUploadMemory = () => {
  const { addMemory, uploadMemoryImage } = useFirebase();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const canUpload = useMemo(
    () => Boolean(addMemory && uploadMemoryImage),
    [addMemory, uploadMemoryImage]
  );

  const upload = useCallback(
    async ({ name, message, file }) => {
      if (!canUpload) {
        throw new Error('Uploads unavailable offline.');
      }

      if (!name?.trim()) {
        throw new Error('Please include your name.');
      }

      if (!file) {
        throw new Error('Please select an image.');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Images must be smaller than 3MB.');
      }

      setIsUploading(true);
      setProgress(5);
      setError(null);

      try {
        const { url, path } = await uploadMemoryImage(file);
        setProgress(70);

        await addMemory({
          name: name.trim(),
          message: message?.slice(0, 200) ?? '',
          imageUrl: url,
          storagePath: path,
        });

        setProgress(100);
        return { imageUrl: url };
      } catch (err) {
        setError(err.message ?? 'Upload failed');
        throw err;
      } finally {
        setTimeout(() => setProgress(0), 900);
        setIsUploading(false);
      }
    },
    [addMemory, uploadMemoryImage, canUpload]
  );

  return {
    upload,
    isUploading,
    progress,
    error,
  };
};

export default useUploadMemory;
