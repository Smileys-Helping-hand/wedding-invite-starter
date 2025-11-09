import { toPng } from 'html-to-image';

const buildOptions = (element, { width, height, scale = 2 } = {}) => {
  const bounds = element.getBoundingClientRect();
  return {
    cacheBust: true,
    backgroundColor: '#f8f6f2',
    width: width ?? bounds.width,
    height: height ?? bounds.height,
    pixelRatio: scale,
  };
};

export const exportInviteImage = async (
  element,
  { fileName = 'invite-card.png', width, height, scale } = {}
) => {
  if (!element) throw new Error('No element supplied for export.');
  const dataUrl = await toPng(element, buildOptions(element, { width, height, scale }));
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
  return dataUrl;
};

export const exportInviteVariants = async (
  element,
  baseFileName = 'raziaraaziq-invite'
) => {
  const square = await exportInviteImage(element, {
    fileName: `${baseFileName}-square.png`,
    width: 1080,
    height: 1080,
    scale: 2,
  });

  const story = await exportInviteImage(element, {
    fileName: `${baseFileName}-story.png`,
    width: 1080,
    height: 1920,
    scale: 2,
  });

  return { square, story };
};

export default exportInviteImage;
