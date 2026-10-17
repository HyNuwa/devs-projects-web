import { Injectable } from '@nestjs/common';

import { safeFetch, type FetchedPlan } from './safe-fetch';

/** Where plans come from; e2e tests replace it so nothing touches the network. */
export abstract class PlanFetcher {
  abstract fetch(url: string): Promise<FetchedPlan>;
}

@Injectable()
export class SafePlanFetcher extends PlanFetcher {
  fetch(url: string) {
    return safeFetch(url);
  }
}
