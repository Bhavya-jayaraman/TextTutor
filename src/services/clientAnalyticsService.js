/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export const clientAnalyticsService = {
  /**
   * Fetch authenticated user's real analytics overview.
   */
  async getAnalytics() {
    const response = await API.get('/analytics');
    return response.data;
  },
};
