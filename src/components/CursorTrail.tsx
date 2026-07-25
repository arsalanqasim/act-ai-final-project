import React, { useEffect, useRef } from 'react';

export const CursorTrail: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCursorPosition = (e: MouseEvent) => {
      if (cursorRef.current) {
        // Offset by half the width/height (16px) to center it on the cursor
        const x = e.clientX - 16;
        const y = e.clientY - 16;
        cursorRef.current.style.transform = `translate(${x}px, ${y}px)`;
      }
    };

    window.addEventListener('mousemove', updateCursorPosition);
    return () => {
      window.removeEventListener('mousemove', updateCursorPosition);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 z-[100] h-8 w-8 rounded-full bg-cyan-500/70 blur-[3px] transition-transform duration-500 ease-out will-change-transform hidden sm:block"
      style={{ transform: 'translate(-100px, -100px)' }}
    />
  );
};
