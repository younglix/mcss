import { useEffect } from 'react';
import LandingContent from './LandingContent.jsx';

export default function Landing() {
  useEffect(() => {
    document.title = 'Mount Carmel Secondary School | MCSS Portal';
  }, []);

  return <LandingContent />;
}
