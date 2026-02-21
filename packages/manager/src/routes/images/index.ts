import { createRoute, redirect } from '@tanstack/react-router';

import { rootRoute } from '../root';
import { ImagesRoute } from './ImagesRoute';

import type { TableSearchParams } from '../types';
import type { ImageLibraryType } from 'src/features/Images/utils';

export interface ImagesSearchParams extends TableSearchParams {
  query?: string;
  // subType?: ImageLibraryType;
}

export interface ImageCreateDiskSearchParams {
  selectedDisk?: string;
  selectedLinode?: string;
}

export interface ImageCreateUploadSearchParams {
  imageDescription?: string;
  imageLabel?: string;
}

type ImageActionRouteParams = {
  action: ImageAction;
  imageId: string;
  imageType: ImageLibraryType;
};

const imageActions = {
  delete: 'delete',
  deploy: 'deploy',
  edit: 'edit',
  'manage-replicas': 'manage-replicas',
  rebuild: 'rebuild',
} as const;

export type ImageAction = (typeof imageActions)[keyof typeof imageActions];

const imagesRoute = createRoute({
  component: ImagesRoute,
  getParentRoute: () => rootRoute,
  path: 'images',
  validateSearch: (search: ImagesSearchParams) => search,
});

const imagesIndexRoute = createRoute({
  beforeLoad: ({ context }) => {
    // When private image sharing is enabled, redirect to Image Library tab with default 'owned' sub-tab
    if (context.isPrivateImageSharingEnabled) {
      throw redirect({
        to: '/images/image-library/$imageType',
        params: { imageType: 'owned-by-me' },
      });
    }
  },
  getParentRoute: () => imagesRoute,
  path: '/',
  validateSearch: (search: ImagesSearchParams) => search,
}).lazy(() =>
  import('src/features/Images/ImagesLanding/imagesLandingLazyRoute').then(
    (m) => m.imagesLandingLazyRoute
  )
);

const imageActionRoute = createRoute({
  beforeLoad: async ({ params }) => {
    if (!(params.action in imageActions)) {
      throw redirect({
        search: () => ({}),
        to: '/images',
      });
    }
  },
  getParentRoute: () => imagesRoute,
  params: {
    parse: ({ action, imageId }: ImageActionRouteParams) => ({
      action,
      imageId,
    }),
    stringify: ({ action, imageId }: ImageActionRouteParams) => ({
      action,
      imageId,
    }),
  },
  path: '$imageId/$action',
  validateSearch: (search: ImagesSearchParams) => search,
}).lazy(() =>
  import('src/features/Images/ImagesLanding/imagesLandingLazyRoute').then(
    (m) => m.imagesLandingLazyRoute
  )
);

const imagesCreateRoute = createRoute({
  getParentRoute: () => imagesRoute,
  path: 'create',
}).lazy(() =>
  import('src/features/Images/ImagesCreate/imagesCreateLazyRoute').then(
    (m) => m.imageCreateLazyRoute
  )
);

const imagesCreateIndexRoute = createRoute({
  beforeLoad: () => {
    throw redirect({
      to: '/images/create/disk',
    });
  },
  getParentRoute: () => imagesCreateRoute,
  path: '/',
});

const imagesCreateDiskRoute = createRoute({
  getParentRoute: () => imagesCreateRoute,
  path: 'disk',
  validateSearch: (search: ImageCreateDiskSearchParams) => search,
}).lazy(() =>
  import('src/features/Images/ImagesCreate/imagesCreateLazyRoute').then(
    (m) => m.imageCreateLazyRoute
  )
);

const imagesCreateUploadRoute = createRoute({
  getParentRoute: () => imagesCreateRoute,
  path: 'upload',
  validateSearch: (search: ImageCreateUploadSearchParams) => search,
}).lazy(() =>
  import('src/features/Images/ImagesCreate/imagesCreateLazyRoute').then(
    (m) => m.imageCreateLazyRoute
  )
);

// V2 routes - Image Library tab and Share Groups tab

// Image Library tab - contains sub-tabs for 'Owned by me', 'Shared with me', and 'Recovery images'

const imageLibraryLandingRoute = createRoute({
  getParentRoute: () => imagesRoute,
  path: 'image-library',
  validateSearch: (search: ImagesSearchParams) => search,
}).lazy(() =>
  import('src/features/Images/ImagesLanding/v2/imagesLandingV2LazyRoute').then(
    (m) => m.imagesLandingV2LazyRoute
  )
);

const imageLibraryIndexRoute = createRoute({
  beforeLoad: ({ context }) => {
    if (!context.isPrivateImageSharingEnabled) {
      throw redirect({
        to: '/images',
      });
    }
    if (
      context.isPrivateImageSharingEnabled &&
      location.pathname === '/images/image-library'
    ) {
      throw redirect({
        to: '/images/image-library/$imageType',
        params: { imageType: 'owned-by-me' },
      });
    }
  },
  getParentRoute: () => imageLibraryLandingRoute,
  path: '/',
  validateSearch: (search: ImagesSearchParams) => search,
}).lazy(() =>
  import(
    'src/features/Images/ImagesLanding/v2/ImageLibrary/imageLibraryLazyRoute'
  ).then((m) => m.imagesLibraryLazyRoute)
);

// const imageLibraryOwnedRoute = createRoute({
//   getParentRoute: () => imageLibraryIndexRoute,
//   path: 'owned-by-me',
//   validateSearch: (search: ImagesSearchParams) => search,
// });

// const imageLibrarySharedRoute = createRoute({
//   getParentRoute: () => imageLibraryIndexRoute,
//   path: 'shared-with-me',
//   validateSearch: (search: ImagesSearchParams) => search,
// });

// const imageLibraryRecoveryRoute = createRoute({
//   getParentRoute: () => imageLibraryIndexRoute,
//   path: 'recovery-images',
//   validateSearch: (search: ImagesSearchParams) => search,
// });

const imagesShareGroupsLandingRoute = createRoute({
  getParentRoute: () => imagesRoute,
  path: 'share-groups',
  validateSearch: (search: ImagesSearchParams) => search,
}).lazy(() =>
  import('src/features/Images/ImagesLanding/v2/imagesLandingV2LazyRoute').then(
    (m) => m.imagesLandingV2LazyRoute
  )
);

// Share Groups tab - for managing image share groups
const imagesShareGroupsIndexRoute = createRoute({
  beforeLoad: ({ context }) => {
    if (!context.isPrivateImageSharingEnabled) {
      throw redirect({
        to: '/images',
      });
    }
  },
  getParentRoute: () => imagesShareGroupsLandingRoute,
  path: '/',
  validateSearch: (search: ImagesSearchParams) => search,
}).lazy(() =>
  import(
    'src/features/Images/ImagesLanding/v2/ShareGroups/shareGroupsLazyRoute'
  ).then((m) => m.shareGroupsLazyRoute)
);

const imageLibraryTypeRoute = createRoute({
  getParentRoute: () => imageLibraryIndexRoute,
  params: {
    parse: ({ imageType }: ImageActionRouteParams) => ({
      imageType,
    }),
    stringify: ({ imageType }: ImageActionRouteParams) => ({
      imageType,
    }),
  },
  path: '$imageType',
  validateSearch: (search: ImagesSearchParams) => search,
});

const imageActionRouteV2 = createRoute({
  beforeLoad: async ({ params }) => {
    // const validImageTypes = [
    //   'owned-by-me',
    //   'shared-with-me',
    //   'recovery-images',
    // ];

    // if (!validImageTypes.includes(params.imageType)) {
    //   throw redirect({ to: '/images/image-library/owned-by-me' });
    // }

    if (!(params.action in imageActions)) {
      throw redirect({
        search: () => ({}),
        to: '/images',
      });
    }
  },
  getParentRoute: () => imageLibraryTypeRoute,
  params: {
    parse: ({ action, imageId }: ImageActionRouteParams) => ({
      action,
      imageId,
    }),
    stringify: ({ action, imageId }: ImageActionRouteParams) => ({
      action,
      imageId,
    }),
  },
  path: '$imageId/$action',
  validateSearch: (search: ImagesSearchParams) => search,
}).lazy(() =>
  import('src/features/Images/ImagesLanding/v2/imagesLandingV2LazyRoute').then(
    (m) => m.imagesLandingV2LazyRoute
  )
);

export const imagesRouteTree = imagesRoute.addChildren([
  imagesIndexRoute.addChildren([imageActionRoute]),
  imageLibraryLandingRoute.addChildren([
    imageLibraryIndexRoute.addChildren([
      imageLibraryTypeRoute.addChildren([imageActionRouteV2]),
    ]),
  ]),
  imagesShareGroupsLandingRoute.addChildren([imagesShareGroupsIndexRoute]),
  imagesCreateRoute.addChildren([
    imagesCreateIndexRoute,
    imagesCreateDiskRoute,
    imagesCreateUploadRoute,
  ]),
]);
