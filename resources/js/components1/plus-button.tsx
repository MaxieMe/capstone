import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

export function PlusButton() {
  const [size, setSize] = useState(20); // default size for small screens

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Small screen
        setSize(23);
      } else
        // Medium screen
        setSize(30);
    };

    handleResize(); // check size on initial render
    window.addEventListener('resize', handleResize); // update on resize

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <Plus size={size} />;
}
