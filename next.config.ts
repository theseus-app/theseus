import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingIncludes: {
    "*": ["./src/server/atlas/resources/**"],
  },
  webpack(config) {
    // 1) JS/TS에서 가져온 .svg 는 컴포넌트로 변환
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      resourceQuery: { not: [/url/] }, // *.svg?url 은 제외
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            exportType: 'default',           // 항상 default export로 (중요)
            svgo: true,
            svgoConfig: {
              plugins: [{ name: 'preset-default', params: { overrides: { removeViewBox: false } } }],
            },
            titleProp: true,
            ref: true,
          },
        },
      ],
    });

    // 2) *.svg?url 은 파일 URL로 (Next 기본 에셋 파이프라인)
    config.module.rules.push({
      test: /\.svg$/i,
      type: 'asset/resource',
      resourceQuery: /url/,
    });

    return config;
  },
};

export default nextConfig;
