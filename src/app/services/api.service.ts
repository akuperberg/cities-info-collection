import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api';

export interface TestResponse {
  status: string;
  message: string;
  timestamp: string;
}

export interface CityDetails {
  name: string;
  country: string;
  url: string;
  safetyIndex?: number | null;
  userSentiment?: {
    score: number | null;
    totalReviews: number | null;
  };
  description?: string;
  riskLevel?: string | null;
  relatedCities?: Array<{
    name: string;
    url: string;
    riskLevel?: string | null;
  }>;
}

export interface CityDetailsResponse {
  status: string;
  source: string;
  scrapedAt: string;
  city: CityDetails;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  test(): Observable<TestResponse> {
    return this.http.get<TestResponse>(`${API_URL}/test`);
  }

  getCityDetails(cityUrl: string): Observable<CityDetailsResponse> {
    const params = new HttpParams().set('url', cityUrl);
    return this.http.get<CityDetailsResponse>(`${API_URL}/city`, { params });
  }
}

