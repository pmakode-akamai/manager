import { BetaChip } from '@linode/ui';
import { Outlet } from '@tanstack/react-router';
import React from 'react';

import { LandingHeader } from 'src/components/LandingHeader';
import { SuspenseLoader } from 'src/components/SuspenseLoader';
// import { SafeTabPanel } from 'src/components/Tabs/SafeTabPanel';
import { TabPanels } from 'src/components/Tabs/TabPanels';
import { Tabs } from 'src/components/Tabs/Tabs';
import { TanStackTabLinkList } from 'src/components/Tabs/TanStackTabLinkList';
import { useTabs } from 'src/hooks/useTabs';

// const ImageLibraryTabs = React.lazy(() =>
//   import('./ImageLibrary/ImageLibraryTabs').then((module) => ({
//     default: module.ImageLibraryTabs,
//   }))
// );

export const ImagesLandingV2 = () => {
  const { handleTabChange, tabIndex, tabs } = useTabs([
    {
      title: 'Image Library',
      to: '/images/image-library',
    },
    {
      title: 'Share Groups',
      to: '/images/share-groups',
      chip: <BetaChip />,
    },
  ]);

  return (
    <>
      <LandingHeader
        breadcrumbProps={{
          pathname: 'Images',
          removeCrumbX: 1,
        }}
        spacingBottom={16}
        title="Images"
      />

      <Tabs index={tabIndex} onChange={handleTabChange}>
        <TanStackTabLinkList tabs={tabs} />
        <React.Suspense fallback={<SuspenseLoader />}>
          <TabPanels>
            {/* <SafeTabPanel index={0}>
              <ImageLibraryTabs />
            </SafeTabPanel>
            <SafeTabPanel index={1}>
              <Notice variant="info">Share Groups is coming soon...</Notice>
            </SafeTabPanel> */}
            <Outlet />
          </TabPanels>
        </React.Suspense>
      </Tabs>
    </>
  );
};
