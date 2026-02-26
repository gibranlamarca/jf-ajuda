/** @type {import('next').NextConfig} */
const nextConfig = {
  // react-leaflet does not support React Strict Mode's double-invocation of effects.
  // Without this, dev mode calls the MapContainer callback ref twice on the same DOM node,
  // causing Leaflet to throw "Map container is already initialized" (_leaflet_id already set).
  reactStrictMode: false,
  transpilePackages: ['react-leaflet'],
}

module.exports = nextConfig
