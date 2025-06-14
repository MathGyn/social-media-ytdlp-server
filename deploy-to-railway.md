# 🚂 Deploy para Railway

Guia completo para fazer deploy do servidor YT-DLP no Railway.

## 📋 Pré-requisitos

1. **Conta no Railway**: [railway.app](https://railway.app)
2. **Git configurado** no seu sistema
3. **Repositório GitHub** (opcional, mas recomendado)

## 🚀 Opção 1: Deploy Direto (Mais Rápido)

### 1. Conectar ao Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"

### 2. Upload do Código

Se você não tem o código no GitHub ainda:

```bash
# No diretório railway-ytdlp-server
cd railway-ytdlp-server

# Inicializar Git
git init
git add .
git commit -m "Initial commit: YT-DLP Railway Server"

# Criar repositório no GitHub e conectar
# (siga as instruções do GitHub)
git remote add origin https://github.com/SEU_USUARIO/railway-ytdlp-server.git
git push -u origin main
```

### 3. Configurar no Railway

1. Selecione o repositório `railway-ytdlp-server`
2. Railway detectará automaticamente o `Dockerfile`
3. Clique em "Deploy Now"

### 4. Configurar Variáveis (Opcional)

No painel do Railway > Settings > Environment:

```
NODE_ENV=production
ALLOWED_ORIGINS=https://seu-dominio.com,http://localhost:8081
```

## 🚀 Opção 2: Deploy via CLI

### 1. Instalar Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login e Deploy

```bash
# Login no Railway
railway login

# No diretório do servidor
cd railway-ytdlp-server

# Inicializar projeto Railway
railway init

# Deploy
railway up
```

## 🔧 Configuração Pós-Deploy

### 1. Obter URL do Railway

Após o deploy, Railway fornecerá uma URL como:
```
https://railway-ytdlp-server-production.up.railway.app
```

### 2. Configurar Frontend

Adicione a URL no arquivo `.env` do frontend:

```bash
# No diretório principal do SocialTools
echo "REACT_APP_RAILWAY_API_URL=https://SUA-URL-RAILWAY.railway.app" >> .env
```

### 3. Testar a Conexão

```bash
# Testar health check
curl https://SUA-URL-RAILWAY.railway.app/health

# Deve retornar:
# {
#   "success": true,
#   "status": "healthy",
#   "ytdlp": "available"
# }
```

## ✅ Verificação de Funcionamento

### 1. Health Check
```bash
curl https://SUA-URL-RAILWAY.railway.app/health
```

### 2. Teste de Metadata
```bash
curl -X POST https://SUA-URL-RAILWAY.railway.app/metadata \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### 3. Teste de Download
```bash
curl -X POST https://SUA-URL-RAILWAY.railway.app/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "quality": "best", "format": "mp4"}'
```

## 🎯 Integração com Frontend

Após o deploy bem-sucedido:

1. ✅ **Frontend detectará automaticamente** o Railway
2. ✅ **Preferirá Railway** sobre Supabase 
3. ✅ **Downloads funcionarão completamente**
4. ✅ **Fallback para Supabase** se Railway estiver indisponível

## 📊 Monitoramento

### Railway Dashboard
- **Logs**: Acompanhe logs em tempo real
- **Metrics**: CPU, RAM, requests
- **Health**: Status do serviço

### Frontend Indicators
- 🟢 **Railway Badge**: YT-DLP completo funcionando
- 🟡 **Supabase Badge**: Funcionalidade limitada
- 🔴 **Offline Badge**: Nenhum backend disponível

## 🔒 Segurança

O servidor já inclui:
- ✅ Rate limiting (10 req/min por IP)
- ✅ CORS configurado
- ✅ Helmet security headers  
- ✅ Input sanitization
- ✅ Command injection protection

## 💰 Custos Railway

- **Hobby Plan**: $5/mês - adequado para uso pessoal
- **Pro Plan**: $20/mês - para uso intensivo
- **Free Trial**: Disponível para testes

## 🆘 Troubleshooting

### Erro "yt-dlp not found"
- Verifique se o Dockerfile está correto
- Confirme que o build completou sem erros

### Timeout nos downloads
- Aumente timeout no Railway (Settings > Deploy)
- Configure `RAILWAY_DEPLOYMENT_TIMEOUT=600`

### CORS errors
- Configure `ALLOWED_ORIGINS` adequadamente
- Verifique se a URL do frontend está incluída

## 📞 Suporte

Se tiver problemas:
1. Verifique logs no Railway Dashboard
2. Teste endpoints individuais com curl
3. Confirme variáveis de ambiente
4. Valide se o build foi bem-sucedido