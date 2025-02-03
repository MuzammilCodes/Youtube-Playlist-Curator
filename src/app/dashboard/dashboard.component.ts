import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../Services/auth.service';
import { Playlist } from '../Models/Playlist';
import { Video } from '../Models/Video';
import { PlaylistItem } from '../Models/PlayListItem';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  playlists: Playlist[] = [];
  videos: PlaylistItem[] = [];
  selectedVideos = new Set<string>();
  loading = false;
  selectedPlaylistId = '';

  constructor(
    private http: HttpClient,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.auth.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.fetchPlaylists();
      }
    });
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  async fetchPlaylists() {
    try {
      this.loading = true;
      const response = await this.http.get<any>(
        'https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50',
        { headers: this.getHeaders() }
      ).toPromise();
      this.playlists = response.items || [];
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      this.loading = false;
    }
  }

  async fetchPlaylistVideos(playlistId: string) {
    try {
      this.loading = true;
      const response = await this.http.get<any>(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails,status&playlistId=${playlistId}&maxResults=50`,
        { headers: this.getHeaders() }
      ).toPromise();
      this.videos = response.items || [];
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      this.loading = false;
    }
  }

  
  onPlaylistChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedPlaylistId = select.value;
    if (this.selectedPlaylistId) {
      this.fetchPlaylistVideos(this.selectedPlaylistId);
    }
  }

  toggleVideoSelection(videoId: string) {
    if (this.selectedVideos.has(videoId)) {
      this.selectedVideos.delete(videoId);
    } else {
      this.selectedVideos.add(videoId);
    }
  }

  async removeSelectedVideos() {
    try {
      this.loading = true;
      for (const videoId of this.selectedVideos) {
        await this.http.delete(
          `https://www.googleapis.com/youtube/v3/playlistItems?id=${videoId}`,
          { headers: this.getHeaders() }
        ).toPromise();
      }
      await this.fetchPlaylistVideos(this.selectedPlaylistId);
      this.selectedVideos.clear();
    } catch (error) {
      console.error('Error removing videos:', error);
    } finally {
      this.loading = false;
    }
  }
}
