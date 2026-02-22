# =============================================================================
# Dockerfile - UX Auditor Dashboard
# =============================================================================
# Dockerfile multi-stage para a aplicação Next.js do UX Auditor Dashboard.
# Utiliza uma abordagem de múltiplos estágios para otimizar o tamanho da
# imagem final e melhorar a segurança da aplicação.
# =============================================================================

# =============================================================================
# ESTÁGIO 1: Instalação de Dependências
# =============================================================================
# Usamos uma imagem base com Node.js versão LTS (Alpine para menor tamanho)
# Este estágio é responsável por instalar todas as dependências do projeto
# =============================================================================
FROM node:20-alpine AS deps

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Instala dependências necessárias para compilar pacotes nativos
# Isso é necessário para pacotes como bcrypt, sharp, etc.
RUN apk add --no-cache libc6-compat

# Copia os arquivos de manifesto de dependências primeiro
# Isso permite que o Docker cache a camada de dependências separadamente
COPY package.json package-lock.json* ./

# Instala as dependências do projeto
# --omit=dev seria usado em produção, mas precisamos das devDependencies para o build
RUN npm ci

# =============================================================================
# ESTÁGIO 2: Build da Aplicação
# =============================================================================
# Este estágio compila a aplicação Next.js e gera os arquivos otimizados
# para produção
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copia as dependências instaladas do estágio anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia o código fonte da aplicação
COPY . .

# Define variáveis de ambiente necessárias para o build
# NEXT_TELEMETRY_DISABLED desabilita o envio de dados de telemetria anônimos
ENV NEXT_TELEMETRY_DISABLED=1

# IMPORTANTE: Variáveis de ambiente em tempo de build
# Para aplicações Next.js que usam variáveis de ambiente em tempo de build,
# elas devem ser definidas aqui. No entanto, para segurança, variáveis
# sensíveis devem ser injetadas em tempo de execução via .env.local
# 
# Se você precisar de variáveis em tempo de build, descomente e configure:
# ENV NEXT_PUBLIC_API_URL=https://api.example.com

# Executa o build da aplicação Next.js
RUN npm run build

# =============================================================================
# ESTÁGIO 3: Runner de Produção
# =============================================================================
# Este é o estágio final que será executado em produção
# Copia apenas os arquivos necessários, resultando em uma imagem menor e mais segura
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Define o ambiente como produção
ENV NODE_ENV=production

# Desabilita telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Cria um usuário não-root para executar a aplicação (segurança)
# Isso evita que a aplicação execute como root, reduzindo riscos de segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os arquivos públicos da aplicação
COPY --from=builder /app/public ./public

# Copia os arquivos de build do Next.js
# O Next.js gera uma estrutura específica com .next/standalone para produção
# Se standalone não estiver habilitado, copia todo o diretório .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia arquivos de configuração necessários
# O next.config.ts pode ser necessário para algumas configurações em runtime
COPY --from=builder /app/next.config.ts ./next.config.ts

# Copia a pasta node_modules necessária para produção
# Isso é necessário pois o standalone pode precisar de algumas dependências
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Muda para o usuário não-root
USER nextjs

# Expõe a porta 3001 (conforme definido no docker-compose.yml)
EXPOSE 3001

# Define a porta que a aplicação deve escutar
ENV PORT=3001

# Define o hostname para 0.0.0.0 para aceitar conexões externas
ENV HOSTNAME="0.0.0.0"

# Comando para iniciar a aplicação
# Usa o server.js gerado pelo standalone build ou fallback para npm start
CMD ["node", "server.js"]
