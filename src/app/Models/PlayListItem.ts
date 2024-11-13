export interface PlaylistItem {
    id: string;
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        default: {
          url: string;
        },
        maxres:{
          url: string;
        };
      };
      resourceId: {
        videoId: string;
      };
    };
    contentDetails: {
      videoPublishedAt: string;
      videoId: string;
      endAt?: string;
      note?: string;
    };
    status: {
      privacyStatus: string;
    };
  }