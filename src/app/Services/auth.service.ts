declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string }) => void;
            error_callback?: (error: any) => void;
          }): {
            requestAccessToken(): void;
          };
        };
      };
    };
  }
}

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private isInitializedSubject = new BehaviorSubject<boolean>(false);

  constructor(private router: Router) {
    this.checkInitialAuth();
  }

  private checkInitialAuth(): void {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.isAuthenticatedSubject.next(true);
      // Optionally navigate to dashboard if token exists on app initialization
      this.router.navigate(['/Dashboard']);
    }
    this.isInitializedSubject.next(true);
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  get isInitialized$(): Observable<boolean> {
    return this.isInitializedSubject.asObservable();
  }

  login(): void {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: environment.googleClientId,
      scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl',
      callback: (response: { access_token?: string }) => {
        if (response.access_token) {
          localStorage.setItem('accessToken', response.access_token);
          this.isAuthenticatedSubject.next(true);
          this.router.navigate(['/Dashboard']);
        }
      },
      error_callback: (error: any) => {
        console.error('Google OAuth error:', error);
        this.isAuthenticatedSubject.next(false);
      }
    });
    
    client.requestAccessToken();
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/']);
  }
}