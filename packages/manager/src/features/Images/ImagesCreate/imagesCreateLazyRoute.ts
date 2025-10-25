import { createLazyRoute } from '@tanstack/react-router';

import { ImagesCreateContainer } from 'src/features/Images/ImagesCreate/ImageCreateContainer';

export const imageCreateLazyRoute = createLazyRoute(
  '/images/images/custom/create'
)({
  component: ImagesCreateContainer,
});
