import React, { useEffect } from 'react';

export function DisableScroll({ showModal }: { showModal: boolean }) {
  useEffect(() => {
    if (showModal) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    // Cleanup: alisin ang class kung ma-unmount ang component
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [showModal]);

  // Wala nang kailangang i-render
  return null;
}
