/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // ffmpeg 실행 파일 경로를 그대로 쓰도록 번들에서 뺀다
  serverExternalPackages: ['ffmpeg-static'],
  experimental: { serverActions: { bodySizeLimit: '8mb' } },
};

export default nextConfig;
