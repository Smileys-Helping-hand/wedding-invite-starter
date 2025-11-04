import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getAssetPath, getWaxSeal } from '../../utils/assetPaths.js';
import { useTheme } from '../../providers/ThemeProvider.jsx';
import { useAudio } from '../../providers/AudioProvider.jsx';
import './EnvelopeStage.css';

const EnvelopeStage = ({ onOpened, sealVariant = 'default' }) => {
  const { theme } = useTheme();
  const { startAudio } = useAudio();
  const [isPreMelt, setIsPreMelt] = useState(false);
  const [isMelting, setIsMelting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const openedRef = useRef(false);
  const preMeltTimeoutRef = useRef(null);
  const defaultEnvelope = getAssetPath('envelope');
  const defaultInvite = getAssetPath('inviteCard');
  const [envelopeSrc, setEnvelopeSrc] = useState(theme?.assets?.envelope ?? defaultEnvelope);
  const [inviteSrc, setInviteSrc] = useState(theme?.assets?.inviteCard ?? defaultInvite);
  const resolvedVariant = sealVariant ?? theme?.assets?.waxSealVariant ?? 'default';
  const [waxSrc, setWaxSrc] = useState(() => getWaxSeal(resolvedVariant, theme?.assets?.waxSeals ?? theme?.assets));
  const waxShape = theme?.toggles?.waxSealShape ?? 'round';
  const cardEdgeStyle = theme?.toggles?.cardEdgeStyle ?? 'rounded';
  const paperTextureEnabled = theme?.toggles?.paperTexture !== false;
  const foilIntensity = Math.min(
    Math.max(theme?.toggles?.foilSheenIntensity ?? theme?.toggles?.goldFoilIntensity ?? 0.6, 0),
    1
  );
  const dripShimmer = theme?.toggles?.dripShimmer ?? false;
  const vignetteEnabled = theme?.toggles?.vignetteEnabled !== false;

  useEffect(() => {
    if (!isMelting) return undefined;
    const timer = window.setTimeout(() => {
      setIsOpen(true);
      if (!openedRef.current) {
        openedRef.current = true;
        window.requestAnimationFrame(() => {
          onOpened?.();
        });
      }
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [isMelting, onOpened]);

  useEffect(() => {
    setEnvelopeSrc(theme?.assets?.envelope ?? defaultEnvelope);
  }, [theme?.assets?.envelope, defaultEnvelope]);

  useEffect(() => {
    setInviteSrc(theme?.assets?.inviteCard ?? defaultInvite);
  }, [theme?.assets?.inviteCard, defaultInvite]);

  useEffect(() => {
    const map = theme?.assets?.waxSeals ?? theme?.assets;
    setWaxSrc(getWaxSeal(resolvedVariant, map));
  }, [resolvedVariant, theme?.assets?.waxSeals, theme?.assets]);

  const handleClick = () => {
    if (isOpen || isMelting || isPreMelt) return;
    startAudio?.({ force: true });
    setIsPreMelt(true);
    preMeltTimeoutRef.current = window.setTimeout(() => {
      setIsMelting(true);
      setIsPreMelt(false);
      preMeltTimeoutRef.current = null;
    }, 200);
  };

  useEffect(
    () => () => {
      if (preMeltTimeoutRef.current) {
        window.clearTimeout(preMeltTimeoutRef.current);
        preMeltTimeoutRef.current = null;
      }
    },
    []
  );

  const waxAnimate = useMemo(
    () =>
      isMelting
        ? {
            scale: [1, 1.06, 0.92, 0.6, 0.2],
            opacity: [1, 1, 0.9, 0.4, 0],
            rotate: [0, -2, 3, -1, 0],
          }
        : isPreMelt
        ? {
            scale: [1, 1.05, 1.02],
            opacity: [1, 1, 1],
            rotate: [0, 1.5, 0],
          }
        : { scale: 1, opacity: 1, rotate: 0 },
    [isMelting, isPreMelt]
  );

  return (
    <div
      className="envelope-stage"
      data-intensity={theme?.toggles?.animationIntensity ?? 'medium'}
      data-wax-shape={waxShape}
      data-card-edge={cardEdgeStyle}
      data-texture={paperTextureEnabled ? 'on' : 'off'}
      data-drip={dripShimmer ? 'on' : 'off'}
      data-vignette={vignetteEnabled ? 'on' : 'off'}
      style={{ '--foil-intensity': foilIntensity }}
    >
      <div className="envelope-stage__halo" aria-hidden="true" />
      <div className="envelope-stage__sparkles" aria-hidden="true" />
      <div className="envelope-stage__drip" aria-hidden="true" />
      <div className="envelope-stage__stack">
        <motion.div
          className={`envelope-shell${isOpen ? ' is-open' : ''}`}
          initial={{ opacity: 0, scale: 0.92, y: 48 }}
          animate={
            isOpen
              ? { opacity: 0.25, scale: 0.95, y: 28 }
              : { opacity: 1, scale: 1, y: 0 }
          }
          transition={{ duration: 1.1, ease: [0.25, 0.8, 0.5, 1] }}
        >
          <div className="envelope-texture" aria-hidden="true" />
          <img
            src={envelopeSrc}
            alt="Golden envelope"
            className="envelope"
            onError={() => setEnvelopeSrc(defaultEnvelope)}
          />
          <motion.button
            type="button"
            className="wax-button"
            onClick={handleClick}
            aria-label="Open invitation"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            data-melting={isMelting}
            data-premelt={isPreMelt}
            data-shape={waxShape}
          >
            <span className="wax-button__glow" aria-hidden="true" />
            <span className="wax-button__pulse" aria-hidden="true" />
            <motion.img
              src={waxSrc ?? getWaxSeal('default')}
              alt="Wax seal"
              className="waxseal"
              animate={waxAnimate}
              transition={{ duration: 1.4, ease: [0.42, 0, 0.58, 1] }}
              onError={() => setWaxSrc(getWaxSeal('default'))}
            />
          </motion.button>
        </motion.div>
      </div>
      {isOpen && (
        <motion.div
          className="invite-card-wrapper"
          initial={{ opacity: 0, y: 160, scale: 0.95 }}
          animate={{ opacity: 1, y: -24, scale: 1 }}
          transition={{
            opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
            y: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
            scale: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
          }}
        >
          <img
            src={inviteSrc}
            alt="Invitation card"
            className="invite-card"
            onError={() => setInviteSrc(defaultInvite)}
          />
          <span className="invite-card__shimmer" aria-hidden="true" />
        </motion.div>
      )}
    </div>
  );
};

export default EnvelopeStage;
