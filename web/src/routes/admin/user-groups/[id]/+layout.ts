import { redirect } from '@sveltejs/kit';
import { getUserGroup } from '$lib/api/user-group.api';
import { UUID_REGEX } from '$lib/constants';
import { Route } from '$lib/route';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { LayoutLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url, { admin: true });

  if (!UUID_REGEX.test(params.id)) {
    redirect(307, Route.userGroups());
  }

  let group;
  try {
    group = await getUserGroup(params.id);
  } catch {
    redirect(307, Route.userGroups());
  }

  const $t = await getFormatter();

  return {
    group,
    meta: {
      title: $t('user_groups'),
    },
  };
}) satisfies LayoutLoad;
