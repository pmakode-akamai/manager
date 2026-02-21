import { createLazyRoute } from '@tanstack/react-router';

import { ImageLibrary } from './ImageLibrary';

export const imagesLibraryLazyRoute = createLazyRoute('/images/image-library')({
  component: ImageLibrary,
});
