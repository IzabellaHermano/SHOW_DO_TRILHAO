# Show do Trilhão • CPTM Quiz Show

Quiz gamificado inspirado no clássico **Show do Milhão**, com identidade visual e temática oficial da **Companhia Paulista de Trens Metropolitanos (CPTM)**. 

O projeto é 100% desacoplado em arquitetura cliente-servidor:
- **Backend:** Java 17 + Spring Boot 3 + Spring Security (JWT e BCrypt) + H2 (Dev) / PostgreSQL (Prod com Flyway).
- **Front-end:** React + Vite + Vanilla CSS com Design System de TV Auditório e identidade visual CPTM.

---

## 🚉 Estrutura do Repositório

```text
SHOW_DO_TRILHAO/
├── backend/                  # API REST em Spring Boot 3
│   ├── src/main/java/        # Código-fonte em camadas (controller, service, model, etc.)
│   ├── src/main/resources/   # application.yml, application-dev.yml, migrations Flyway
│   ├── Dockerfile            # Dockerfile multi-stage otimizado para o Render
│   └── .env.example          # Exemplo de variáveis de ambiente
├── frontend/                 # SPA em React com Vite
│   ├── src/                  # Componentes, páginas, serviços e contexto
│   ├── public/               # Favicon e manifest
│   ├── .env.development      # URL da API local (http://localhost:8080/api)
│   ├── .env.production       # URL da API no Render
│   └── firebase.json         # Configuração de rewrites e cache do Firebase Hosting
├── doc/                      # Apresentações e manuais originais
├── render.yaml               # Blueprint Infrastructure-as-Code do Render (Web Service + DB)
├── firebase.json             # Configuração raiz do Firebase
└── README.md                 # Documentação e manual de deploy
```

---

## 🎯 Regras Oficiais do Jogo

1. **10 Perguntas por Partida:** Dificuldade crescente (Níveis 1 a 10) e premiações que escalam de **R$ 1.000** até o prêmio máximo de **R$ 1.000.000**.
2. **Sem Repetição:** Nenhuma pergunta se repete na mesma rodada.
3. **Cronômetro Regressivo:** Cada pergunta conta com **45 segundos**. Tempo esgotado é considerado erro.
4. **Errou ou Abandonou = Perde Tudo:** Se o jogador errar qualquer pergunta ou abandonar voluntariamente a partida, sai com **R$ 0**.
5. **Perfis de Usuário:**
   - **Jogador:** Conta cadastrada; suas partidas pontuam no **Ranking Geral de Milionários**.
   - **Visitante:** Joga apenas com o código da sala + apelido; pontua no **Ranking da Sala**.
   - **Apresentador:** Cria e administra salas de jogo ao vivo e gerencia o acervo oficial de perguntas (CRUD).
   - **Admin:** Acesso total via seed protegido por variáveis de ambiente.

---

## 🛠️ Como Rodar Localmente

### Pré-requisitos
- **Java 17 (JDK):** [Eclipse Adoptium Temurin 17](https://adoptium.net/)
- **Node.js:** Versão 18+ (Node 20+ recomendado)

### 1. Executando o Backend
Abra um terminal PowerShell na pasta `backend`:
```powershell
$env:JAVA_HOME = "C:\Users\IZABELLAA\.jdks\jdk-17.0.20.1+1" # ou seu caminho do JDK 17
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

# Executar a aplicação com perfil padrão (H2 em memória/arquivo)
.\mvnw.cmd spring-boot:run
```
O backend subirá na porta `8080` (Context path: `http://localhost:8080/api`).
- **Swagger / OpenAPI:** `http://localhost:8080/api/swagger-ui.html`
- **Health Check Público:** `http://localhost:8080/api/health`

> **Segurança no primeiro boot:** Se as variáveis `ADMIN_PASSWORD` ou `APRESENTADOR_PASSWORD` não forem informadas no ambiente, o sistema gerará automaticamente uma senha forte e exibirá em destaque no console do terminal.

### 2. Executando o Front-end
Em outro terminal, acesse a pasta `frontend`:
```powershell
npm install
npm run dev
```
O Vite iniciará o front-end em `http://localhost:5173`.

---

## 🚀 Guia de Deploy Passo a Passo

### Parte 1: Backend no Render com PostgreSQL

1. **Crie uma conta no Render:** Acesse [render.com](https://render.com).
2. **Conecte seu repositório Git:** Crie um novo **Blueprint** ou configure manualmente:
   - **Opção A (Recomendada via Blueprint `render.yaml`):**
     O repositório já contém o arquivo [render.yaml](file:///c:/Users/IZABELLAA/Documents/SHOW_DO_TRILHAO/render.yaml). No Render Dashboard, clique em **New +** -> **Blueprint**, selecione o repositório e o Render provisionará automaticamente o **Web Service Docker** e o banco **PostgreSQL**.
   - **Opção B (Manual):**
     1. Crie um banco **PostgreSQL** chamado `show-do-trilhao-db`.
     2. Crie um **Web Service** selecionando **Docker Runtime**.
     3. Dockerfile Path: `backend/Dockerfile`, Docker Context: `backend`.
3. **Configure as Variáveis de Ambiente no Render:**
   | Variável | Valor Recomendado | Descrição |
   | :--- | :--- | :--- |
   | `SPRING_PROFILES_ACTIVE` | `prod` | Ativa o dialeto PostgreSQL e migrações Flyway |
   | `DATABASE_URL` | *(Injetada do banco do Render)* | URL no formato `postgres://user:pass@host:5432/db` |
   | `PORT` | `8080` | Porta exposta pelo contêiner |
   | `JWT_SECRET` | *(Chave de 32+ caracteres)* | Segredo HMAC-SHA256 para assinatura dos tokens |
   | `JWT_EXPIRATION_MS` | `86400000` | 24 horas de validade para o token |
   | `ADMIN_EMAIL` | `admin@cptm.sp.gov.br` | E-mail do Administrador inicial |
   | `ADMIN_PASSWORD` | *(Sua senha forte)* | Senha mestra do Administrador |
   | `APRESENTADOR_EMAIL` | `apresentador@cptm.sp.gov.br` | E-mail do Apresentador oficial |
   | `APRESENTADOR_PASSWORD` | *(Sua senha forte)* | Senha do Apresentador oficial |
   | `CORS_ALLOWED_ORIGINS` | `https://SEU-PROJETO.web.app` | URLs do Firebase liberadas |
   | `SWAGGER_ENABLED` | `false` | Desabilita Swagger público em produção |
4. **Health Check:** O Render utilizará `/api/health` para validar se o contêiner está ativo.

---

### Parte 2: Front-end no Firebase Hosting

1. **Instale a CLI do Firebase:**
   ```bash
   npm install -g firebase-tools
   ```
2. **Faça login no Firebase:**
   ```bash
   firebase login
   ```
3. **Vincule o projeto no Firebase:**
   Edite o arquivo `.firebaserc` na raiz e em `frontend/.firebaserc` com o ID do seu projeto no Firebase:
   ```json
   {
     "projects": {
       "default": "seu-projeto-firebase-id"
     }
   }
   ```
4. **Configure as URLs de Produção:**
   Edite o arquivo `frontend/.env.production`:
   ```env
   VITE_API_URL=https://show-do-trilhao-backend.onrender.com/api
   VITE_PUBLIC_URL=https://seu-projeto-firebase-id.web.app
   ```
   > ⚠️ **ATENÇÃO AO QR CODE E LINKS DE SALA:** A variável `VITE_PUBLIC_URL` define a URL pública base utilizada para gerar o QR Code no telão do Apresentador e o link compartilhado com os jogadores. Certifique-se de preencher com o seu domínio real do Firebase (`https://seu-projeto-firebase-id.web.app`) para evitar gerar QR Codes apontando para `localhost` em produção!

5. **Gere o Build e Publique:**
   ```powershell
   cd frontend
   npm run build
   firebase deploy --only hosting
   ```
   O Firebase Hosting disponibilizará o site com certificado SSL automático em `https://seu-projeto-firebase-id.web.app`. O arquivo `firebase.json` já conta com a regra de rewrite SPA (`**` -> `/index.html`) para que links diretos como `/sala/CPTM-XXXX` funcionem no reload.

---

### Parte 3: Conectando os Dois e Tratando o Cold-Start do Render

1. **Permissão de CORS:** Copie o domínio gerado pelo Firebase (ex: `https://show-do-trilhao.web.app`) e adicione na variável `CORS_ALLOWED_ORIGINS` no painel do Render.
2. **Plano Gratuito do Render (Adormecimento):** No plano grátis, o Render suspende a instância após 15 minutos de inatividade. O front-end do Show do Trilhão possui um interceptador Axios com timeout de 60 segundos e um componente visual de alerta (`ColdStartBanner`), avisando o jogador amigavelmente caso o servidor esteja acordando e realizando nova tentativa automática.

---

## 📚 Gabarito Oficial das 28 Perguntas e Fontes Verificadas

Todas as perguntas foram conferidas em fontes oficiais do Governo do Estado de São Paulo e da CPTM:

| # | Pergunta | Resposta Correta | Nível / Prêmio | Fonte Oficial CPTM / Link |
| :-: | :--- | :--- | :-: | :--- |
| **1** | A CPTM está ligada a qual secretaria? | **Secretaria de Transportes Metropolitanos** | Nível 1 (R$ 1.000) | [Histórico STM / CPTM](https://www.cptm.sp.gov.br) |
| **2** | Qual é o nome da Linha 10 da CPTM? | **Turquesa** | Nível 2 (R$ 5.000) | [Linhas CPTM - Linha 10-Turquesa](https://www.cptm.sp.gov.br) |
| **3** | Menor intervalo entre trens na Linha 10 - Turquesa? | **6 min** (horário de pico entre Barra Funda e Mauá) | Nível 3 (R$ 10.000) | [Intervalos Oficiais CPTM](https://www.cptm.sp.gov.br) |
| **4** | Quantas pessoas a CPTM transporta por dia útil? | **Um estado inteiro como Sergipe (~2,3 M)** | Nível 4 (R$ 25.000) | [Demanda CPTM cptm.sp.gov.br](https://www.cptm.sp.gov.br) |
| **5** | Quantos passageiros por ano a CPTM transporta? | **480 milhões** | Nível 5 (R$ 50.000) | [Relatórios Anuais de Demanda CPTM](https://www.cptm.sp.gov.br) |
| **6** | Se somarmos todas as viagens no dia, a que equivale? | **Dar a volta na Terra** (~53.547 km/dia = ~1,3 volta) | Nível 6 (R$ 100.000) | [Slides Oficiais / Balanço Operacional CPTM](https://www.cptm.sp.gov.br) |
| **7** | O índice de avaliação positiva do serviço da CPTM é de? | **83%** | Nível 7 (R$ 200.000) | [Pesquisa de Satisfação de Passageiros CPTM](https://www.cptm.sp.gov.br) |
| **8** | Quem é o personagem mais famoso das redes sociais da CPTM? | **Zecaré** (mascote do AMV / Jacaré) | Nível 8 (R$ 300.000) | [Redes Oficiais CPTM @cptm_oficial](https://twitter.com/cptm_oficial) |
| **9** | Qual o tempo de trem entre o Centro e o Aeroporto? | **40 min** (Expresso Aeroporto) | Nível 9 (R$ 500.000) | [Serviço Expresso Aeroporto CPTM](https://www.cptm.sp.gov.br) |
| **10** | O Expresso Aeroporto passa por estrutura única: qual é? | **Ponte estaiada em curva** (sobre Ayrton Senna/Hélio Smidt) | Nível 10 (R$ 1.000.000) | [Engenharia Linha 13-Jade CPTM](https://www.cptm.sp.gov.br) |
| **11** | Significado exato da sigla CPTM? | **Companhia Paulista de Trens Metropolitanos** | Nível 1 (R$ 1.000) | [Quem Somos CPTM](https://www.cptm.sp.gov.br/a-companhia) |
| **12** | Qual é a cor da Linha 7 da CPTM? | **Rubi** | Nível 1 (R$ 1.000) | [Linha 7-Rubi CPTM](https://www.cptm.sp.gov.br) |
| **13** | Linha que atende Suzano e Mogi das Cruzes? | **Linha 11-Coral** | Nível 2 (R$ 5.000) | [Linha 11-Coral CPTM](https://www.cptm.sp.gov.br) |
| **14** | Linha identificada pela cor Safira? | **Linha 12** | Nível 2 (R$ 5.000) | [Linha 12-Safira CPTM](https://www.cptm.sp.gov.br) |
| **15** | Estação da CPTM que abriga o Museu da Língua Portuguesa? | **Estação da Luz** | Nível 3 (R$ 10.000) | [Estação da Luz - Patrimônio Histórico](https://www.cptm.sp.gov.br) |
| **16** | Vila ferroviária inglesa no ABC destino de turismo? | **Paranapiacaba** | Nível 3 (R$ 10.000) | [Expresso Turístico Paranapiacaba](https://www.cptm.sp.gov.br) |
| **17** | Ano de fundação da CPTM (Lei nº 7.861)? | **1992** (28 de maio de 1992) | Nível 4 (R$ 25.000) | [História da CPTM - Lei Estadual](https://www.al.sp.gov.br) |
| **18** | Ferrovia pioneira inaugurada em 1867? | **São Paulo Railway (SPR)** | Nível 4 (R$ 25.000) | [História Ferroviária Paulista](https://www.cptm.sp.gov.br) |
| **19** | Serviço direto unificando Linhas 7 e 10? | **Serviço 710** | Nível 5 (R$ 50.000) | [Serviço 710 Francisco Morato - Rio Grande](https://www.cptm.sp.gov.br) |
| **20** | Tensão elétrica da rede aérea (catenária) na CPTM? | **3.000 V CC** | Nível 5 (R$ 50.000) | [Especificações Técnicas CPTM](https://www.cptm.sp.gov.br) |
| **21** | Bitola padrão predominante na CPTM? | **Bitola Larga (1,60 m)** | Nível 6 (R$ 100.000) | [Engenharia de Via Permanente CPTM](https://www.cptm.sp.gov.br) |
| **22** | Trem temático com passeios nos fins de semana? | **Expresso Turístico** | Nível 6 (R$ 100.000) | [Expresso Turístico CPTM Oficial](https://www.cptm.sp.gov.br/sua-viagem/Expresso-Turistico) |
| **23** | Primeira linha 100% construída pela CPTM? | **Linha 13-Jade** | Nível 7 (R$ 200.000) | [Linha 13-Jade Inauguração](https://www.cptm.sp.gov.br) |
| **24** | Grande terminal intermodal com Linhas 7, 8 e Metrô? | **Palmeiras-Barra Funda** | Nível 7 (R$ 200.000) | [Integração Barra Funda](https://www.cptm.sp.gov.br) |
| **25** | Ano de inauguração do edifício definitivo da Luz? | **1901** | Nível 8 (R$ 300.000) | [Patrimônio Histórico Estação da Luz](https://www.cptm.sp.gov.br) |
| **26** | Tecnologia de sinalização e controle de trens? | **ATC / CBTC** | Nível 8 (R$ 300.000) | [Sistemas de Sinalização CPTM](https://www.cptm.sp.gov.br) |
| **27** | Local do Centro de Controle Operacional (CCO)? | **Complexo do Brás** | Nível 9 (R$ 500.000) | [CCO da CPTM no Brás](https://www.cptm.sp.gov.br) |
| **28** | Fabricante inglês dos relógios históricos da Luz e Paranapiacaba? | **John Walker & Sons** | Nível 10 (R$ 1.000.000) | [Acervo Histórico da São Paulo Railway](https://www.cptm.sp.gov.br) |

---

## 🔒 Segurança e Melhores Práticas
- Nenhuma senha exposta em código-fonte.
- Hash de senhas exclusivamente via BCrypt com salt dinâmico.
- Tokens stateless autenticados via JWT com tempo de expiração configurável.
- Endpoints de administração restritos por roles (`ROLE_ADMIN`, `ROLE_APRESENTADOR`).
- Validação no servidor que impede cadastro público com privilégios de Admin.
