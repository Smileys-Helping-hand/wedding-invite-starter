import { useEffect, useState } from 'react';

const gregorianFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export const useHijriDate = (date) => {
  const [representation, setRepresentation] = useState({
    gregorian: '',
    hijri: '',
  });

  useEffect(() => {
    if (!date) return;

    const eventDate = date instanceof Date ? date : new Date(date);

    setRepresentation({
      gregorian: gregorianFormatter.format(eventDate),
      hijri: hijriFormatter.format(eventDate),
    });
  }, [date]);

  return representation;
};
