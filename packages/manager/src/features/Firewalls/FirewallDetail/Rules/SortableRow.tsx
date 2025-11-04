import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

import { TableBody } from 'src/components/TableBody';

export interface SortableRowProps {
  children: React.ReactNode;
  id: number;
}

export const SortableRow = ({ id, children }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    active,
  } = useSortable({ id });

  const isActive = Boolean(active);

  const rowStyles = {
    '& td': {
      // Highly recommend to set the `touch-action: none` for all the draggable elements-
      // in order to prevent scrolling on mobile devices.
      // refer to https://docs.dndkit.com/api-documentation/sensors/pointer#touch-action
      touchAction: 'none',
    },
    // ':focus': {
    //   backgroundColor: isActive
    //     ? theme.tokens.alias.Background.Neutralsubtle
    //     : theme.tokens.alias.Background.Normal,
    // },
    cursor: isActive ? 'grabbing' : 'grab',
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition: isActive ? transition : 'none',
    zIndex: isDragging ? 9999 : 0,
  } as const;

  return (
    <TableBody
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      id={`row-${id}`}
      key={id}
      sx={rowStyles}
    >
      {children}
    </TableBody>
  );
};
