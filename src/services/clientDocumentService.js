/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import API from './api.js';

export const clientDocumentService = {
  /**
   * Upload a study document (PDF, DOCX, TXT) up to 50MB with non-blocking progress tracking.
   * @param {FormData} formData
   * @param {Function} [onUploadProgress]
   */
  async uploadDocument(formData, onUploadProgress) {
    const response = await API.post('/documents/upload', formData, {
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  /**
   * Fetch all uploaded documents for the authenticated user.
   */
  async getDocuments() {
    const response = await API.get('/documents');
    return response.data;
  },

  /**
   * Fetch a single document by its ID.
   * @param {number|string} id
   */
  async getDocument(id) {
    const response = await API.get(`/documents/${id}`);
    return response.data;
  },

  /**
   * Delete a document and its indexed chunks.
   * @param {number|string} id
   */
  async deleteDocument(id) {
    const response = await API.delete(`/documents/${id}`);
    return response.data;
  },
};
