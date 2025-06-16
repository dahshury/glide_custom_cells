/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      react: require("path").resolve(__dirname, "node_modules/react"),
      "react-dom": require("path").resolve(__dirname, "node_modules/react-dom"),
    };
    return config;
  },
};

module.exports = nextConfig; 