import React, { useState } from 'react';
import { DashboardPostazioni } from '../DashboardPostazioni';
import BookingConfirmationDialog, { BookingPreview } from './BookingConfirmationDialog';

// Wrapper component that integrates the selection from map to popup opening
// Note: This example augments the existing DashboardPostazioni by capturing clicks on free desks.
// In a real-world app, DashboardPostazioni should expose an onSelect event; here we intercept via wrapper rendering.

export interface MapWithBookingFlowProps {
  baseUrl?: string;
  refreshMs?: number;
}

export function MapWithBookingFlow({ baseUrl = '', refreshMs = 15000 }: MapWithBookingFlowProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preview, setPreview] = useState<BookingPreview | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // For demo: we render the dashboard and overlay a click handler using event delegation
  const onDeskClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement;
    const cell = target.closest('[data-testid^="desk-"]') as HTMLElement | null;
    if (!cell) return;
    // Extract id/name from dataset or text
    const testId = cell.getAttribute('data-testid');
    const id = testId?.replace('desk-', '') || '';
    const deskName = cell.textContent || `Desk ${id}`;
    // Open dialog with today as example date
    const date = new Date();
    setPreview({ date, deskId: id, deskName });
    setDialogOpen(true);
  };

  const handleConfirm = async (p: BookingPreview) => {
    setConfirmLoading(true);
    try {
      // Placeholder: async call to backend to confirm booking
      await new Promise((r) => setTimeout(r, 800));
      // Close dialog after success
      setDialogOpen(false);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
  };

  return (
    <div>
      <div onClick={onDeskClick}>
        <DashboardPostazioni baseUrl={baseUrl} refreshMs={refreshMs} />
      </div>

      <BookingConfirmationDialog
        isOpen={dialogOpen}
        bookingPreview={preview}
        confirmLoading={confirmLoading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        initialFocus="confirm"
      />
    </div>
  );
}

export default MapWithBookingFlow;
