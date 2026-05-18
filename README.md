# YTClipper

YTClipper is a simple, rights-aware YouTube media utility built with Next.js 14. It allows users to process YouTube videos they own, have permission to use, or that are licensed for reuse. 

This repository contains the MVP code, showcasing a clean, mobile-first design focused on user experience and SEO.

## Setup Instructions

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `NEXT_PUBLIC_APP_URL`: The base URL of your application (e.g., http://localhost:3000)
- `YOUTUBE_API_KEY`: Required if implementing the real YouTube Data API.
- Storage/S3 and Redis variables are included as placeholders for future production enhancements.

## Mock Services

For this MVP, media processing (MP4, MP3) and transcript extraction rely on **mock service abstractions** located in `src/lib/services/`. This allows the application to be deployed on free infrastructure (like Vercel's free tier) without requiring a complex backend FFmpeg server setup. 

To replace mocks with real implementations:
1. **YouTube Metadata**: Update `getVideoMetadata` in `youtubeService.ts` to use the official Google YouTube Data API or an open-source scraper like `ytdl-core`.
2. **Media Processing**: Update `prepareMp4Download` and `extractMp3Audio` in `mediaService.ts` to enqueue a job to a real worker running `fluent-ffmpeg` or call a third-party API.
3. **Transcripts**: Update `transcriptService.ts` to use a library like `youtube-transcript`.

## Deployment

This app is ready to be deployed to Vercel:
1. Push your code to GitHub.
2. Import the project into Vercel.
3. Add the required environment variables.
4. Deploy!

## Compliance Warning

> **WARNING**: Only download or process videos you own, have permission to use, or that are licensed for reuse. This tool does not support bypassing DRM, private access, paywalls, or platform restrictions. Ensure your use of this software complies with YouTube's Terms of Service and local copyright laws.
