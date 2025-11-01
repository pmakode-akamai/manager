import { CircleProgress, ErrorState } from '@linode/ui';
import { useNavigate, useSearch } from '@tanstack/react-router';
import * as React from 'react';

import { DebouncedSearchTextField } from 'src/components/DebouncedSearchTextField';
import { DocumentTitleSegment } from 'src/components/DocumentTitle';
import { usePermissions } from 'src/features/IAM/hooks/usePermissions';
import {
  isEventImageUpload,
  isEventInProgressDiskImagize,
} from 'src/queries/events/event.helpers';
import { useEventsInfiniteQuery } from 'src/queries/events/events';

import { getEventsForImages, type ImagesVariant } from '../../utils';
import { IMAGES_CONFIG } from './imagesConfig';
import { ImagesTable } from './ImagesTable';

import type { Handlers as ImageHandlers } from '../ImagesActionMenu';
import type { APIError, Image, ResourcePage } from '@linode/api-v4';
import type { Order } from 'src/hooks/useOrderV2';

interface Props {
  handleImagesOrderChange: (newOrderBy: string, newOrder: Order) => void;
  handlers: ImageHandlers;
  images: ResourcePage<Image> | undefined;
  imagesError?: APIError[] | null;
  imagesIsFetching?: boolean;
  imagesLoading?: boolean;
  imagesOrder: Order;
  imagesOrderBy: string;
  paginationForImages: {
    handlePageChange: (newPage: number) => void;
    handlePageSizeChange: (newSize: number) => void;
    page: number;
    pageSize: number;
  };
  searchErrorText?: string;
  variant: Exclude<ImagesVariant, 'shared'>;
}

export const ImagesView = (props: Props) => {
  const {
    handlers,
    variant,
    imagesError,
    handleImagesOrderChange,
    images,
    imagesOrder,
    imagesOrderBy,
    searchErrorText,
    imagesIsFetching,
    imagesLoading,
    paginationForImages,
  } = props;

  const config = IMAGES_CONFIG[variant];

  const navigate = useNavigate();
  const search = useSearch({ from: '/images' });

  const { data: permissions } = usePermissions('account', ['create_image']);
  const canCreateImage = permissions?.create_image;

  const { events } = useEventsInfiniteQuery();

  const imageEvents =
    events?.filter(
      (event) =>
        isEventInProgressDiskImagize(event) || isEventImageUpload(event)
    ) ?? [];

  // Images with the associated events tied in.
  const imagesEvents = getEventsForImages(images?.data ?? [], imageEvents);

  const onSearch = (query: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        page: undefined,
        query: query || undefined,
        // Ensure there's a subType query when searching,
        // so that only the individual sub-tab query executes using this subType.
        subType: search.subType ?? 'custom',
      }),
      to: '/images/images',
    });
  };

  if (imagesLoading) {
    return <CircleProgress />;
  }

  if (!search.query && imagesError) {
    return (
      <React.Fragment>
        <DocumentTitleSegment segment="Images" />
        <ErrorState errorText="There was an error retrieving your images. Please reload and try again." />
      </React.Fragment>
    );
  }

  return (
    <>
      <DebouncedSearchTextField
        clearable
        containerProps={{
          sx: {
            mb: 2,
          },
        }}
        errorText={searchErrorText}
        hideLabel
        isSearching={imagesIsFetching}
        label="Search"
        onSearch={onSearch}
        placeholder="Search Images"
        value={search.query ?? ''}
      />
      <ImagesTable
        columns={config.columns}
        emptyMessage={config.emptyMessage}
        error={imagesError}
        eventCategory={config.eventCategory}
        events={imagesEvents}
        handleOrderChange={handleImagesOrderChange}
        handlers={handlers}
        headerProps={{
          title: config.title,
          buttonProps: config.buttonProps
            ? {
                buttonText: config.buttonProps.buttonText,
                onButtonClick: () =>
                  navigate({
                    search: () => ({}),
                    to: config.buttonProps?.navigateTo ?? '/',
                  }),
                disabled: !canCreateImage,
                tooltipText: !canCreateImage
                  ? config.buttonProps.disabledToolTipText
                  : undefined,
              }
            : undefined,
          docsLink: config.docsLink,
          description: config.description,
        }}
        images={images?.data ?? []}
        order={imagesOrder}
        orderBy={imagesOrderBy}
        pagination={{
          page: paginationForImages.page,
          pageSize: paginationForImages.pageSize,
          count: images?.results ?? 0,
          handlePageChange: paginationForImages.handlePageChange,
          handlePageSizeChange: paginationForImages.handlePageSizeChange,
        }}
        query={search.query}
      />
    </>
  );
};
