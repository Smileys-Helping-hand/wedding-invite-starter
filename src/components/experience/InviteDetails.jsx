import { motion } from 'framer-motion';
import { useGuest } from '../../providers/GuestProvider.jsx';
import { EVENT_DATE_GREGORIAN, EVENT_VENUE, RSVP_STATUSES } from '../../utils/constants.js';
import { useHijriDate } from '../../hooks/useHijriDate.js';
import CountdownDisplay from './CountdownDisplay.jsx';
import Button from '../common/Button.jsx';
import { useTheme } from '../../providers/ThemeProvider.jsx';
import { getAssetPath } from '../../utils/assetPaths.js';
import './InviteDetails.css';

const statusCopy = {
  [RSVP_STATUSES.confirmed]: 'We are honoured to celebrate with you. Your RSVP is confirmed.',
  [RSVP_STATUSES.pending]: 'We look forward to your reply. Kindly RSVP at your earliest convenience.',
  [RSVP_STATUSES.declined]: 'We will miss you dearly, may Allah bless you for your warm wishes.',
};

const InviteDetails = ({ onRSVP, loading }) => {
  const { guest } = useGuest();
  const { gregorian, hijri } = useHijriDate(EVENT_DATE_GREGORIAN);
  const { theme } = useTheme();
  const cardBackground = theme?.assets?.cardBackground ?? getAssetPath('cardBackground');

  if (!guest) return null;

  const guestNames = Array.isArray(guest.guestNames)
    ? guest.guestNames.filter(Boolean).join(' & ')
    : [guest.guestName, guest.partnerName].filter(Boolean).join(' & ');
  const copy = statusCopy[guest.rsvpStatus] ?? statusCopy[RSVP_STATUSES.pending];
  const greeting = theme?.text?.greeting ?? 'Assalamu Alaikum';
  const greetingSuffix = theme?.text?.greetingSuffix ?? ' wa Rahmatullah';
  const salaam = guest.partnerName ? `${greeting}${greetingSuffix}` : greeting;
  const bismillahArabic =
    theme?.text?.bismillahArabic ?? 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ';
  const bismillahTranslation =
    theme?.text?.bismillahTranslation ??
    'In the name of Allah, The Most Merciful, The Most Compassionate';
  const englishIntro =
    theme?.text?.englishIntro ?? 'In the name of Allah, the Most Merciful, the Most Compassionate';
  const englishInviteLine =
    theme?.text?.englishInviteLine ?? 'You are warmly invited to the';
  const englishEventTitle = theme?.text?.englishEventTitle ?? 'Engagement Soirée of';
  const brideFormal = theme?.text?.brideFullName ?? 'Razia bint Sabri';
  const groomFormal = theme?.text?.groomFullName ?? 'Abduraziq ibn Abdusataar';
  const englishBlessing =
    theme?.text?.englishBlessing ?? 'May Allah fill this union with love and barakah.';
  const arabicIntro = theme?.text?.arabicIntro ?? 'حضوركم يشرفنا في';
  const arabicBrideLine =
    theme?.text?.arabicBrideLine ?? 'أمسية خطوبة رزيـا بنت صبري';
  const arabicConnector = theme?.text?.arabicConnector ?? 'و';
  const arabicGroomLine =
    theme?.text?.arabicGroomLine ?? 'عبدالرزاق بن عبدالستار';
  const showArabic = theme?.toggles?.showArabicText !== false;
  const scheduleGregorian =
    theme?.text?.scheduleGregorian ?? gregorian ?? 'Tuesday, 16 December 2025';
  const scheduleHijri =
    theme?.text?.scheduleHijri ?? hijri ?? 'Tuesday, Jumada II 26, 1447 AH';
  const scheduleVenue =
    theme?.text?.scheduleVenue ?? EVENT_VENUE.addressLine1 ?? 'Legacy Events, Schaapkraal Road, Ottery, Cape Town';
  const scheduleTime =
    theme?.text?.scheduleTime ?? EVENT_VENUE.gatheringTime ?? '4:30 PM for 5:00 PM';

  return (
    <section className="invite-details">
      <motion.div
        className="invite-card-panel"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 1.1,
          ease: [0.16, 1, 0.3, 1],
          scale: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        }}
        data-show-arabic={showArabic ? 'true' : 'false'}
        style={{ '--card-bg-image': `url(${cardBackground})` }}
      >
        <motion.div
          className="bismillah-text"
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <span className="bismillah-text__arabic">{bismillahArabic}</span>
          <span className="bismillah-text__translation">{bismillahTranslation}</span>
        </motion.div>
        <div className="invite-address">
          <p className="invite-salaam">{salaam}</p>
          {guestNames && <p className="invite-guest">{guestNames}</p>}
        </div>
        <div className="invite-english">
          <p className="invite-english__intro">{englishIntro}</p>
          <p className="invite-english__line">{englishInviteLine}</p>
          <p className="invite-english__event">{englishEventTitle}</p>
          <p className="invite-english__names">
            <span>{brideFormal}</span>
            <span className="invite-english__ampersand">&amp;</span>
            <span>{groomFormal}</span>
          </p>
          <p className="invite-english__blessing">{englishBlessing}</p>
        </div>
        {showArabic && (
          <div className="invite-arabic" lang="ar" dir="rtl">
            <p>{arabicIntro}</p>
            <p>{arabicBrideLine}</p>
            <p className="invite-arabic__ampersand">{arabicConnector}</p>
            <p>{arabicGroomLine}</p>
          </div>
        )}
        <div className="invite-schedule">
          <div className="invite-schedule__section">
            <span className="invite-schedule__label">𝗚𝗥𝗘𝗚𝗢𝗥𝗜𝗔𝗡</span>
            <span className="invite-schedule__value">{scheduleGregorian}</span>
          </div>
          <div className="invite-schedule__section">
            <span className="invite-schedule__label">𝗛𝗜𝗝𝗥𝗜</span>
            <span className="invite-schedule__value">{scheduleHijri}</span>
          </div>
          <span className="invite-schedule__flourish" aria-hidden="true" />
          <div className="invite-schedule__section invite-schedule__section--venue">
            <span className="invite-schedule__label">𝗩𝗘𝗡𝗨𝗘</span>
            <span className="invite-schedule__venue">{scheduleVenue}</span>
            {Boolean(EVENT_VENUE.addressLine2) && (
              <span className="invite-schedule__address">{EVENT_VENUE.addressLine2}</span>
            )}
          </div>
          <div className="invite-schedule__section invite-schedule__section--time">
            <span className="invite-schedule__label">𝗧𝗜𝗠𝗘</span>
            <span className="invite-schedule__value invite-schedule__value--italic">{scheduleTime}</span>
            {Boolean(EVENT_VENUE.programTime) && (
              <span className="invite-schedule__value invite-schedule__value--italic">
                {EVENT_VENUE.programTime}
              </span>
            )}
          </div>
        </div>
        <p className="invite-copy">{copy}</p>
        <CountdownDisplay />
        <div className="rsvp-actions">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onRSVP(RSVP_STATUSES.confirmed)}
            loading={loading}
          >
            Accept Invitation
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onRSVP(RSVP_STATUSES.declined)}
            loading={loading}
          >
            Decline with Warm Wishes
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

export default InviteDetails;
