// Programado por Luiz Fernando Olivetti Albieri Zanon
//RA 1044.25.1960-4


const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Sessão (30 min)
app.use(
  session({
    secret: "chave-super-secreta",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 60 * 1000 }
  })
);

// Armazenamento em memória
const teams = [];
const ROLES = ["top", "jungle", "mid", "atirador", "suporte"];
const ELOS = ["Ferro","Bronze","Prata","Ouro","Platina","Diamante","Mestre","Grão-mestre","Desafiante"];

// Helpers 
function trim(v) { return (v || "").toString().trim(); }
function findTeam(id) { return teams.find(t => t.id === id); }

// LOGIN 
app.post("/api/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === "admin" && senha === "123") {
    req.session.loggedIn = true;

    const agora = new Date().toLocaleString("pt-BR");
    res.cookie("ultimoAcesso", agora, { maxAge: 30 * 60 * 1000 });

    return res.json({ ok: true, message: "Login efetuado." });
  }

  res.status(401).json({ ok: false, error: "Usuário ou senha inválidos." });
});

// LOGOUT 
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true, message: "Logout realizado." });
  });
});

// Middleware para proteger rotas
function auth(req, res, next) {
  if (!req.session.loggedIn) {
    return res.status(401).json({ ok: false, error: "Não autenticado." });
  }
  next();
}

// CADASTRO DE EQUIPES
app.post("/api/teams", auth, (req, res) => {
  const nome = trim(req.body.nome);
  const capitao = trim(req.body.capitao);
  const contato = trim(req.body.contato);

  if (!nome || !capitao || !contato) {
    return res.status(400).json({ ok: false, error: "Todos os campos são obrigatórios." });
  }

  if (teams.some(t => t.nome.toLowerCase() === nome.toLowerCase())) {
    return res.status(400).json({ ok: false, error: "Já existe equipe com esse nome." });
  }

  const team = {
    id: uuidv4(),
    nome,
    capitao,
    contato,
    players: []
  };

  teams.push(team);

  res.json({ ok: true, team });
});

// LISTAR EQUIPES
app.get("/api/teams", auth, (req, res) => {
  res.json({ ok: true, teams });
});

// CADASTRO DE JOGADORES
app.post("/api/players", auth, (req, res) => {
  const nome = trim(req.body.nome);
  const nickname = trim(req.body.nickname);
  const role = trim(req.body.role);
  const elo = trim(req.body.elo);
  const genero = trim(req.body.genero);
  const teamId = trim(req.body.teamId);

  if (!nome || !nickname || !role || !elo || !genero || !teamId) {
    return res.status(400).json({ ok: false, error: "Todos os campos são obrigatórios." });
  }

  if (!ROLES.includes(role)) {
    return res.status(400).json({ ok: false, error: "Função inválida." });
  }

  if (!ELOS.includes(elo)) {
    return res.status(400).json({ ok: false, error: "Elo inválido." });
  }

  const team = findTeam(teamId);

  if (!team) {
    return res.status(400).json({ ok: false, error: "Equipe não encontrada." });
  }

  if (team.players.length >= 5) {
    return res.status(400).json({ ok: false, error: "A equipe já possui 5 jogadores." });
  }

  if (team.players.some(p => p.role === role)) {
    return res.status(400).json({ ok: false, error: "Já existe jogador nessa função na equipe." });
  }

  const player = {
    id: uuidv4(),
    nome,
    nickname,
    role,
    elo,
    genero
  };

  team.players.push(player);

  res.json({ ok: true, player });
});

// LISTAR JOGADORES POR EQUIPE 
app.get("/api/players-by-team", auth, (req, res) => {
  res.json({
    ok: true,
    teams: teams.map(t => ({
      id: t.id,
      nome: t.nome,
      capitao: t.capitao,
      contato: t.contato,
      players: t.players
    }))
  });
});

// fallback
app.all("/api/*", (req, res) => {
  res.status(404).json({ ok: false, error: "Rota não encontrada" });
});

module.exports = app;
