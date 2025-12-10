//Programado por Luiz Fernando Olivetti Albieri Zanon
//RA 1044.25.1960-4


const express = require("express");
const session = require("express-session");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessão (30 minutos)
app.use(
  session({
    secret: "segredo",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 60 * 1000 },
  })
);

// Dados em memória
let equipes = [];
let jogadores = [];

// Página inicial (login)
app.get("/", (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form action="/login" method="POST">
      <label>Usuário:</label>
      <input name="usuario" required>
      <label>Senha:</label>
      <input type="password" name="senha" required>
      <button type="submit">Entrar</button>
    </form>
  `);
});

// Login
app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === "admin" && senha === "123") {
    req.session.logado = true;
    req.session.ultimoAcesso = new Date().toLocaleString("pt-BR");

    return res.redirect("/menu");
  }

  res.send("<h1>Login inválido!</h1><a href='/'>Voltar</a>");
});

// Middleware para proteger rotas
function auth(req, res, next) {
  if (req.session.logado) return next();
  res.redirect("/");
}

// Menu do sistema
app.get("/menu", auth, (req, res) => {
  res.send(`
    <h1>Menu do Sistema</h1>
    <p>Último acesso: ${req.session.ultimoAcesso}</p>

    <a href="/cadastro-equipe">Cadastrar Equipe</a><br>
    <a href="/cadastro-jogador">Cadastrar Jogador</a><br>
    <a href="/lista-equipes">Listar Equipes</a><br>
    <a href="/lista-jogadores">Listar Jogadores</a><br>
    <a href="/logout">Sair</a>
  `);
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// --- EQUIPES ---
// Formulário de cadastro
app.get("/cadastro-equipe", auth, (req, res) => {
  res.send(`
    <h1>Cadastrar Equipe</h1>
    <form action="/cadastro-equipe" method="POST">
      <label>Nome da equipe:</label>
      <input name="nome" required>

      <label>Nome do capitão:</label>
      <input name="capitao" required>

      <label>Telefone:</label>
      <input name="telefone" required>

      <button type="submit">Cadastrar</button>
    </form>

    <a href="/menu">Voltar ao menu</a>
  `);
});

// Cadastro de equipe (POST)
app.post("/cadastro-equipe", auth, (req, res) => {
  const { nome, capitao, telefone } = req.body;

  if (!nome || !capitao || !telefone) {
    return res.send("Todos os campos são obrigatórios!");
  }

  equipes.push({ nome, capitao, telefone });

  res.redirect("/lista-equipes");
});

// Listagem de equipes
app.get("/lista-equipes", auth, (req, res) => {
  let lista = "<h1>Equipes Cadastradas</h1>";

  equipes.forEach((e, i) => {
    lista += `<p>${i + 1}. ${e.nome} — Capitão: ${e.capitao} — Tel: ${e.telefone}</p>`;
  });

  lista += `
    <a href="/cadastro-equipe">Cadastrar outra</a><br>
    <a href="/menu">Menu</a>
  `;

  res.send(lista);
});

// --- JOGADORES ---
// Formulário jogador
app.get("/cadastro-jogador", auth, (req, res) => {
  if (equipes.length === 0) {
    return res.send("<h1>Nenhuma equipe cadastrada!</h1><a href='/menu'>Voltar</a>");
  }

  let options = "";
  equipes.forEach((eq) => {
    options += `<option value="${eq.nome}">${eq.nome}</option>`;
  });

  res.send(`
    <h1>Cadastrar Jogador</h1>
    <form action="/cadastro-jogador" method="POST">
      <label>Nome:</label>
      <input name="nome" required>

      <label>Nickname:</label>
      <input name="nick" required>

      <label>Função:</label>
      <select name="funcao" required>
        <option value="top">Top</option>
        <option value="jungle">Jungle</option>
        <option value="mid">Mid</option>
        <option value="atirador">Atirador</option>
        <option value="suporte">Suporte</option>
      </select>

      <label>Elo:</label>
      <input name="elo" required>

      <label>Gênero:</label>
      <select name="genero" required>
        <option value="feminino">Feminino</option>
        <option value="masculino">Masculino</option>
        <option value="outro">Outro</option>
      </select>

      <label>Equipe:</label>
      <select name="equipe" required>
        ${options}
      </select>

      <button type="submit">Cadastrar</button>
    </form>

    <a href="/menu">Voltar ao menu</a>
  `);
});

// Cadastro jogador
app.post("/cadastro-jogador", auth, (req, res) => {
  const { nome, nick, funcao, elo, genero, equipe } = req.body;

  if (!nome || !nick || !funcao || !elo || !genero || !equipe) {
    return res.send("Todos os campos são obrigatórios!");
  }

  jogadores.push({ nome, nick, funcao, elo, genero, equipe });

  res.redirect("/lista-jogadores");
});

// Listagem agrupada por equipe
app.get("/lista-jogadores", auth, (req, res) => {
  let html = "<h1>Jogadores Cadastrados</h1>";

  equipes.forEach((eq) => {
    html += `<h2>Equipe: ${eq.nome}</h2>`;

    const daEquipe = jogadores.filter((j) => j.equipe === eq.nome);

    if (daEquipe.length === 0) {
      html += "<p>Nenhum jogador cadastrado.</p>";
    } else {
      daEquipe.forEach((j) => {
        html += `<p>${j.nome} (${j.nick}) — ${j.funcao} — ${j.elo} — ${j.genero}</p>`;
      });
    }
  });

  html += `
    <a href="/cadastro-jogador">Cadastrar outro</a><br>
    <a href="/menu">Menu</a>
  `;

  res.send(html);
});

// Exporta para o Vercel
module.exports = app;
