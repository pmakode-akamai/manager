import { createLazyRoute } from '@tanstack/react-router';

import { ImageLibrary } from './ImageLibrary';

export const imageLibraryLazyRoute = createLazyRoute('/images/image-library')({
  component: ImageLibrary,
});
