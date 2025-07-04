import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import Login from "./login";
import Register from "./Register";

function App() {
  const [form, setForm] = useState({ name: "", description: "", image: null });
  const [images, setImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [sortOrder, setSortOrder] = useState("recent");
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [avisoImagem, setAvisoImagem] = useState(false);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [mensagemLoading, setMensagemLoading] = useState("");

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const buscarImagemPexels = async () => {
    // Verifica se a descrição está presente
    if (!form || !form.description?.trim()) {
      alert("Preencha a descrição antes de buscar uma imagem.");
      return;
    }

    setMensagemLoading("🔍 Buscando imagem no Pexels...");
    setLoadingGlobal(true);

    try {
      const query = encodeURIComponent(form.description.trim());

      const res = await fetch(`http://localhost:3010/pexels?q=${query}`);

      if (!res.ok) {
        throw new Error(`Requisição falhou com status ${res.status}`);
      }

      const data = await res.json();
      const imagemUrl = data?.photos?.[0]?.src?.medium;

      if (!imagemUrl) {
        alert("Nenhuma imagem encontrada no Pexels.");
        return;
      }

      setPreview(imagemUrl);
      setForm((prev) => ({
        ...prev,
        image: imagemUrl,
      }));

      setMensagemLoading("✅ Imagem carregada!");
    } catch (err) {
      console.error("Erro ao buscar imagem no Pexels:", err);
      alert("Erro ao buscar imagem com Pexels.");
    } finally {
      await delay(400);
      setLoadingGlobal(false);
      setMensagemLoading("");
    }
  };

  const inputStyle = {
    width: "480px",
    padding: "0.5rem",
    marginBottom: "1rem",
    borderRadius: "4px",
    backgroundColor: "#2a2a2a",
    color: "#fff",
    border: "1px solid #444",
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  };

  const gerarDescricaoIA = async () => {
    if (!form.image) {
      setAvisoImagem(true);
      return; // ⚠️ não liga o loading se vai parar aqui
    }

    setAvisoImagem(false);
    setLoadingGlobal(true); // 🟢 agora sim: liga quando vai continuar

    if (typeof form.image === "string") {
      try {
        const res = await fetch(form.image);
        const blob = await res.blob();
        const file = new File([blob], "imagem.jpg", { type: blob.type });
        form.image = file;
        const filename =
          typeof form.image === "string"
            ? form.image.split("/").pop() || "imagem.jpg"
            : form.image.name || "imagem.jpg";

        form.image = file;
      } catch (error) {
        console.error("Erro ao converter imagem:", error);
        alert("Falha ao preparar imagem gerada para descrição.");
        setLoadingGlobal(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append("image", form.image);
    formData.append("name", form.name);

    try {
      const res = await fetch("http://localhost:3010/descricao", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Erro ao gerar descrição");

      const data = await res.json();
      setForm((prev) => ({ ...prev, description: data.descricao }));
    } catch (error) {
      console.error("Erro ao gerar descrição:", error.message);
      alert("Não foi possível gerar a descrição automaticamente.");
    } finally {
      await delay(400);
      setLoadingGlobal(false);
    }
  };
  const fetchImages = async (
    pageToLoad = page,
    term = searchTerm,
    sort = sortOrder
  ) => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:3010/images?q=${encodeURIComponent(
          term
        )}&page=${pageToLoad}&limit=${limit}&sort=${sort}`
      );

      const result = await res.json();
      setImages(result.data);
      setTotal(result.total);
      setHasMore(result.data.length === 10);
    } catch (err) {
      console.error("Erro ao buscar imagens:", err);
    } finally {
      await delay(400);
      setLoadingGlobal(false);
    }
  };

  useEffect(() => {
    fetchImages(page, searchTerm, sortOrder);
  }, [page, searchTerm, sortOrder]);

  const handleEdit = (img) => {
    setForm({ name: img.name, description: img.description, image: null });
    setEditingId(img.id);
    setPreview(`http://localhost:3010/uploads/${img.filename}`);
    carregarImagemExistente(img.filename); // 🔥 aqui é onde acontece a mágica
  };

  const handleCancel = () => {
    setForm({ name: "", description: "", image: null });
    setEditingId(null);
    setPreview(null);
  };

  const confirmDelete = (img) => {
    setPendingDelete(img);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const res = await fetch(
      `http://localhost:3010/images/${pendingDelete.id}`,
      {
        method: "DELETE",
      }
    );
    if (res.ok) {
      if (editingId === pendingDelete.id) handleCancel();
      fetchImages();
    }
    setPendingDelete(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setForm((prev) => ({ ...prev, image: file }));
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const carregarImagemExistente = async (filename) => {
    try {
      setLoadingGlobal(true); // 🟢 INICIA LOADING
      const response = await fetch(`http://localhost:3010/uploads/${filename}`);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type });
      setForm((prev) => ({ ...prev, image: file }));
    } catch (err) {
      console.error("Erro ao carregar imagem existente:", err);
    } finally {
      setLoadingGlobal(false); // 🔴 ENCERRA LOADING
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingGlobal(true); // 🟢 INICIA LOADING

    const data = new FormData();
    data.append("name", form.name);
    data.append("description", form.description);
    if (form.image) data.append("image", form.image);

    const url = editingId
      ? `http://localhost:3010/images/${editingId}`
      : "http://localhost:3010/upload";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        body: data,
      });

      if (!res.ok) {
        alert("Erro ao enviar imagem");
        if (!form.name || !form.description || !form.image) {
          alert("Preencha todos os campos e selecione uma imagem.");
          setLoadingGlobal(false);
          return;
        }
      }

      setForm({ name: "", description: "", image: null });
      setEditingId(null);
      setPreview(null);
      setPage(1);
      setSearchTerm(searchInput);
      fetchImages(1, searchInput);
    } catch (err) {
      console.error("Erro no envio:", err);
      alert("Erro ao enviar imagem");
    } finally {
      setLoadingGlobal(false); // 🔴 ENCERRA LOADING
    }
  };

  const visibleImages = Array.isArray(images) ? images : [];

  return !user ? (
    showRegister ? (
      <Register onRegisterSuccess={() => setShowRegister(false)} />
    ) : (
      <Login
        onLogin={(username) => {
          const storedToken = localStorage.getItem("token");
          setUser(username);
          setToken(storedToken);
        }}
        onShowRegister={() => setShowRegister(true)}
      />
    )
  ) : (
    // ... aqui continua o conteúdo atual do seu App (upload, imagens, etc.)

    <div
      style={{
        backgroundColor: "#121212",
        color: "#f0f0f0",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        padding: "2rem",
      }}
    >
      <div style={{ textAlign: "right", marginBottom: "1rem" }}>
        <button
          onClick={() => setUser(null)}
          style={{
            backgroundColor: "#e74c3c",
            color: "#fff",
            border: "none",
            padding: "0.4rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </div>
      <div
        style={{
          backgroundColor: "#1e1e1e",
          padding: "2rem",
          borderRadius: "8px",
          flex: "1",
          boxShadow: "0 0 10px rgba(0,0,0,0.4)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          {editingId ? "Editar Imagem" : "Upload de Imagem"}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            style={inputStyle}
          />

          <label
            style={{
              display: "block",
              width: "280px",
              margin: "0 auto 1rem",
              backgroundColor: "#2a2a2a",
              color: "#ccc",
              padding: "0.5rem",
              textAlign: "center",
              borderRadius: "4px",
              border: "1px solid #444",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Selecionar imagem
            <input
              type="file"
              accept="image/*"
              name="image"
              onChange={handleImageChange}
              style={{
                display: "none",
              }}
            />
          </label>
          <div style={{ textAlign: "center" }}>
            <button
              type="button"
              onClick={buscarImagemPexels}
              disabled={!form.description}
              style={{
                width: "20%",
                padding: "0.5rem",
                backgroundColor: form.description ? "#8e44ad" : "#555",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.9rem",
                cursor: form.description ? "pointer" : "not-allowed",
                marginBottom: "1rem",
                opacity: form.description ? 1 : 0.7,
              }}
            >
              🖼️ Buscar imagem no Pexels
            </button>
          </div>

          <input
            type="text"
            placeholder="Insira uma descrição ou crie utilizando IA"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            style={inputStyle}
          />
          <div style={{ textAlign: "center" }}>
            <button
              type="button"
              onClick={gerarDescricaoIA}
              style={{
                width: "20%",
                padding: "0.5rem",
                backgroundColor: "#26a69a",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.9rem",
                cursor: "pointer",
                marginBottom: "1rem",
              }}
            >
              Gerar descrição com IA
            </button>

            {avisoImagem && (
              <p
                style={{
                  color: "#ff6b6b",
                  fontSize: "0.85rem",
                  textAlign: "center",
                  marginBottom: "1rem",
                }}
              >
                ⚠️ Selecione uma imagem ou crie uma utilizando IA antes de gerar
                uma descrição.
              </p>
            )}
          </div>
          {preview && (
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <img
                src={preview}
                alt="Prévia gerada"
                style={{
                  maxWidth: "200px",
                  maxHeight: "200px",
                  width: "100%",
                  height: "auto",
                  borderRadius: "6px",
                  boxShadow: "0 0 8px rgba(0,0,0,0.5)",
                  objectFit: "contain",
                  cursor: "pointer", // 👈 ainda parece clicável
                }}
                onClick={() => setLightboxImage(preview)} // 👈 abre como lightbox interno
              />
            </div>
          )}

          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <button
              type="submit"
              style={{
                padding: "0.4rem 1.2rem",
                backgroundColor: "#26a69a",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              {editingId ? "Salvar" : "Enviar"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  marginLeft: "1rem",
                  padding: "0.4rem 1rem",
                  backgroundColor: "#757575",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>
          Imagens Salvas
        </h3>
        {!loading && searchTerm && (
          <p
            style={{ textAlign: "center", color: "#ccc", marginBottom: "1rem" }}
          >
            {total === 0
              ? "Nenhuma imagem encontrada"
              : `${total} imagem${total > 1 ? "s" : ""} encontrada${
                  total > 1 ? "s" : ""
                }`}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearchTerm(searchInput);
          }}
          style={{
            textAlign: "center",
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              maxWidth: "280px",
              padding: "0.5rem",
              borderRadius: "4px",
              backgroundColor: "#2a2a2a",
              color: "#fff",
              border: "1px solid #444",
              flex: "1 0 auto",
            }}
          />

          <button
            type="submit"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#26a69a",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Buscar
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setSearchTerm("");
            }}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#757575",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Limpar
          </button>
        </form>
        <select
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value);
            setPage(1); // isso já dispara useEffect com sortOrder
          }}
          style={inputStyle}
        >
          <option value="recent">Mais recente</option>
          <option value="oldest">Mais antigo</option>
          <option value="az">A–Z</option>
          <option value="za">Z–A</option>
        </select>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "1.5rem",
            justifyContent: "center", // 👈 centraliza o grid
            maxWidth: "1000px", // 👈 largura máxima opcional
            margin: "0 auto", // 👈 centraliza o bloco na tela
          }}
        >
          {visibleImages.map((img) => (
            <div
              key={img.id}
              style={{
                backgroundColor: "#2a2a2a",
                padding: "0.5rem",
                borderRadius: "6px",
                width: "100%",
              }}
            >
              <div
                style={{
                  height: "200px",
                  backgroundColor: "#1a1a1a",
                  borderRadius: "6px",
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={`http://localhost:3010/uploads/${img.filename}`}
                  alt={img.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setLightboxImage(
                      `http://localhost:3010/uploads/${img.filename}`
                    )
                  }
                />
              </div>

              <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                <strong>{img.name}</strong>
                <br />
                {img.description}
                <br />
                <span style={{ fontSize: "0.8rem", color: "#aaa" }}>
                  Data: {new Date(img.created_at).toLocaleDateString("pt-BR")}
                </span>
                <br />
                <span style={{ fontSize: "0.8rem", color: "#aaa" }}>
                  Hora:{" "}
                  {new Date(img.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleEdit(img)}
                  style={{
                    flex: 1,
                    backgroundColor: "#2ecc71",
                    color: "#fff",
                    border: "none",
                    padding: "0.4rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                  }}
                >
                  <FiEdit2 /> Editar
                </button>
                <button
                  onClick={() => confirmDelete(img)}
                  style={{
                    flex: 1,
                    backgroundColor: "#e74c3c",
                    color: "#fff",
                    border: "none",
                    padding: "0.4rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                  }}
                >
                  <FiTrash2 /> Remover
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          {[...Array(Math.ceil(total / limit))].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              style={{
                margin: "0 0.25rem",
                padding: "0.5rem 0.9rem",
                backgroundColor: page === i + 1 ? "#26a69a" : "#333",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: page === 1 ? "#444" : "#26a69a",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: page === 1 ? "not-allowed" : "pointer",
              marginRight: "1rem",
              opacity: page === 1 ? 0.6 : 1,
            }}
          >
            Página anterior
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: !hasMore ? "#444" : "#26a69a",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: !hasMore ? "not-allowed" : "pointer",
              opacity: !hasMore ? 0.6 : 1,
            }}
          >
            Próxima página
          </button>
        </div>
      </div>

      {lightboxImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setLightboxImage(null)} // 👈 fecha ao clicar fora
        >
          <div
            style={{ position: "relative" }}
            onClick={(e) => e.stopPropagation()} // 👈 evita fechar ao clicar dentro da imagem
          >
            <img
              src={lightboxImage}
              alt="Visualização ampliada"
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                borderRadius: "8px",
              }}
            />
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: "absolute",
                top: "-10px",
                right: "-10px",
                background: "#e74c3c",
                border: "none",
                borderRadius: "50%",
                color: "#fff",
                width: "32px",
                height: "32px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#1e1e1e",
              padding: "2rem",
              borderRadius: "8px",
              textAlign: "center",
              maxWidth: "90%",
              color: "#fff",
            }}
          >
            <p>
              Deseja realmente remover <strong>{pendingDelete.name}</strong>?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <button
                onClick={handleDelete}
                style={{
                  padding: "0.5rem 1.5rem",
                  backgroundColor: "#e74c3c",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Remover
              </button>
              <button
                onClick={() => setPendingDelete(null)}
                style={{
                  padding: "0.5rem 1.5rem",
                  backgroundColor: "#555",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {loadingGlobal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              border: "6px solid #f3f3f3",
              borderTop: "6px solid #26a69a",
              borderRadius: "50%",
              width: "60px",
              height: "60px",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
        </div>
      )}
    </div>
  );
}

export default App;
