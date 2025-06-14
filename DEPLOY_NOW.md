# 🚂 DEPLOY RAILWAY - INSTRUÇÕES COMPLETAS

## 📋 Status Atual
✅ Código preparado e comitado no Git  
✅ Docker configurado para Railway  
✅ Frontend atualizado para usar Railway  
✅ Sistema de fallback implementado  

**Diretório:** `/Volumes/2TB Samsung/Matheus/Cursor/SocialTools/socialtools/railway-ytdlp-server`

## 🚀 MÉTODO 1: Deploy via GitHub (Recomendado)

### 1. Criar Repositório GitHub
```bash
# Vá para: https://github.com/new
# Nome: railway-ytdlp-server
# Público: ✅
# README: ❌ (já existe)
```

### 2. Push para GitHub
```bash
# No terminal, no diretório railway-ytdlp-server:
git remote add origin https://github.com/SEU_USUARIO/railway-ytdlp-server.git
git push -u origin main
```

### 3. Deploy no Railway
1. Acesse [railway.app](https://railway.app)
2. Login com GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Selecione `railway-ytdlp-server`
5. **Railway detectará o Dockerfile automaticamente**
6. Clique "Deploy Now"

## 🚀 MÉTODO 2: Deploy via Upload

### 1. Comprimir Arquivos
```bash
# No diretório railway-ytdlp-server:
zip -r railway-ytdlp-server.zip . -x "*.git*" "node_modules/*"
```

### 2. Upload Manual
1. Acesse [railway.app](https://railway.app) 
2. "New Project" → "Empty Project"
3. Arraste `railway-ytdlp-server.zip` para o Railway
4. Configure Build Command: `docker build .`

## ⚙️ Configuração Pós-Deploy

### 1. Obter URL Railway
Após deploy, você terá uma URL como:
```
https://railway-ytdlp-server-production-abcd.up.railway.app
```

### 2. Configurar Frontend
```bash
# No diretório principal socialtools:
echo "VITE_RAILWAY_API_URL=https://SUA-URL-RAILWAY.railway.app" > .env
```

### 3. Reiniciar Frontend
```bash
# Pare o servidor atual (Ctrl+C) e reinicie:
npm run dev
```

## 🧪 Testes Após Deploy

### 1. Health Check
```bash
curl https://SUA-URL-RAILWAY.railway.app/health
# Esperado: {"success": true, "ytdlp": "available"}
```

### 2. Teste Frontend
1. Acesse `http://localhost:8081/`
2. Vá para Social Media Downloader
3. Deve mostrar: **🚂 Railway** badge (verde)
4. Cole URL do YouTube: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
5. Teste download - deve funcionar!

## 📊 Monitoramento

### Railway Dashboard
- **Logs**: Ver logs em tempo real
- **Metrics**: CPU, RAM, requests/min
- **Health**: Status do yt-dlp

### Frontend Indicators
- 🟢 **🚂 Railway**: Tudo funcionando
- 🟡 **⚡ Supabase**: Fallback ativo
- 🔴 **❌ Offline**: Nenhum backend

## 💰 Custos Railway

- **Starter Plan**: $5/mês (~R$25)
- **Primeiro deploy**: Grátis por alguns dias
- **Vale muito a pena**: Substitui APIs caras

## 🔧 Variáveis Opcionais

No Railway Dashboard > Settings > Variables:
```
NODE_ENV=production
ALLOWED_ORIGINS=https://seudominio.com,http://localhost:8081
```

## ✅ Checklist Final

- [ ] 1. Criar repositório GitHub
- [ ] 2. Push código para GitHub  
- [ ] 3. Deploy no Railway
- [ ] 4. Configurar URL no .env
- [ ] 5. Reiniciar frontend
- [ ] 6. Testar YouTube download
- [ ] 7. Verificar badge Railway (🟢)

## 🆘 Se Algo Der Errado

### Build Falhou?
- Verifique se Dockerfile está no repositório
- Logs no Railway Dashboard mostrarão o erro

### yt-dlp não funciona?
- Aguarde o build completar (~3-5 minutos)
- yt-dlp leva tempo para instalar no primeiro deploy

### Frontend não conecta?
- Confirme a URL no .env está correta
- Reinicie o servidor de desenvolvimento
- Verifique se não há CORS errors

## 🎉 Resultado Final

Com Railway funcionando:
- ✅ **YouTube**: Downloads perfeitos
- ✅ **Instagram**: Funcional (quando possível)  
- ✅ **TikTok**: Funcional (quando possível)
- ✅ **Facebook**: Funcional (quando possível)
- ✅ **Qualidade**: HD, áudio, múltiplos formatos
- ✅ **Velocidade**: Muito mais rápido que APIs
- ✅ **Custo**: $5/mês vs $50+/mês APIs premium

---

**🚀 PRONTO PARA USAR!** 

O Social Media Downloader estará 100% funcional com yt-dlp real!