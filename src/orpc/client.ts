import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type router from "~/orpc/router";

const getORPCClient = (): RouterClient<typeof router> => {
  const link = new RPCLink({
    url: `${window.location.origin}/api/rpc`,
  });
  return createORPCClient(link);
};

export const client: RouterClient<typeof router> = getORPCClient();

export const orpc = createTanstackQueryUtils(client);
