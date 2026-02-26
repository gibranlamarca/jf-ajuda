# JF Ajuda — Mapa de Emergência

Aplicação web colaborativa para mapear pedidos de ajuda durante emergências civis em **Juiz de Fora, MG, Brasil**.

- Qualquer pessoa pode criar um pedido de ajuda **sem criar conta**
- Marcadores no mapa para pedidos abertos e resolvidos
- Sistema de resolução com código secreto ou confirmação coletiva (3 votos)
- Filtros por tipo de ajuda, urgência, bairro e status

---

## Como rodar localmente

### Pré-requisitos
- Node.js 18+
- npm 9+

### Passos

```bash
# 1. Clone o repositório
git clone <url-do-repo>
cd jf-ajuda

# 2. Instale as dependências (gera o Prisma Client automaticamente)
npm install

# 3. Copie o .env de exemplo e configure
cp .env.example .env.local
# Edite .env.local se necessário (padrão: SQLite local, sem config extra)

# 4. Crie o banco de dados e aplique as migrations
DATABASE_URL="file:./dev.db" npx prisma migrate dev --name init

# 5. (Opcional) Carregue dados de exemplo
DATABASE_URL="file:./dev.db" npx prisma db seed

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

> **Nota:** O `DATABASE_URL` é lido do `.env.local` em tempo de execução do Next.js. Para comandos Prisma no terminal, passe a variável explicitamente como mostrado acima, ou exporte: `export DATABASE_URL="file:./dev.db"`.

---

## Tokens de resolução de exemplo (após seed)

| Pedido | Token |
|--------|-------|
| Família sem água | `demo-token-001` |
| Abrigo improvisado | `demo-token-002` |
| Idosa sozinha | `demo-token-003` |
| Cão ferido | `demo-token-004` |
| Família sem roupas | `demo-token-005` |
| Voluntários | `demo-token-006` |
| Ponto de remédios | `demo-token-007` |

---

## Scripts disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servir build de produção
npm run db:migrate   # Aplicar migrations Prisma
npm run db:seed      # Popular banco com dados de exemplo
npm run db:studio    # Abrir Prisma Studio (GUI do banco)
```

---

## Como fazer deploy no Vercel

> **Atenção:** SQLite não persiste no filesystem serverless do Vercel. Para produção, use PostgreSQL (veja abaixo).

### Com PostgreSQL (recomendado para produção)

1. Crie um banco PostgreSQL (ex: [Neon](https://neon.tech), [Supabase](https://supabase.com), [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres))

2. Atualize o `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Configure a variável de ambiente no Vercel:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
```

4. Execute a migration:
```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

5. Faça o deploy:
```bash
npx vercel --prod
```

### Com SQLite (apenas para demonstrações)

O SQLite funciona localmente, mas não persiste entre deploys serverless. Use apenas para testes.

---

## Estrutura do projeto

```
jf-ajuda/
├── prisma/
│   ├── schema.prisma          # Modelos do banco
│   └── seed.ts                # Dados de exemplo
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── requests/      # CRUD de pedidos
│   │   │   └── geocode/       # Proxy para Nominatim
│   │   ├── requests/[id]/     # Página de detalhes
│   │   ├── layout.tsx
│   │   └── page.tsx           # Mapa + lista principal
│   ├── components/
│   │   ├── map/               # MapView, LocationPicker, MiniMapPreview
│   │   ├── CreateRequestModal.tsx
│   │   ├── FilterBar.tsx
│   │   ├── RequestCard.tsx
│   │   ├── RequestList.tsx
│   │   └── ResolveModal.tsx
│   ├── lib/
│   │   ├── db.ts              # Prisma singleton
│   │   ├── token.ts           # Geração e hash de tokens
│   │   ├── rateLimit.ts       # Rate limiting em memória
│   │   ├── nominatim.ts       # Geocoding com cache
│   │   └── validations.ts     # Schemas Zod
│   └── types/
│       └── index.ts           # Tipos compartilhados
└── .env.example
```

---

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/requests` | Listar com filtros e paginação |
| `POST` | `/api/requests` | Criar pedido (retorna token) |
| `GET` | `/api/requests/:id` | Detalhes de um pedido |
| `POST` | `/api/requests/:id/resolve` | Resolver com token |
| `POST` | `/api/requests/:id/confirm` | Confirmar que ajuda chegou |
| `POST` | `/api/requests/:id/report` | Reportar pedido abusivo |
| `GET` | `/api/geocode?q=` | Busca de endereço (Nominatim) |

### Filtros disponíveis (GET /api/requests)

```
?status=OPEN|RESOLVED
?types=Alimentos,Água
?urgencyMin=3&urgencyMax=5
?neighborhood=Cascatinha
?q=texto
?page=1&pageSize=20
```

---

## Segurança e anti-abuso

- **Rate limiting:** máximo 5 pedidos por IP a cada 10 minutos (configurável via `RATE_LIMIT_MAX` e `RATE_LIMIT_WINDOW_MS`)
- **Honeypot:** campo oculto no formulário — bots que preencherem têm a requisição rejeitada
- **Token de resolução:** hash SHA-256 do token é salvo no banco; o token raw é mostrado apenas uma vez ao criador
- **Comparação timing-safe:** `crypto.timingSafeEqual` para prevenir timing attacks
- **IP hashing:** IPs são hashados com SHA-256 + salt antes de salvar para confirmações e denúncias
- **Confirmação coletiva:** resolução automática após 3 confirmações de IPs distintos

### Para produção adicional

- Adicionar [hCaptcha](https://hcaptcha.com) ou [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) ao formulário
- Migrar rate limiting para Redis (para ambiente multi-instância)
- Implementar moderação de pedidos com muitos reports
- Adicionar HTTPS obrigatório + cabeçalhos de segurança

---

## Geocoding (Nominatim / OpenStreetMap)

Esta aplicação usa a API **Nominatim** do OpenStreetMap para busca e geocoding de endereços — sem necessidade de chave de API.

Respeitamos a [Política de Uso](https://operations.osmfoundation.org/policies/nominatim/) da Nominatim:
- User-Agent identificado: `jf-ajuda/1.0`
- Debounce de 500ms nas buscas
- Cache em memória para consultas repetidas
- Máximo 1 requisição por vez (sem paralelização)

---

## Mapa (OpenStreetMap + Leaflet)

- Tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Atribuição: © OpenStreetMap contributors
- Sem chave de API necessária
- Centro padrão: Juiz de Fora (-21.7606, -43.3496), zoom 12

---

## Tipos de ajuda suportados

`Alimentos` · `Água` · `Roupas` · `Remédios` · `Voluntários` · `Abrigo` · `Resgate` · `Higiene` · `Ração para animais` · `Outros`

---

## TODO / Próximas funcionalidades

- [ ] **Upload de fotos** (até 3 por pedido) via Cloudflare R2 ou AWS S3
- [ ] **Rate limiting persistente** com Redis para ambiente multi-instância
- [ ] **hCaptcha / Cloudflare Turnstile** para proteção adicional contra bots
- [ ] **Clustering de marcadores** para muitos pedidos no mapa
- [ ] **Notificações push** para novos pedidos próximos (PWA)
- [ ] **Painel de moderação** para revisar pedidos com muitos reports
- [ ] **Exportação de dados** para Defesa Civil / autoridades

---

## Licença

MIT — Use e adapte livremente para emergências.
