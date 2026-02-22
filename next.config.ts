import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilita o modo standalone para Docker
  // Isso gera um server.js otimizado para produção e reduz o tamanho da imagem
  output: "standalone",
};

export default nextConfig;
