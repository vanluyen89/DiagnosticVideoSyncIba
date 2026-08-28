import type { SystemStatus } from '@/types';

export const dashboardService = {
  async fetchHealth(): Promise<SystemStatus> {
    return Promise.resolve('online');
  },
};
