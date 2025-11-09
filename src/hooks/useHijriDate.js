import { useEffect, useState } from 'react';

const createFormatter = (locale, options) =>
  new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });

const resolveLocale = () => {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }
  return 'en-GB';
};

const baseLocale = resolveLocale();
const gregorianFormatter = createFormatter(baseLocale);
const hijriFormatter = createFormatter(`${baseLocale}-u-ca-islamic`);

export const useHijriDate = (date, { initialCalendar = 'gregorian' } = {}) => {
  const [representation, setRepresentation] = useState({
    gregorian: '',
    hijri: '',
  });
  const [activeCalendar, setActiveCalendar] = useState(initialCalendar);

  useEffect(() => {
    if (!date) return;

    const eventDate = date instanceof Date ? date : new Date(date);

    setRepresentation({
      gregorian: gregorianFormatter.format(eventDate),
      hijri: hijriFormatter.format(eventDate),
    });
  }, [date]);

  const toggleCalendar = () => {
    setActiveCalendar((current) => (current === 'gregorian' ? 'hijri' : 'gregorian'));
  };

  return {
    ...representation,
    activeCalendar,
    toggleCalendar,
    activeLabel:
      activeCalendar === 'gregorian' ? representation.gregorian : representation.hijri,
  };
};
