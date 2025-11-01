import { motion } from 'framer-motion';
import { useGuest } from '../../providers/GuestProvider.jsx';
import { EVENT_DATE_GREGORIAN, EVENT_VENUE, RSVP_STATUSES } from '../../utils/constants.js';
import { useHijriDate } from '../../hooks/useHijriDate.js';
import CountdownDisplay from './CountdownDisplay.jsx';
import Button from '../common/Button.jsx';
import { useTheme } from '../../providers/ThemeProvider.jsx';
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

  if (!guest) return null;

  const guestNames = Array.isArray(guest.guestNames)
    ? guest.guestNames.filter(Boolean).join(' & ')
    : [guest.guestName, guest.partnerName].filter(Boolean).join(' & ');
  const copy = statusCopy[guest.rsvpStatus] ?? statusCopy[RSVP_STATUSES.pending];
  const greeting = theme?.text?.greeting ?? 'Assalamu Alaikum';
  const greetingSuffix = theme?.text?.greetingSuffix ?? ' wa Rahmatullah';
  const salaam = guest.partnerName ? `${greeting}${greetingSuffix}` : greeting;
  const bismillahArabic = theme?.text?.bismillahArabic ?? 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ';
  const bismillahTranslation =
    theme?.text?.bismillahTranslation ??
    'In the name of Allah, The Most Merciful, The Most Compassionate';
  const englishIntro =
    theme?.text?.englishIntro ?? 'In the name of Allah, The Most Merciful, The Most Compassionate';
  const englishInviteLine = theme?.text?.englishInviteLine ?? 'You are warmly invited to the';
  const englishEventTitle = theme?.text?.englishEventTitle ?? 'Engagement Soirée of';
  const brideFormal = theme?.text?.brideFullName ?? 'Razia bint Sabri';
  const groomFormal = theme?.text?.groomFullName ?? 'Abduraziq ibn Abdusataar';
  const englishBlessing =
    theme?.text?.englishBlessing ?? 'May Allah fill this union with love and barakah.';
  const arabicIntro = theme?.text?.arabicIntro ?? 'حضوركم يشرفنا في';
  const arabicBrideLine = theme?.text?.arabicBrideLine ?? 'أمسية خطوبة رزيـا بنت صبري';
  const arabicConnector = theme?.text?.arabicConnector ?? 'و';
  const arabicGroomLine = theme?.text?.arabicGroomLine ?? 'عبدالرزاق بن عبدالستار';

  return (
    <section className="invite-details">
      <motion.div
        className="invite-card-panel"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
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
        <div className="invite-arabic" lang="ar" dir="rtl">
          <p>{arabicIntro}</p>
          <p>{arabicBrideLine}</p>
          <p className="invite-arabic__ampersand">{arabicConnector}</p>
          <p>{arabicGroomLine}</p>
        </div>
        <div className="date-block">
          <span className="date-label">Gregorian</span>
          <span className="date-text">{gregorian}</span>
        </div>
        <div className="date-block">
          <span className="date-label">Hijri</span>
          <span className="date-text">{hijri}</span>
        </div>
        <div className="venue">
          <span className="venue-name">{EVENT_VENUE.name}</span>
          <span>{EVENT_VENUE.addressLine1}</span>
          <span>{EVENT_VENUE.addressLine2}</span>
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
            Send Regrets
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

export default InviteDetails;
