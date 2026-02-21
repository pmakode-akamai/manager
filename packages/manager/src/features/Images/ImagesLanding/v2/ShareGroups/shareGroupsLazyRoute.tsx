import { createLazyRoute } from '@tanstack/react-router';

import { ShareGroups } from './ShareGroups';

export const shareGroupsLazyRoute = createLazyRoute('/images/share-groups')({
  component: ShareGroups,
});
