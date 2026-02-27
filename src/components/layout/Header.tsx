'use client';

import GlobalBar from './GlobalBar';
import TripContextBar from './TripContextBar';

export default function Header() {
  return (
    <header className="sticky top-0 z-50">
      <GlobalBar />
      <TripContextBar />
    </header>
  );
}
