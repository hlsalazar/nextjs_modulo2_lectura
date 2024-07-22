/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
          {
            source: '/',
            destination: '/prueba',
            permanent: true,
          },
        ];
      },
};

export default nextConfig;
