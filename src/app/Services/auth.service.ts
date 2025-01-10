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

import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private isInitializedSubject = new BehaviorSubject<boolean>(false);
  private autoLogoutTimer?: Subscription;
  private readonly LOGOUT_TIME = 3600000; // 1 hour

  constructor(private router: Router) {
    this.checkInitialAuth();
  }

  private checkInitialAuth(): void {
    const token = localStorage.getItem('accessToken');
    const tokenTimestamp = localStorage.getItem('tokenTimestamp');

    if (token && tokenTimestamp) {
      const elapsed = Date.now() - parseInt(tokenTimestamp, 10);
      
      if (elapsed < this.LOGOUT_TIME) {
        // Token exists and is still valid
        this.isAuthenticatedSubject.next(true);
        this.router.navigate(['/Dashboard']);
        // Start timer for remaining time
        this.startAutoLogoutTimer(this.LOGOUT_TIME - elapsed);
      } else {
        // Token has expired
        this.logout();
      }
    }
    this.isInitializedSubject.next(true);
  }

  private startAutoLogoutTimer(duration: number): void {
    // Clear any existing timer
    if (this.autoLogoutTimer) {
      this.autoLogoutTimer.unsubscribe();
    }
    
    // Start new timer
    this.autoLogoutTimer = timer(duration).subscribe(() => {
      this.logout();
    });
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
          localStorage.setItem('tokenTimestamp', Date.now().toString());
          
          this.isAuthenticatedSubject.next(true);
          this.startAutoLogoutTimer(this.LOGOUT_TIME);
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
    if (this.autoLogoutTimer) {
      this.autoLogoutTimer.unsubscribe();
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenTimestamp');
    
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.autoLogoutTimer) {
      this.autoLogoutTimer.unsubscribe();
    }
  }
}