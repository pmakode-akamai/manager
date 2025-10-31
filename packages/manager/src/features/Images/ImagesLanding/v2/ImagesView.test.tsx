import userEvent from '@testing-library/user-event';
import * as React from 'react';

import { imageFactory } from 'src/factories';
import { makeResourcePage } from 'src/mocks/serverHandlers';
import { mockMatchMedia, renderWithTheme } from 'src/utilities/testHelpers';

import { ImagesView } from './ImagesView';

const queryMocks = vi.hoisted(() => ({
  useLocation: vi.fn(),
  usePermissions: vi.fn().mockReturnValue({ data: { create_image: false } }),
  useQueryWithPermissions: vi.fn().mockReturnValue({}),
  useLinodesPermissionsCheck: vi.fn().mockReturnValue({}),
  useSearch: vi.fn(),
}));

vi.mock('src/features/IAM/hooks/usePermissions', () => ({
  usePermissions: queryMocks.usePermissions,
  useQueryWithPermissions: queryMocks.useQueryWithPermissions,
}));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useLocation: queryMocks.useLocation,
    useSearch: queryMocks.useSearch,
  };
});

vi.mock('../utils.ts', async () => {
  const actual = await vi.importActual('../utils');
  return {
    ...actual,
    useLinodesPermissionsCheck: queryMocks.useLinodesPermissionsCheck,
  };
});

const mockHandlers = {
  onDelete: vi.fn(),
  onDeploy: vi.fn(),
  onEdit: vi.fn(),
  onRebuild: vi.fn(),
  onManageReplicas: vi.fn(),
};

const defaultProps = {
  handleImagesOrderChange: vi.fn(),
  handlers: mockHandlers,
  images: undefined,
  imagesError: null,
  imagesIsFetching: false,
  imagesLoading: false,
  imagesOrder: 'asc' as const,
  imagesOrderBy: '',
  paginationForImages: {
    handlePageChange: vi.fn(),
    handlePageSizeChange: vi.fn(),
    page: 1,
    pageSize: 25,
  },
  searchErrorText: undefined,
  variant: 'custom' as const,
};

beforeAll(() => mockMatchMedia());

describe('ImagesView component', () => {
  beforeEach(() => {
    queryMocks.usePermissions.mockReturnValue({
      data: {
        update_image: true,
        delete_image: true,
        rebuild_linode: true,
        create_linode: true,
        replicate_image: true,
      },
    });

    queryMocks.useLocation.mockReturnValue({
      pathname: '/images/images',
    });
    queryMocks.useSearch.mockReturnValue({});
  });

  // For Custom Images
  describe('For Custom Images', () => {
    it("should render 'My custom images' tab with items", async () => {
      const images = imageFactory.buildList(3, {
        regions: [
          { region: 'us-east', status: 'available' },
          { region: 'us-southeast', status: 'pending' },
        ],
      });

      const imagesResource = makeResourcePage(images);

      const { getByText } = renderWithTheme(
        <ImagesView
          {...defaultProps}
          images={imagesResource}
          variant="custom"
        />
      );

      // Custom Images table should render
      getByText('My Custom Images');

      // Static text and table column headers
      expect(getByText('Image')).toBeVisible();
      expect(getByText('Replicated in')).toBeVisible();
      expect(getByText('Original Image')).toBeVisible();
      expect(getByText('All Replicas')).toBeVisible();
      expect(getByText('Created')).toBeVisible();
      expect(getByText('Image ID')).toBeVisible();
    });

    it("should render 'My custom images' (manual) empty state", async () => {
      const imagesResourceEmpty = makeResourcePage([]);

      const { findByText } = renderWithTheme(
        <ImagesView
          {...defaultProps}
          images={imagesResourceEmpty}
          variant="custom"
        />
      );

      expect(await findByText('No Custom Images to display.')).toBeVisible();
    });

    it('disables the action menu buttons if user does not have permissions to edit images', async () => {
      queryMocks.usePermissions.mockReturnValue({
        data: { create_image: false },
      });
      const image = imageFactory.build({
        id: 'private/99999',
        label: 'vi-test-image',
      });
      queryMocks.useLinodesPermissionsCheck.mockReturnValue({
        availableLinodes: [],
      });

      const imagesResource = makeResourcePage([image]);

      const { findByLabelText } = renderWithTheme(
        <ImagesView
          {...defaultProps}
          images={imagesResource}
          variant="custom"
        />
      );

      const actionMenu = await findByLabelText(
        `Action menu for Image ${image.label}`
      );

      await userEvent.click(actionMenu);

      const disabledEditText = await findByLabelText(
        "You don't have permissions to edit this Image. Please contact your account administrator to request the necessary permissions."
      );
      const disabledDeleteText = await findByLabelText(
        "You don't have permissions to delete this Image. Please contact your account administrator to request the necessary permissions."
      );
      const disabledLinodeCreationText = await findByLabelText(
        "You don't have permissions to create Linodes. Please contact your account administrator to request the necessary permissions."
      );

      expect(disabledEditText).toBeVisible();
      expect(disabledDeleteText).toBeVisible();
      expect(disabledLinodeCreationText).toBeVisible();
    });

    it('should disable create button if user lacks create_image permission', async () => {
      queryMocks.usePermissions.mockReturnValue({
        data: { create_image: false },
      });

      const { getByText } = renderWithTheme(
        <ImagesView {...defaultProps} variant="custom" />
      );

      const createButton = getByText('Create Image');
      expect(createButton).toBeDisabled();
      expect(createButton).toHaveAttribute(
        'data-qa-tooltip',
        "You don't have permissions to create Images. Please contact your account administrator to request the necessary permissions."
      );
    });

    it('should enable create button if user has create_image permission', async () => {
      queryMocks.usePermissions.mockReturnValue({
        data: { create_image: true },
      });

      const { getByText } = renderWithTheme(
        <ImagesView {...defaultProps} variant="custom" />
      );

      const createButton = getByText('Create Image');
      expect(createButton).toBeEnabled();
    });
  });

  // For Recovery Images
  describe('For Recovery Images', () => {
    it("should render 'Recovery images tab' with items", async () => {
      const images = imageFactory.buildList(3, {
        regions: [
          { region: 'us-east', status: 'available' },
          { region: 'us-southeast', status: 'pending' },
        ],
      });

      const imagesResource = makeResourcePage(images);

      const { getByText } = renderWithTheme(
        <ImagesView
          {...defaultProps}
          images={imagesResource}
          variant="recovery"
        />
      );

      // Recovery Images table should render
      getByText('Recovery Images');

      // Static text and table column headers
      expect(getByText('Image')).toBeVisible();
      expect(getByText('Status')).toBeVisible();
      expect(getByText('Size')).toBeVisible();
      expect(getByText('Created')).toBeVisible();
      expect(getByText('Expires')).toBeVisible();
    });

    it("should render 'Recovery images' (automatic) empty state", async () => {
      const imagesResourceEmpty = makeResourcePage([]);

      const { findByText } = renderWithTheme(
        <ImagesView
          {...defaultProps}
          images={imagesResourceEmpty}
          variant="recovery"
        />
      );

      expect(await findByText('No Recovery Images to display.')).toBeVisible();
    });

    it('disables the action menu buttons if user does not have permissions to edit images', async () => {
      queryMocks.usePermissions.mockReturnValue({
        data: { create_image: false },
      });
      const image = imageFactory.build({
        id: 'private/99999',
        label: 'vi-test-image',
        type: 'automatic',
      });
      queryMocks.useLinodesPermissionsCheck.mockReturnValue({
        availableLinodes: [],
      });

      const imagesResource = makeResourcePage([image]);

      const { findByLabelText } = renderWithTheme(
        <ImagesView
          {...defaultProps}
          images={imagesResource}
          variant="recovery"
        />
      );

      const actionMenu = await findByLabelText(
        `Action menu for Image ${image.label}`
      );

      await userEvent.click(actionMenu);

      const disabledEditText = await findByLabelText(
        "You don't have permissions to edit this Image. Please contact your account administrator to request the necessary permissions."
      );
      const disabledDeleteText = await findByLabelText(
        "You don't have permissions to delete this Image. Please contact your account administrator to request the necessary permissions."
      );
      const disabledLinodeCreationText = await findByLabelText(
        "You don't have permissions to create Linodes. Please contact your account administrator to request the necessary permissions."
      );

      expect(disabledEditText).toBeVisible();
      expect(disabledDeleteText).toBeVisible();
      expect(disabledLinodeCreationText).toBeVisible();
    });
  });
});
