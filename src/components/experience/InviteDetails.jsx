import { motion } from 'framer-motion';
import { useGuest } from '../../providers/GuestProvider.jsx';
import { EVENT_DATE_GREGORIAN, EVENT_VENUE, RSVP_STATUSES } from '../../utils/constants.js';
import { useHijriDate } from '../../hooks/useHijriDate.js';
import CountdownDisplay from './CountdownDisplay.jsx';
import Button from '../common/Button.jsx';
import './InviteDetails.css';

const statusCopy = {
  [RSVP_STATUSES.confirmed]: 'We are honoured to celebrate with you. Your RSVP is confirmed.',
  [RSVP_STATUSES.pending]: 'We look forward to your reply. Kindly RSVP at your earliest convenience.',
  [RSVP_STATUSES.declined]: 'We will miss you dearly, may Allah bless you for your warm wishes.',
};

const InviteDetails = ({ onRSVP, loading }) => {
  const { guest } = useGuest();
  const { gregorian, hijri } = useHijriDate(EVENT_DATE_GREGORIAN);

  if (!guest) return null;

  const partner = guest.partnerName ? ` & ${guest.partnerName}` : '';
  const copy = statusCopy[guest.rsvpStatus] ?? statusCopy[RSVP_STATUSES.pending];

  return (
    <section className="invite-details">
      <motion.div
        className="invite-card-panel"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="invite-salaam">Assalamu Alaikum{guest.partnerName ? ' wa Rahmatullah' : ''},</p>
        <h1 className="invite-names text-script">
          {guest.guestName}
          {partner}
        </h1>
        <p className="invite-body">You are warmly invited to the engagement of</p>
        <p className="celebrants">Razia &amp; Abduraziq</p>
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
          <Button variant="primary" size="lg" onClick={() => onRSVP(RSVP_STATUSES.confirmed)} loading={loading}>
            Accept Invitation
          </Button>
          <Button variant="outline" size="lg" onClick={() => onRSVP(RSVP_STATUSES.declined)} loading={loading}>
            Send Regrets
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

export default InviteDetails;
