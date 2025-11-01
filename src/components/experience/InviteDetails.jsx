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

  const partner = guest.partnerName ? ` & ${guest.partnerName}` : '';
  const copy = statusCopy[guest.rsvpStatus] ?? statusCopy[RSVP_STATUSES.pending];
  const coupleNames = `${theme?.brideName ?? 'Razia'} & ${theme?.groomName ?? 'Abduraziq'}`;
  const greeting = theme?.text?.greeting ?? 'Assalamu Alaikum';
  const greetingSuffix = theme?.text?.greetingSuffix ?? ' wa Rahmatullah';
  const salaam = guest.partnerName ? `${greeting}${greetingSuffix}` : greeting;
  const bismillahArabic = theme?.text?.bismillahArabic ?? 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ';
  const bismillahTranslation =
    theme?.text?.bismillahTranslation ??
    'In the name of Allah, The Most Merciful, The Most Compassionate';

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
        <p className="invite-salaam">{salaam},</p>
        <h1 className="invite-names text-script">
          {guest.guestName}
          {partner}
        </h1>
        <p className="invite-body">You are warmly invited to the engagement of</p>
        <p className="celebrants">{coupleNames}</p>
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
