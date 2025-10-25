import { imageQueries, useImageQuery, useImagesQuery } from '@linode/queries';
import { getAPIFilterFromQuery } from '@linode/search';
import {
  BetaChip,
  CircleProgress,
  Drawer,
  ErrorState,
  Notice,
  Stack,
} from '@linode/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import * as React from 'react';

import { DebouncedSearchTextField } from 'src/components/DebouncedSearchTextField';
import { DocumentTitleSegment } from 'src/components/DocumentTitle';
import { Link } from 'src/components/Link';
import { SuspenseLoader } from 'src/components/SuspenseLoader';
import { SafeTabPanel } from 'src/components/Tabs/SafeTabPanel';
import { Tab } from 'src/components/Tabs/Tab';
import { TabList } from 'src/components/Tabs/TabList';
import { TabPanels } from 'src/components/Tabs/TabPanels';
import { Tabs } from 'src/components/Tabs/Tabs';
// import { usePermissions } from 'src/features/IAM/hooks/usePermissions';
import { useOrderV2 } from 'src/hooks/useOrderV2';
import { usePaginationV2 } from 'src/hooks/usePaginationV2';
import {
  isEventImageUpload,
  isEventInProgressDiskImagize,
} from 'src/queries/events/event.helpers';
import { useEventsInfiniteQuery } from 'src/queries/events/events';

import {
  AUTOMATIC_IMAGES_DEFAULT_ORDER,
  AUTOMATIC_IMAGES_DEFAULT_ORDER_BY,
  AUTOMATIC_IMAGES_ORDER_PREFERENCE_KEY,
  AUTOMATIC_IMAGES_PREFERENCE_KEY,
  MANUAL_IMAGES_DEFAULT_ORDER,
  MANUAL_IMAGES_DEFAULT_ORDER_BY,
  MANUAL_IMAGES_PREFERENCE_KEY,
} from '../constants';
import {
  DEFAULT_IMAGES_SUBTYPE,
  getEventsForImages,
  useImagesSubTabs,
} from '../utils';
import { DeleteImageDialog } from './DeleteImageDialog';
import { EditImageDrawer } from './EditImageDrawer';
import { ManageImageReplicasForm } from './ImageRegions/ManageImageRegionsForm';
import { ImagesTable } from './ImagesTable';
import { RebuildImageDrawer } from './RebuildImageDrawer';

import type { Handlers as ImageHandlers } from './ImagesActionMenu';
import type { Filter, Image } from '@linode/api-v4';
import type { ImageAction } from 'src/routes/images';

export const ImagesLandingTable = () => {
  const navigate = useNavigate();

  const baseParams = useParams({
    from: '/images/images/$subType',
    shouldThrow: false,
  });
  const params = useParams({
    from: '/images/images/$subType/$imageId/$action',
    shouldThrow: false,
  });

  // const { data: permissions } = usePermissions('account', ['create_image']);
  // const canCreateImage = permissions?.create_image;

  const search = useSearch({ from: '/images' });
  const { subTabIndex, subTabs } = useImagesSubTabs(baseParams?.subType);

  const { query } = search;

  const queryClient = useQueryClient();

  /**
   * At the time of writing: `label`, `tags`, `size`, `status`, `region` are filterable.
   *
   * Some fields like `status` and `region` can't be used in complex filters using '+or' / '+and'
   *
   * Using `tags` in a '+or' is currently broken. See ARB-5792
   */
  const { error: searchParseError, filter } = getAPIFilterFromQuery(query, {
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
  });

  const paginationForManualImages = usePaginationV2({
    currentRoute: '/images',
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
      from: '/images',
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
      // Refetch custom images every 30 seconds.
      // We do this because we have no /v4/account/events we can use
      // to update Image region statuses. We should make the API
      // team and Images team implement events for this.
      refetchInterval: 30_000,
      // If we have a search query, disable retries to keep the UI
      // snappy if the user inputs an invalid X-Filter. Otherwise,
      // pass undefined to use the default retry behavior.
      retry: query ? false : undefined,
    }
  );

  // Pagination, order, and query hooks for automatic/recovery images
  const paginationForAutomaticImages = usePaginationV2({
    currentRoute: '/images',
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
      from: '/images',
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
      // If we have a search query, disable retries to keep the UI
      // snappy if the user inputs an invalid X-Filter. Otherwise,
      // pass undefined to use the default retry behavior.
      retry: query ? false : undefined,
    }
  );

  const {
    data: selectedImage,
    isLoading: isFetchingSelectedImage,
    error: selectedImageError,
  } = useImageQuery(params?.imageId ?? '', !!params?.imageId);

  const { events } = useEventsInfiniteQuery();

  const imageEvents =
    events?.filter(
      (event) =>
        isEventInProgressDiskImagize(event) || isEventImageUpload(event)
    ) ?? [];

  // Private images with the associated events tied in.
  const manualImagesEvents = getEventsForImages(
    manualImages?.data ?? [],
    imageEvents
  );

  // Automatic images with the associated events tied in.
  const automaticImagesEvents = getEventsForImages(
    automaticImages?.data ?? [],
    imageEvents
  );

  const actionHandler = (image: Image, action: ImageAction) => {
    navigate({
      params: {
        action,
        imageId: image.id,
        subType: subTabs[subTabIndex]['type'],
      },
      search: (prev) => prev,
      to: '/images/images/$subType/$imageId/$action',
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
      search: (prev) => prev,
      to: '/images/images/$subType',
      params: { subType: baseParams?.subType ?? DEFAULT_IMAGES_SUBTYPE },
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

  const onSearch = (query: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        page: undefined,
        query: query || undefined,
      }),
      params: { subType: subTabs[subTabIndex]['type'] },
      to: '/images/images/$subType',
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

  if (manualImagesLoading || automaticImagesLoading) {
    return <CircleProgress />;
  }

  if (!query && (manualImagesError || automaticImagesError)) {
    return (
      <React.Fragment>
        <DocumentTitleSegment segment="Images" />
        <ErrorState errorText="There was an error retrieving your images. Please reload and try again." />
      </React.Fragment>
    );
  }

  // @todo - Check If we need ImagesLandingEmptyState
  // if (manualImages?.results === 0 && automaticImages?.results === 0 && !query) {
  //   return <ImagesLandingEmptyState />;
  // }

  const isFetching = manualImagesIsFetching || automaticImagesIsFetching;

  const customImages = (
    <ImagesTable
      columns={[
        { header: 'Image', label: 'label', sortable: true },
        {
          header: 'Status',
          hiddenProps: { smDown: true },
        },
        {
          header: 'Replicated in',
          hiddenProps: { smDown: true },
        },
        { header: 'Original Image', label: 'size', sortable: true },
        {
          header: 'All Replicas',
          hiddenProps: { mdDown: true },
        },
        {
          header: 'Created',
          label: 'created',
          sortable: true,
          hiddenProps: { mdDown: true },
        },
        {
          header: 'Image ID',
          hiddenProps: { mdDown: true },
        },
      ]}
      emptyMessage="No Custom Images to display."
      error={manualImagesError}
      eventCategory="Custom Images Table"
      events={manualImagesEvents}
      handleOrderChange={handleManualImagesOrderChange}
      handlers={handlers}
      headerProps={{
        title: 'Custom Images',
        description: (
          <>
            These are{' '}
            <Link to="https://techdocs.akamai.com/cloud-computing/docs/capture-an-image#capture-an-image">
              encrypted
            </Link>{' '}
            images you manually uploaded or captured from an existing compute
            instance disk.
          </>
        ),
      }}
      images={manualImages?.data ?? []}
      order={manualImagesOrder}
      orderBy={manualImagesOrderBy}
      pagination={{
        page: paginationForManualImages.page,
        pageSize: paginationForManualImages.pageSize,
        count: manualImages?.results ?? 0,
        handlePageChange: paginationForManualImages.handlePageChange,
        handlePageSizeChange: paginationForManualImages.handlePageSizeChange,
      }}
      query={query}
    />
  );

  const recoveryImages = (
    <ImagesTable
      columns={[
        { header: 'Image', label: 'label', sortable: true },
        {
          header: 'Status',
          hiddenProps: { smDown: true },
        },
        { header: 'Size', label: 'size', sortable: true },
        {
          header: 'Created',
          label: 'created',
          sortable: true,
          hiddenProps: { smDown: true },
        },
        {
          header: 'Expires',
          hiddenProps: { smDown: true },
        },
      ]}
      emptyMessage="No Recovery Images to display."
      error={automaticImagesError}
      eventCategory="Recovery Images Table"
      events={automaticImagesEvents}
      handleOrderChange={handleAutomaticImagesOrderChange}
      handlers={handlers}
      headerProps={{
        title: 'Recovery Images',
        description: (
          <>
            These are images we automatically capture when Linode disks are
            deleted. They will be deleted after the indicated expiration date.
          </>
        ),
      }}
      images={automaticImages?.data ?? []}
      order={automaticImagesOrder}
      orderBy={automaticImagesOrderBy}
      pagination={{
        page: paginationForAutomaticImages.page,
        pageSize: paginationForAutomaticImages.pageSize,
        count: manualImages?.results ?? 0,
        handlePageChange: paginationForAutomaticImages.handlePageChange,
        handlePageSizeChange: paginationForAutomaticImages.handlePageSizeChange,
      }}
      query={query}
    />
  );

  const onTabChange = (index: number) => {
    // Update the "subType" query param. (This switches between "My custom images", "Shared with me" and "Recovery images" tabs).
    navigate({
      params: { subType: subTabs[index]['type'] },
      to: `/images/images/$subType`,
    });
  };

  return (
    <Stack spacing={3}>
      <DebouncedSearchTextField
        clearable
        errorText={searchParseError?.message}
        hideLabel
        isSearching={isFetching}
        label="Search"
        onSearch={onSearch}
        placeholder="Search Images"
        value={query ?? ''}
      />
      <Tabs index={subTabIndex} onChange={onTabChange}>
        <TabList>
          {subTabs.map((tab) => (
            <Tab key={`images-${tab.type}`}>
              {tab.title} {tab.isBeta ? <BetaChip /> : null}
            </Tab>
          ))}
        </TabList>
        <React.Suspense fallback={<SuspenseLoader />}>
          <TabPanels>
            {subTabs.map((tab, idx) => (
              <SafeTabPanel index={idx} key={`images-${tab.type}-content`}>
                {tab.type === 'custom' && customImages}
                {tab.type === 'shared' && (
                  <Notice variant="info">
                    Share with me is coming soon...
                  </Notice>
                )}
                {tab.type === 'recovery' && recoveryImages}
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
