import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function XButton() {
  const [size, setSize] = useState(20); // default size for small screens

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Small screen
        setSize(20);
      } else
        // Medium screen
        setSize(25);
    };

    handleResize(); // check size on initial render
    window.addEventListener('resize', handleResize); // update on resize

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <X size={size} />;
}
