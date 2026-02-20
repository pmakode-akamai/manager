import React from 'react';

import { DocumentTitleSegment } from 'src/components/DocumentTitle';
import { ProductInformationBanner } from 'src/components/ProductInformationBanner/ProductInformationBanner';
import { SuspenseLoader } from 'src/components/SuspenseLoader';
import { ImagesLandingV2 } from 'src/features/Images/ImagesLanding/v2/ImagesLandingV2';
import { useIsPrivateImageSharingEnabled } from 'src/features/Images/utils';

import { ImagesRoute } from './ImagesRoute';

export const ImagesLayout = () => {
  const { isPrivateImageSharingEnabled } = useIsPrivateImageSharingEnabled();
  if (isPrivateImageSharingEnabled) {
    return (
      <React.Suspense fallback={<SuspenseLoader />}>
        <DocumentTitleSegment segment="Images" />
        <ProductInformationBanner bannerLocation="Images" />
        <ImagesLandingV2 />
      </React.Suspense>
    );
  }
  return <ImagesRoute />;
};
