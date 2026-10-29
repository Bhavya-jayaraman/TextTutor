/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export const clientActivityService = {
  /**
   * Fetch recent activity log stream for authenticated user.
   */
  async getActivity() {
    const response = await API.get('/activity');
    return response.data;
  },
};
