import { getUserGroups } from '$lib/api/user-group.api';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { LayoutLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  const groups = await getUserGroups();
  const $t = await getFormatter();

  return {
    groups,
    meta: {
      title: $t('user_groups'),
    },
  };
}) satisfies LayoutLoad;
