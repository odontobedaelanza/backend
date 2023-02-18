# SACMAIS Backend

>- Passo a passo de como subir a aplicação do backend.

>- Cada cliente terá uma configuração no railway, vercel e supabase.

---

## Plataformas utilizadas:

- [Vercel][vercel]
- [Railway][railway]
- [Supabase][supabase]

---

## Iniciando para um novo cliente

### 1. Criar uma nova organização no github

É preciso criar uma nova organização no github para que as plataformas realizem o deploy da aplicação e tudo fique bem separado. Uma vez que a organização foi criada, é nela que estrá presente o backend e o frontend.

<img src="./.github/images/1.png" />
<img src="./.github/images/2.png" />

### 2. Criar o repositório do backend usando o repositório template

Ao usar o repositório template, o mesmo já virá tudo configurado.

<img src="./.github/images/3.png" />
<img src="./.github/images/4.png" />

### 3. Criar o projeto no Railway

É necessário criaro projeto separado no railway, lembre-se de criar um projeto em branco.

<img src="./.github/images/5.png" />
<img src="./.github/images/6.png" />

### 4. Criar o Redis

É necessário também fazer a criação do Redis no railway

<img src="./.github/images/7.png" />
<img src="./.github/images/8.png" />
<img src="./.github/images/9.png" />

### 5. Configurar o Supabase

Criar um banco de dados para o cliente

<img src="./.github/images/13.png" />
<img src="./.github/images/14.png" />

Depois de criado, basta pegar as informações para a conexão

<img src="./.github/images/15.png" />

### 6. Configurar o backend no railway

Agora basta entrar no projeto vazio e fazer algumas configurações:

  1. Configurar o nome e a geração do dominio:
    <img src="./.github/images/10.png" />
  2. Configurar as variaveis de ambiente:
    <img src="./.github/images/11.png" />
  3. Vincular o projeto ao repositório do github:
    <img src="./.github/images/12.png" />

Depois que finalizar o vinculo, o deploy vai iniciar e logo mais a aplicação estará online

### 7. Caso queira colocar uma url customizavel no backend, basta seguir com a configuração

<img src="./.github/images/16.png" />

---

>- Para já ter o usuário admin da Revoi, é preciso rodar a seed conforme a documentação da aplicação manda, apontando para o banco de dados criado, ou criar via supabase.

[vercel]: https://vercel.com
[railway]: https://railway.app
[supabase]: https://app.supabase.com
