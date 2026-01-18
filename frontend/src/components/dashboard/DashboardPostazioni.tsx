import React, { useMemo, useCallback } from 'react';
import { DeskMapView, DeskItem, BookingPreview } from './DeskMapView';
import { Container, Title, SubTitle } from './styles';

export interface DashboardPostazioniProps {
  // Full list of desks for the current floor/area
  desks: DeskItem[];
  // Selected date provided by parent context (e.g., from a datepicker); optional -> defaults to today
  selectedDate?: Date | string;
  // Event raised when a user selects a free desk
  onPreviewBooking?: (preview: BookingPreview, desk: DeskItem) => void;
}

export const DashboardPostazioni: React.FC<DashboardPostazioniProps> = ({ desks, selectedDate, onPreviewBooking }) => {
  const freeCount = useMemo(() => desks.filter((d) => d.status === 'LIBERA').length, [desks]);

  const handleDeskSelected = useCallback(
    (desk: DeskItem, date: Date, preview: BookingPreview) => {
      // Propagate to parent; parent will open the popup modal with provided preview data
      onPreviewBooking?.(preview, desk);
    },
    [onPreviewBooking]
  );

  return (
    <Container>
      <Title>Seleziona una postazione</Title>
      <SubTitle>
        {freeCount > 0 ? `${freeCount} postazioni libere` : 'Nessuna postazione libera'}
      </SubTitle>

      <DeskMapView desks={desks} selectedDate={selectedDate} onDeskSelected={handleDeskSelected} />
    </Container>
  );
};

export default DashboardPostazioni;
