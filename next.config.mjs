import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

/**
 * STATIC_PREVIEW=1 이면 GitHub Pages 미리보기용 정적 내보내기(output: 'export') 설정을 쓴다.
 * (scripts/static-preview.mjs 로 서버 전용 영역을 뺀 사본에서만 사용한다)
 */
const staticPreview = process.env.STATIC_PREVIEW === '1';

// 로컬 개발(next dev) 시 Cloudflare 바인딩(Hyperdrive 등)을 사용할 수 있게 한다.
if (!staticPreview) initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = staticPreview
  ? {
      reactStrictMode: true,
      poweredByHeader: false,
      output: 'export',
      trailingSlash: true,
      basePath: process.env.PREVIEW_BASE_PATH || '',
      images: { unoptimized: true },
    }
  : {
      reactStrictMode: true,
      poweredByHeader: false,
      async headers() {
        return [
          {
            source: '/:path*',
            headers: [
              { key: 'X-Content-Type-Options', value: 'nosniff' },
              { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
              { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
            ],
          },
          {
            // 접수 데이터/첨부파일은 색인·캐시 대상이 아니다.
            source: '/(admin|api/admin)/:path*',
            headers: [
              { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
              { key: 'Cache-Control', value: 'no-store' },
            ],
          },
        ];
      },
    };

export default nextConfig;
