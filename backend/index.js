const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const db = require("./db");

const mime = require("mime-types");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCNvS9npSfcsumSLyo7tZcL80OFvPVcbEM");

const app = express();
const PORT = 3010;

const gerarDescricaoDaImagem = require("./gemini"); // Certifique-se que esse arquivo existe

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: multer.memoryStorage() });
const uploadDisk = multer({ storage }); // ✅ usa diskStorage

// Upload de imagem
app.post("/upload", uploadDisk.single("image"), async (req, res) => {
  const { name } = req.body;
  if (!req.file || !req.file.filename) {
    return res.status(400).send("Arquivo de imagem não enviado corretamente.");
  }

  const filename = req.file.filename;

  const createdAt = new Date().toISOString();
  const imagePath = path.join(__dirname, "uploads", filename);

  try {
    const description = await gerarDescricaoDaImagem(imagePath); // ← chamada para Gemini

    db.run(
      "INSERT INTO images (name, description, filename, created_at) VALUES (?, ?, ?, ?)",
      [name, description, filename, createdAt],
      function (err) {
        if (err) return res.status(500).send(err.message);
        res.json({
          id: this.lastID,
          name,
          description,
          filename,
          created_at: createdAt,
        });
      }
    );
  } catch (error) {
    console.error("Erro ao gerar descrição com IA:", error.message);
    res.status(500).send("Erro ao gerar descrição.");
  }
});

app.post("/descricao", upload.single("image"), async (req, res) => {
  try {
    console.log("Arquivo recebido:", req.file);

    if (!req.file) {
      return res.status(400).json({ erro: "Nenhum arquivo recebido." });
    }

    // Salva temporariamente o arquivo gerado via URL
    const filePath = path.join(__dirname, "uploads", Date.now() + ".jpg");
    fs.writeFileSync(filePath, req.file.buffer);

    // Usa a função correta que você já tem
    const descricaoGerada = await gerarDescricaoDaImagem(filePath);

    // Remove o arquivo temporário
    fs.unlinkSync(filePath);

    res.json({ descricao: descricaoGerada });
  } catch (err) {
    console.error("Erro interno:", err);
    res.status(500).json({ erro: err.message });
  }
});

app.get("/pexels", async (req, res) => {
  try {
    const query = req.query.q;
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        query
      )}&per_page=1`,
      {
        headers: {
          Authorization:
            "Na62FR5I9powiHaIkIJ2AE24OQBJaUpwojg9eOHLQExSuuaefvxv5enB",
        },
      }
    );

    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("application/json")
    ) {
      throw new Error(`Resposta inválida da API do Pexels: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Atualizar imagem
app.put("/images/:id", uploadDisk.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const newFile = req.file?.filename;

  db.get("SELECT filename FROM images WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).send(err.message);
    if (!row) return res.status(404).send("Imagem não encontrada");

    const oldFilePath = path.join(__dirname, "uploads", row.filename);

    const updatedAt = new Date().toISOString();

    const query = newFile
      ? "UPDATE images SET name = ?, description = ?, filename = ?, created_at = ? WHERE id = ?"
      : "UPDATE images SET name = ?, description = ?, created_at = ? WHERE id = ?";
    const params = newFile
      ? [name, description, newFile, updatedAt, id]
      : [name, description, updatedAt, id];

    db.run(query, params, function (err) {
      if (err) return res.status(500).send(err.message);
      if (newFile && fs.existsSync(oldFilePath)) {
        fs.unlink(oldFilePath, () => {});
      }
      res.send({ id, name, description, filename: newFile || row.filename });
    });
  });
});

// Registrar usuário
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).send("Campos obrigatórios");

  try {
    const password_hash = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, password_hash],
      function (err) {
        if (err) return res.status(500).send("Erro ao registrar");
        res.status(201).send("Usuário registrado com sucesso");
      }
    );
  } catch (err) {
    res.status(500).send("Erro no servidor");
  }
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err || !user) return res.status(401).send("Usuário não encontrado");

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).send("Senha incorreta");

      res.send("Login bem-sucedido");
    }
  );
});

// Listar imagens
app.get("/images", (req, res) => {
  const search = req.query.q || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const like = `%${search}%`;
  const sort = req.query.sort || "recent";

  let orderBy = "id DESC";
  if (sort === "oldest") orderBy = "id ASC";
  if (sort === "az") orderBy = "name COLLATE NOCASE ASC";
  if (sort === "za") orderBy = "name COLLATE NOCASE DESC";

  const queryData = `
    SELECT * FROM images
    WHERE name LIKE ? OR description LIKE ?
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  const queryCount = `
    SELECT COUNT(*) as total FROM images
    WHERE name LIKE ? OR description LIKE ?
  `;

  db.all(queryData, [like, like, limit, offset], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    db.get(queryCount, [like, like], (err2, result) => {
      if (err2) return res.status(500).send(err2.message);
      res.json({ data: rows, total: result.total });
    });
  });
});

// Deletar imagem
app.delete("/images/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT filename FROM images WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).send(err.message);
    if (!row) return res.status(404).send("Imagem não encontrada");

    const filePath = path.join(__dirname, "uploads", row.filename);

    db.run("DELETE FROM images WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).send(err.message);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {});
      }
      res.sendStatus(204);
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
