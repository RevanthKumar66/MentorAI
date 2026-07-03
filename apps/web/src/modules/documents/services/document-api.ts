import { supabase } from '@/lib/supabase';
import { Document } from '../store/document-store';

import { getApiBaseUrl } from '@/lib/api-config';

const API_BASE_URL = getApiBaseUrl();

async function getHeaders(isMultipart = false) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export const documentApi = {
  async listDocuments(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<{ items: Document[]; total: number }> {
    const headers = await getHeaders();
    
    // Construct query parameters
    const url = new URL(`${API_BASE_URL}/documents`);
    if (params.page) url.searchParams.append('page', params.page.toString());
    if (params.limit) url.searchParams.append('limit', params.limit.toString());
    if (params.category) url.searchParams.append('category', params.category);
    if (params.search) url.searchParams.append('search', params.search);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || 'Failed to list documents');
    }
    const body = await res.json();
    return {
      items: body.data?.items || [],
      total: body.data?.total || 0,
    };
  },

  async getDownloadUrl(documentId: string, expires_in = 3600): Promise<string> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/documents/${documentId}/download?expires_in=${expires_in}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || 'Failed to get download URL');
    }
    const body = await res.json();
    return body.data?.download_url;
  },

  async deleteDocument(documentId: string): Promise<void> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || 'Failed to delete document');
    }
  },

  async getDocumentDetails(documentId: string): Promise<Document> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || 'Failed to fetch document details');
    }
    const body = await res.json();
    return body.data;
  },

  async getDocumentChunks(documentId: string): Promise<Array<{ id: string; document_id: string; chunk_index: number; content: string; created_at: string }>> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/documents/${documentId}/chunks`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || 'Failed to fetch document chunks');
    }
    const body = await res.json();
    return body.data;
  },

  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Document> {
    const headers = await getHeaders(true);
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/documents/upload`, true);
      
      // Apply authorization and custom headers
      Object.entries(headers).forEach(([key, val]) => {
        xhr.setRequestHeader(key, val);
      });

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const body = JSON.parse(xhr.responseText);
            resolve(body.data);
          } catch (err) {
            reject(new Error('Invalid response format from server'));
          }
        } else {
          try {
            const body = JSON.parse(xhr.responseText);
            reject(new Error(body.message || `Upload failed (Status ${xhr.status})`));
          } catch (e) {
            reject(new Error(`Upload failed with server status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred during file upload'));
      };

      xhr.send(formData);
    });
  }
};
