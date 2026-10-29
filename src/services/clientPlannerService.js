/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export const clientPlannerService = {
  /**
   * Fetch all study plans for authenticated user.
   */
  async getPlans() {
    const response = await API.get('/study-plans');
    return response.data;
  },

  /**
   * Fetch single study plan by ID.
   */
  async getPlan(id) {
    const response = await API.get(`/study-plans/${id}`);
    return response.data;
  },

  /**
   * Create a new study plan.
   */
  async createPlan(payload) {
    const response = await API.post('/study-plans', payload);
    return response.data;
  },

  /**
   * Update an existing study plan.
   */
  async updatePlan(id, payload) {
    const response = await API.put(`/study-plans/${id}`, payload);
    return response.data;
  },

  /**
   * Toggle completion status of a study plan.
   */
  async toggleComplete(id, completed) {
    const response = await API.patch(`/study-plans/${id}/complete`, { completed });
    return response.data;
  },

  /**
   * Delete a study plan.
   */
  async deletePlan(id) {
    const response = await API.delete(`/study-plans/${id}`);
    return response.data;
  },
};
