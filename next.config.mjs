/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
          {
            source: '/',
            destination: '/pages/nueva',
            permanent: true,
          },
        ];
      },
};

export default nextConfig;
