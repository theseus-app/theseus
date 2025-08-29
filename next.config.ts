import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingIncludes: {
    "*": ["./src/server/atlas/resources/**"],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      resourceQuery: { not: [/url/] }, // no *.svg?url
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            exportType: 'default',          
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

    config.module.rules.push({
      test: /\.svg$/i,
      type: 'asset/resource',
      resourceQuery: /url/,
    });

    return config;
  },
};

export default nextConfig;
