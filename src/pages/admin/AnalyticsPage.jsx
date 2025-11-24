import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';
import Button from '../../components/common/Button.jsx';
import Tag from '../../components/common/Tag.jsx';
import { computeArrivalStats, formatCheckInTime } from '../../utils/guestUtils.js';
import './AnalyticsPage.css';

const buildArrivalSeries = (entries = [], checkIns = {}) => {
  const points = entries
    .map((guest) => ({ code: guest.code, at: checkIns[guest.code]?.checkedInAt }))
    .filter((item) => item.at)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const buckets = new Map();
  points.forEach((point) => {
    const rounded = new Date(Math.floor(new Date(point.at).getTime() / (15 * 60 * 1000)) * 15 * 60 * 1000);
    const label = rounded.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    buckets.set(label, (buckets.get(label) ?? 0) + 1);
  });

  const labels = Array.from(buckets.keys());
  const values = labels.map((label) => buckets.get(label));
  return { labels, values };
};

const AnalyticsPage = ({ entries = [], checkIns = {} }) => {
  const containerRef = useRef(null);
  const lineRef = useRef(null);
  const barRef = useRef(null);
  const lineChart = useRef(null);
  const barChart = useRef(null);
  const [exporting, setExporting] = useState(false);

  const stats = useMemo(() => computeArrivalStats(entries, checkIns), [checkIns, entries]);
  const arrivalSeries = useMemo(() => buildArrivalSeries(entries, checkIns), [checkIns, entries]);

  const confirmed = entries.filter((guest) => guest.rsvpStatus === 'confirmed');
  const noShows = confirmed.filter((guest) => !checkIns[guest.code]?.checkedIn);

  useEffect(() => {
    if (!lineRef.current) return undefined;
    if (lineChart.current) lineChart.current.destroy();
    lineChart.current = new Chart(lineRef.current, {
      type: 'line',
      data: {
        labels: arrivalSeries.labels,
        datasets: [
          {
            label: 'Arrivals',
            data: arrivalSeries.values,
            borderColor: '#d2b16b',
            backgroundColor: 'rgba(210, 177, 107, 0.25)',
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { precision: 0 } } },
      },
    });

    return () => {
      if (lineChart.current) lineChart.current.destroy();
    };
  }, [arrivalSeries]);

  useEffect(() => {
    if (!barRef.current) return undefined;
    if (barChart.current) barChart.current.destroy();
    barChart.current = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: ['RSVP Confirmed', 'Arrived'],
        datasets: [
          {
            label: 'Guests',
            data: [stats.guestsAttending, stats.guestsArrived],
            backgroundColor: ['rgba(210, 177, 107, 0.45)', 'rgba(94, 130, 111, 0.6)'],
            borderColor: ['#d2b16b', '#5e826f'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { precision: 0 } } },
      },
    });

    return () => {
      if (barChart.current) barChart.current.destroy();
    };
  }, [stats]);

  const peakArrival = useMemo(() => {
    if (arrivalSeries.labels.length === 0) return null;
    const max = Math.max(...arrivalSeries.values);
    const idx = arrivalSeries.values.indexOf(max);
    return `${arrivalSeries.labels[idx]} (${max} arrivals)`;
  }, [arrivalSeries]);

  const handleExportPng = async () => {
    if (!containerRef.current) return;
    setExporting(true);
    const canvas = await html2canvas(containerRef.current);
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `arrival-analytics-${Date.now()}.png`;
    link.click();
    setExporting(false);
  };

  return (
    <div className="analytics-page" ref={containerRef}>
      <header className="analytics-header">
        <div>
          <p className="eyebrow">Event day</p>
          <h1 className="page-title">Arrival analytics</h1>
          <p className="page-subtitle">Live insights from check-ins to guide staffing and hospitality.</p>
        </div>
        <div className="analytics-actions">
          <Button variant="outline" onClick={handleExportPng} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export PNG'}
          </Button>
        </div>
      </header>

      <div className="analytics-grid">
        <section className="analytics-card">
          <div className="card-heading">
            <h3>Arrivals over time</h3>
            {peakArrival && <Tag tone="info">Peak: {peakArrival}</Tag>}
          </div>
          <canvas ref={lineRef} height={200} />
        </section>

        <section className="analytics-card">
          <div className="card-heading">
            <h3>RSVP vs Actual</h3>
            <Tag tone="info">Live</Tag>
          </div>
          <canvas ref={barRef} height={200} />
        </section>

        <section className="analytics-card analytics-card--list">
          <div className="card-heading">
            <h3>No-show list</h3>
            <Tag tone="warning">{noShows.length}</Tag>
          </div>
          <div className="analytics-list">
            {noShows.length === 0 && <p className="muted">All confirmed guests have arrived.</p>}
            {noShows.map((guest) => (
              <div key={guest.code} className="analytics-list__item">
                <div>
                  <p className="list-title">{guest.primaryGuest}</p>
                  <p className="list-subtitle">Code {guest.code}</p>
                </div>
                <span className="list-badge">{formatCheckInTime(checkIns[guest.code]?.checkedInAt) || 'Not arrived'}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AnalyticsPage;
