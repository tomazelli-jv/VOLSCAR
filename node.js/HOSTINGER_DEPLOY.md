# Deploy no Hostinger com MySQL

Este projeto já inclui backend Node.js (`server.js`) e schema MySQL (`schema.sql`). O objetivo aqui é publicar o app no Hostinger e conectar ao banco.

## 1) Verifique o plano do Hostinger

Para rodar o Node.js você precisa de:
- Hostinger Cloud ou VPS, ou
- plano com suporte a Node.js/App Services

Se você tiver apenas hospedagem compartilhada, não será possível rodar `server.js` diretamente.

## 2) Criar o banco de dados MySQL

1. Faça login no `hPanel` do Hostinger.
2. Acesse `Banco de Dados` > `MySQL Databases`.
3. Crie um novo banco de dados.
4. Crie também um usuário MySQL e uma senha.
5. Anote:
   - `DB_HOST`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_PORT` (normalmente `3306`)

## 3) Importar o `schema.sql`

1. No `hPanel`, abra `phpMyAdmin`.
2. Selecione o banco criado.
3. Vá em `Importar`.
4. Escolha o arquivo `schema.sql` do projeto.
5. Execute a importação.

O `schema.sql` já contém as tabelas `users`, `cars` e `events`, além de dados de exemplo.

## 4) Preparar o ambiente no Hostinger

No root do projeto, copie o arquivo `.env.example` para `.env` e preencha com os valores do Hostinger:

```env
DB_HOST=seu_host_mysql
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=vw_fleet_manager
DB_PORT=3306
JWT_SECRET=uma_chave_secreta_forte
PORT=3000
```

> Atenção: no Hostinger o `DB_HOST` pode ser `localhost` ou um host específico fornecido pelo painel.

## 5) Enviar os arquivos para o Hostinger

Use FTP ou o `File Manager` e envie a pasta do projeto para o servidor. O mínimo necessário:
- `index.html`
- `styles.css`
- `app.js`
- `server.js`
- `database.js`
- `package.json`
- `.env`
- `schema.sql`
- `README.md`
- `node_modules` não precisa ser enviado se você rodar `npm install` no servidor.

## 6) Instalar dependências no servidor

Se você tiver acesso SSH, entre na pasta do projeto e rode:

```bash
npm install
```

Se estiver usando o gerenciador de apps do Hostinger, siga as instruções para rodar um app Node.js e aponte para `server.js`.

## 7) Iniciar o servidor Node.js

No terminal:

```bash
npm start
```

Ou use o painel de apps do Hostinger para lançar o processo Node.

## 8) Acessar o site

Para funcionar corretamente, você deve acessar o frontend via o mesmo host onde o servidor Node está rodando.

Se o site estiver em `https://seu-dominio.com`, o backend também precisa estar configurado lá ou em uma URL de API acessível.

## 9) Consideração importante: frontend x backend

O projeto agora está ajustado para usar o backend Node.js e o MySQL como fonte de verdade. O frontend faz requisições a `/api/*` e deve ser servido pelo mesmo servidor Node para evitar problemas de CORS.

## 10) Testes após deploy

## 10) Testes após deploy

- Abra o site no navegador
- Tente fazer login
- Verifique se os carros aparecem
- Crie um evento e veja se ele aparece no banco
- Se algo falhar, abra o console do navegador e o log do servidor para diagnosticar

## Resumo rápido

1. Crie MySQL no Hostinger
2. Importe `schema.sql`
3. Preencha `.env`
4. Faça upload dos arquivos
5. Rode `npm install`
6. Inicie `npm start`

Se quiser, posso agora gerar o passo a passo com comandos SSH específicos para o Hostinger ou ajustar o frontend para utilizar essas APIs diretamente.