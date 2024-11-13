export interface Video {
    id: string;
    snippet: {
      title: string;
      thumbnails: {
        default: {
          url: string;
        },
        maxres:{
          url: string;
        };
      };
    };
  }