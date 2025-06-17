import React from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  x: number;
  y: number;
  visible: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ content, x, y, visible }) => {
  if (!visible || !content) return null;

  // Adjust position to prevent tooltip from going off-screen
  const adjustedX = Math.min(x + 10, window.innerWidth - 200);
  const adjustedY = Math.max(y - 30, 10);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: adjustedX,
        top: adjustedY,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        pointerEvents: 'none',
        zIndex: 10000,
        maxWidth: '200px',
        wordWrap: 'break-word',
      }}
    >
      {content}
    </div>,
    document.body
  );
};

export default Tooltip; 