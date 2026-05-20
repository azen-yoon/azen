import type { NextConfig } from "next";

/**
 * next/image 허용 원격 호스트.
 * 외부 URL로 썸네일/이미지를 넣는 경우 여기에 호스트(또는 상위 도메인 패턴)를 추가한다.
 */
const imageRemotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "postfiles.pstatic.net" },
  { protocol: "http", hostname: "postfiles.pstatic.net" },

  { protocol: "https", hostname: "i.imgur.com" },
  { protocol: "https", hostname: "imgur.com" },
  { protocol: "https", hostname: "m.imgur.com" },

  { protocol: "https", hostname: "res.cloudinary.com" },
  { protocol: "https", hostname: "**.cloudinary.com" },

  { protocol: "https", hostname: "lh3.googleusercontent.com" },
  { protocol: "https", hostname: "lh4.googleusercontent.com" },
  { protocol: "https", hostname: "lh5.googleusercontent.com" },
  { protocol: "https", hostname: "lh6.googleusercontent.com" },
  { protocol: "https", hostname: "**.googleusercontent.com" },

  { protocol: "https", hostname: "imagedelivery.net" },

  { protocol: "https", hostname: "fdwlnepslsqlfcvdeyqp.supabase.co" },

  { protocol: "https", hostname: "picsum.photos" },
  { protocol: "https", hostname: "placehold.co" },
  { protocol: "https", hostname: "via.placeholder.com" },

  { protocol: "https", hostname: "raw.githubusercontent.com" },
  { protocol: "https", hostname: "user-images.githubusercontent.com" },
  { protocol: "https", hostname: "avatars.githubusercontent.com" },

  { protocol: "https", hostname: "www.capfil.co.kr" },
  { protocol: "http", hostname: "www.capfil.co.kr" },
  { protocol: "https", hostname: "gi.esmplus.com" },
  { protocol: "http", hostname: "gi.esmplus.com" },
  { protocol: "https", hostname: "ko.dagaotech.com" },
  { protocol: "http", hostname: "ko.dagaotech.com" },
  {
    protocol: "https",
    hostname: "www.ecsfilter.com",
    pathname: "/upload/**",
  },
  {
    protocol: "http",
    hostname: "www.daewonvalvetech.com",
    pathname: "/wp-content/**",
  },
  {
    protocol: "https",
    hostname: "www.daewonvalvetech.com",
    pathname: "/wp-content/**",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageRemotePatterns,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
