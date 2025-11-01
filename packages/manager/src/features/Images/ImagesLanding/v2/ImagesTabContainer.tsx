import { imageQueries, useImageQuery, useImagesQuery } from '@linode/queries';
import { getAPIFilterFromQuery } from '@linode/search';
import { BetaChip, Drawer, Notice, Stack } from '@linode/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import * as React from 'react';

import { SuspenseLoader } from 'src/components/SuspenseLoader';
import { SafeTabPanel } from 'src/components/Tabs/SafeTabPanel';
import { Tab } from 'src/components/Tabs/Tab';
import { TabList } from 'src/components/Tabs/TabList';
import { TabPanels } from 'src/components/Tabs/TabPanels';
import { Tabs } from 'src/components/Tabs/Tabs';
import { useOrderV2 } from 'src/hooks/useOrderV2';
import { usePaginationV2 } from 'src/hooks/usePaginationV2';

import {
  AUTOMATIC_IMAGES_DEFAULT_ORDER,
  AUTOMATIC_IMAGES_DEFAULT_ORDER_BY,
  AUTOMATIC_IMAGES_ORDER_PREFERENCE_KEY,
  AUTOMATIC_IMAGES_PREFERENCE_KEY,
  MANUAL_IMAGES_DEFAULT_ORDER,
  MANUAL_IMAGES_DEFAULT_ORDER_BY,
  MANUAL_IMAGES_PREFERENCE_KEY,
} from '../../constants';
import { getImagesSubTabIndex } from '../../utils';
import { DeleteImageDialog } from '../DeleteImageDialog';
import { EditImageDrawer } from '../EditImageDrawer';
import { ManageImageReplicasForm } from '../ImageRegions/ManageImageRegionsForm';
import { ImagesLandingEmptyState } from '../ImagesLandingEmptyState';
import { RebuildImageDrawer } from '../RebuildImageDrawer';
import { ImagesView } from './ImagesView';

import type { ImagesSubTab } from '../../utils';
import type { Handlers as ImageHandlers } from '../ImagesActionMenu';
import type { Filter, Image } from '@linode/api-v4';
import type { ImageAction } from 'src/routes/images';

export const ImagesTabContainer = () => {
  const navigate = useNavigate();

  const params = useParams({
    from: '/images/images/$imageId/$action',
    shouldThrow: false,
  });

  const search = useSearch({ from: '/images' });

  const queryClient = useQueryClient();

  /**
   * At the time of writing: `label`, `tags`, `size`, `status`, `region` are filterable.
   *
   * Some fields like `status` and `region` can't be used in complex filters using '+or' / '+and'
   *
   * Using `tags` in a '+or' is currently broken. See ARB-5792
   */
  const { error: searchParseError, filter } = getAPIFilterFromQuery(
    search.query,
    {
      // Because Images have an array of region objects, we need to transform
      // search queries like "region: us-east" to { regions: { region: "us-east" } }
      // rather than the default behavior which is { region: { '+contains': "us-east" } }
      filterShapeOverrides: {
        '+contains': {
          field: 'region',
          filter: (value) => ({ regions: { region: value } }),
        },
        '+eq': {
          field: 'region',
          filter: (value) => ({ regions: { region: value } }),
        },
      },
      searchableFieldsWithoutOperator: ['label', 'tags'],
    }
  );

  const paginationForManualImages = usePaginationV2({
    currentRoute: '/images/images',
    preferenceKey: MANUAL_IMAGES_PREFERENCE_KEY,
    searchParams: (prev) => ({
      ...prev,
      query: search.query,
    }),
  });

  const {
    handleOrderChange: handleManualImagesOrderChange,
    order: manualImagesOrder,
    orderBy: manualImagesOrderBy,
  } = useOrderV2({
    initialRoute: {
      defaultOrder: {
        order: MANUAL_IMAGES_DEFAULT_ORDER,
        orderBy: MANUAL_IMAGES_DEFAULT_ORDER_BY,
      },
      from: '/images/images',
    },
    preferenceKey: MANUAL_IMAGES_PREFERENCE_KEY,
    prefix: 'manual',
  });

  const manualImagesFilter: Filter = {
    ['+order']: manualImagesOrder,
    ['+order_by']: manualImagesOrderBy,
    ...filter,
  };

  const {
    data: manualImages,
    error: manualImagesError,
    isFetching: manualImagesIsFetching,
    isLoading: manualImagesLoading,
  } = useImagesQuery(
    {
      page: paginationForManualImages.page,
      page_size: paginationForManualImages.pageSize,
    },
    {
      ...manualImagesFilter,
      is_public: false,
      type: 'manual',
    },
    {
      // Run this query only when subType is 'custom',
      // OR if subType is undefined, run it by default with other queries to determine the global empty state.
      enabled: search.subType === 'custom' || search.subType === undefined,
      // Refetch custom images every 30 seconds.
      // We do this because we have no /v4/account/events we can use
      // to update Image region statuses. We should make the API
      // team and Images team implement events for this.
      refetchInterval: 30_000,
      // If we have a search query, disable retries to keep the UI
      // snappy if the user inputs an invalid X-Filter. Otherwise,
      // pass undefined to use the default retry behavior.
      retry: search.query ? false : undefined,
    }
  );

  // Pagination, order, and query hooks for automatic/recovery images
  const paginationForAutomaticImages = usePaginationV2({
    currentRoute: '/images/images',
    preferenceKey: AUTOMATIC_IMAGES_PREFERENCE_KEY,
    searchParams: (prev) => ({
      ...prev,
      query: search.query,
    }),
  });

  const {
    handleOrderChange: handleAutomaticImagesOrderChange,
    order: automaticImagesOrder,
    orderBy: automaticImagesOrderBy,
  } = useOrderV2({
    initialRoute: {
      defaultOrder: {
        order: AUTOMATIC_IMAGES_DEFAULT_ORDER,
        orderBy: AUTOMATIC_IMAGES_DEFAULT_ORDER_BY,
      },
      from: '/images/images',
    },
    preferenceKey: AUTOMATIC_IMAGES_ORDER_PREFERENCE_KEY,
    prefix: 'automatic',
  });

  const automaticImagesFilter: Filter = {
    ['+order']: automaticImagesOrder,
    ['+order_by']: automaticImagesOrderBy,
    ...filter,
  };

  const {
    data: automaticImages,
    error: automaticImagesError,
    isFetching: automaticImagesIsFetching,
    isLoading: automaticImagesLoading,
  } = useImagesQuery(
    {
      page: paginationForAutomaticImages.page,
      page_size: paginationForAutomaticImages.pageSize,
    },
    {
      ...automaticImagesFilter,
      is_public: false,
      type: 'automatic',
    },
    {
      // Run this query only when subType is 'recovery',
      // OR if subType is undefined, run it by default with other queries to determine the global empty state.
      enabled: search.subType === 'recovery' || search.subType === undefined,
      // If we have a search query, disable retries to keep the UI
      // snappy if the user inputs an invalid X-Filter. Otherwise,
      // pass undefined to use the default retry behavior.
      retry: search.query ? false : undefined,
    }
  );

  const {
    data: selectedImage,
    isLoading: isFetchingSelectedImage,
    error: selectedImageError,
  } = useImageQuery(params?.imageId ?? '', !!params?.imageId);

  const actionHandler = (image: Image, action: ImageAction) => {
    navigate({
      params: { action, imageId: image.id },
      search: (prev) => prev,
      to: '/images/images/$imageId/$action',
    });
  };

  const handleEdit = (image: Image) => {
    actionHandler(image, 'edit');
  };

  const handleRebuild = (image: Image) => {
    actionHandler(image, 'rebuild');
  };

  const handleDelete = (image: Image) => {
    actionHandler(image, 'delete');
  };

  const handleCloseDialog = () => {
    navigate({
      search: (prev) => ({ ...prev, subType: search.subType }),
      to: '/images/images',
    });
  };

  const handleManageRegions = (image: Image) => {
    actionHandler(image, 'manage-replicas');
  };

  const onCancelFailedClick = () => {
    queryClient.invalidateQueries({
      queryKey: imageQueries.paginated._def,
    });
  };

  const handleDeployNewLinode = (imageId: string) => {
    navigate({
      to: '/linodes/create/images',
      search: {
        imageID: imageId,
      },
    });
  };

  const handlers: ImageHandlers = {
    onCancelFailed: onCancelFailedClick,
    onDelete: handleDelete,
    onDeploy: handleDeployNewLinode,
    onEdit: handleEdit,
    onManageRegions: handleManageRegions,
    onRebuild: handleRebuild,
  };

  const subTabs: ImagesSubTab[] = [
    { variant: 'custom', title: 'My custom images' },
    {
      variant: 'shared',
      title: 'Shared with me',
      isBeta: true,
    },
    { variant: 'recovery', title: 'Recovery images' },
  ];

  const subTabIndex = getImagesSubTabIndex(subTabs, search.subType);

  const onTabChange = (index: number) => {
    // - Update the "subType" query param.
    // - This switches between "My custom images", "Shared with me" and "Recovery images" tabs.
    navigate({
      to: `/images/images`,
      search: (prev) => ({
        ...prev,
        subType: subTabs[index]['variant'],
        // Reset search, pagination and sorting query params
        query: undefined,
        page: undefined,
        pageSize: undefined,
        'manual-order': undefined,
        'manual-orderBy': undefined,
        'automatic-order': undefined,
        'automatic-orderBy': undefined,
      }),
    });
  };

  if (
    manualImages?.results === 0 &&
    automaticImages?.results === 0 &&
    !search.query
  ) {
    return <ImagesLandingEmptyState />;
  }

  return (
    <Stack spacing={3}>
      <Tabs index={subTabIndex} onChange={onTabChange}>
        <TabList>
          {subTabs.map((tab) => (
            <Tab key={`images-${tab.variant}`}>
              {tab.title} {tab.isBeta ? <BetaChip /> : null}
            </Tab>
          ))}
        </TabList>
        <React.Suspense fallback={<SuspenseLoader />}>
          <TabPanels>
            {subTabs.map((tab, idx) => (
              <SafeTabPanel index={idx} key={`images-${tab.variant}-content`}>
                {tab.variant === 'custom' && (
                  <ImagesView
                    handleImagesOrderChange={handleManualImagesOrderChange}
                    handlers={handlers}
                    images={manualImages}
                    imagesError={manualImagesError}
                    imagesIsFetching={manualImagesIsFetching}
                    imagesLoading={manualImagesLoading}
                    imagesOrder={manualImagesOrder}
                    imagesOrderBy={manualImagesOrderBy}
                    paginationForImages={{
                      handlePageChange:
                        paginationForManualImages.handlePageChange,
                      handlePageSizeChange:
                        paginationForManualImages.handlePageSizeChange,
                      page: paginationForManualImages.page,
                      pageSize: paginationForManualImages.pageSize,
                    }}
                    searchErrorText={searchParseError?.message}
                    variant="custom"
                  />
                )}
                {tab.variant === 'shared' && (
                  <Notice variant="info">
                    Share with me is coming soon...
                  </Notice>
                )}
                {tab.variant === 'recovery' && (
                  <ImagesView
                    handleImagesOrderChange={handleAutomaticImagesOrderChange}
                    handlers={handlers}
                    images={automaticImages}
                    imagesError={automaticImagesError}
                    imagesIsFetching={automaticImagesIsFetching}
                    imagesLoading={automaticImagesLoading}
                    imagesOrder={automaticImagesOrder}
                    imagesOrderBy={automaticImagesOrderBy}
                    paginationForImages={{
                      handlePageChange:
                        paginationForAutomaticImages.handlePageChange,
                      handlePageSizeChange:
                        paginationForAutomaticImages.handlePageSizeChange,
                      page: paginationForAutomaticImages.page,
                      pageSize: paginationForAutomaticImages.pageSize,
                    }}
                    searchErrorText={searchParseError?.message}
                    variant="recovery"
                  />
                )}
              </SafeTabPanel>
            ))}
          </TabPanels>
        </React.Suspense>
      </Tabs>
      <EditImageDrawer
        image={selectedImage}
        imageError={selectedImageError}
        isFetching={isFetchingSelectedImage}
        onClose={handleCloseDialog}
        open={params?.action === 'edit'}
      />
      <RebuildImageDrawer
        image={selectedImage}
        imageError={selectedImageError}
        isFetching={isFetchingSelectedImage}
        onClose={handleCloseDialog}
        open={params?.action === 'rebuild'}
      />
      <Drawer
        error={selectedImageError}
        isFetching={isFetchingSelectedImage}
        onClose={handleCloseDialog}
        open={params?.action === 'manage-replicas'}
        title={`Manage Replicas for ${selectedImage?.label ?? 'Unknown'}`}
      >
        <ManageImageReplicasForm
          image={selectedImage}
          onClose={handleCloseDialog}
        />
      </Drawer>
      <DeleteImageDialog
        imageId={params?.imageId}
        onClose={handleCloseDialog}
        open={params?.action === 'delete'}
      />
    </Stack>
  );
};
