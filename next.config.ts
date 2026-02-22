import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
};

const usePWA = process.env.SKIP_PWA !== "1";
export default usePWA
  ? require("@ducanh2912/next-pwa").default({ dest: "public", disable: process.env.NODE_ENV === "development" })(nextConfig)
  : nextConfig;
