# Deploy Checklist - VW Fleet Manager

Use este checklist para garantir que tudo está pronto antes de fazer upload para o Hostinger.

## ✅ Pré-Deploy (Local)

- [x] Schema SQL atualizado com hashes de senha válidos (`schema.sql`)
- [x] `.env.example` criado com valores genéricos (sem expor credenciais)
- [x] `.gitignore` configurado para proteger `.env` e `node_modules`
- [x] `package.json` com todas as dependências corretas
- [x] Frontend (`index.html`, `app.js`, `styles.css`) preparado para usar APIs
- [x] Backend (`server.js`, `database.js`) configurado e testado localmente

## ✅ No Hostinger (hPanel)

1. **Criar banco de dados MySQL**
   - Acesse: `Banco de Dados` > `MySQL Databases`
   - Crie um novo banco (ex: `vw_fleet_manager`)
   - Crie um usuário MySQL e anote a senha
   - Anote o `DB_HOST` (pode ser `localhost` ou um host específico)

2. **Importar schema.sql**
   - Acesse: `Banco de Dados` > `phpMyAdmin`
   - Selecione o banco criado
   - Vá em: `Importar`
   - Escolha o arquivo `schema.sql` do projeto
   - Clique em: `Executar`

3. **Preparar arquivo .env para o servidor**
   - Copie o arquivo `.env.example`
   - Renomeie para `.env`
   - Preencha com as credenciais do Hostinger:
     ```env
     DB_HOST=seu_host_mysql_hostinger
     DB_USER=seu_usuario_mysql
     DB_PASSWORD=sua_senha_mysql
     DB_NAME=seu_banco_criado
     DB_PORT=3306
     JWT_SECRET=uma_chave_aleatória_com_pelo_menos_64_caracteres
     APP_ORIGIN=https://seu-dominio.com
     JWT_ISSUER=volscar
     JWT_AUDIENCE=volscar-web
     NODE_ENV=production
     PORT=3000
     ```

## 📤 Upload para o Hostinger

### Via File Manager (mais fácil):
1. Acesse: `File Manager` no hPanel
2. Navegue até: `public_html` ou raiz do projeto
3. Faça upload dos arquivos:
   - `server.js`
   - `database.js`
   - `index.html`
   - `app.js`
   - `styles.css`
   - `package.json`
   - `.env` (com credenciais preenchidas)
   - `schema.sql`
   - `README.md`
   
   **NÃO faça upload de:**
   - `node_modules/` (será instalado com `npm install` no servidor)
   - `.git/`
   - `test-login.js`
   - `generate-hashes.js`

### Via FTP (se preferir):
Use um cliente FTP (ex: FileZilla) com as credenciais fornecidas pelo Hostinger.

## 🔧 No Servidor (via SSH ou Terminal)

1. Conecte via SSH:
   ```bash
   ssh seu_usuario@seu_dominio.com
   ```

2. Navegue para o diretório do projeto:
   ```bash
   cd /home/seu_usuario/public_html  # ou onde você fez upload
   ```

3. Instale as dependências:
   ```bash
   npm install
   ```

4. Teste se tudo está funcionando:
   ```bash
   npm run init-db  # (opcional - só se quiser resetar o banco)
   ```

5. Inicie o servidor:
   ```bash
   npm start
   ```

   Ou se o Hostinger tiver um gerenciador de apps/Node.js no painel:
   - Configure apontando para `server.js`
   - Deixe o app rodar como serviço

## ✅ Testes Pós-Deploy

1. Acesse o site: `https://seu-dominio.com`
2. Faça login com:
   - usuário: `admin`
   - senha: `admin123`
3. Verifique se os carros aparecem
4. Crie um novo evento
5. Atualize uma data de saída

Se algo falhar:
- Abra o console do navegador (`F12`)
- Verifique os erros de rede na aba `Network`
- Se necessário, acesse o painel de logs do Hostinger

## 🔐 Segurança

- [ ] `.env` nunca foi commitado no Git (protegido por `.gitignore`)
- [ ] Credenciais do banco estão apenas no arquivo `.env` no servidor
- [ ] `JWT_SECRET` é uma string aleatória e forte
- [ ] Não há credenciais no código-fonte ou em commits públicos

## 📞 Suporte

Se tiver dúvidas durante o deploy:
1. Verifique os logs do servidor (SSH ou painel do Hostinger)
2. Teste localmente com `npm run dev` antes de fazer upload
3. Confirme que o MySQL está rodando no servidor

---

**Status**: ✅ Pronto para deploy!
