import { supabase } from '@/lib/supabase';
import { schedulingRepository } from '../repositories/SchedulingRepository';
import { CalendarConnection, CalendarEvent } from '../types/scheduling';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export class CalendarIntegrationService {
  private async getHeaders() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async fetchConnection(): Promise<CalendarConnection | null> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch(`${API_BASE_URL}/lifesaver/scheduling/connection`, {
        method: 'GET',
        headers
      });
      if (!res.ok) throw new Error('Failed to retrieve connection');
      const body = await res.json();
      return body.data;
    } catch (err) {
      console.error('fetchConnection error, falling back to repository:', err);
      return schedulingRepository.getConnection();
    }
  }

  async connect(email: string, accessToken?: string, refreshToken?: string, provider: string = 'google'): Promise<any> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/scheduling/connect`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        email, 
        provider,
        ...(accessToken ? { access_token: accessToken } : {}),
        ...(refreshToken ? { refresh_token: refreshToken } : {})
      })
    });
    if (!res.ok) throw new Error('Failed to connect calendar');
    const body = await res.json();
    return body.data;
  }

  async disconnect(): Promise<void> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/scheduling/disconnect`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to disconnect calendar');
  }

  async sync(): Promise<any> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/scheduling/sync`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to sync calendar');
    const body = await res.json();
    return body.data;
  }

  async getEvents(): Promise<CalendarEvent[]> {
    return schedulingRepository.listEvents();
  }
}

export const calendarIntegrationService = new CalendarIntegrationService();
