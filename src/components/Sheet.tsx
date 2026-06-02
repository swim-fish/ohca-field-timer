import type { ReactNode } from 'react';
import type { Theme } from '../theme/tokens';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  t: Theme;
  title?: string;
  children: ReactNode;
  maxH?: string;
}

// Bottom sheet overlay covering the app frame.
export function Sheet({ open, onClose, t, title, children, maxH }: SheetProps) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'rgba(3,7,12,0.55)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.surface,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderTop: `1px solid ${t.lineStrong}`,
          padding: '12px 16px 20px',
          maxHeight: maxH ?? '82%',
          overflowY: 'auto',
          boxShadow: '0 -16px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: t.lineStrong,
            margin: '2px auto 12px',
          }}
        />
        {title && (
          <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginBottom: 12 }}>
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
