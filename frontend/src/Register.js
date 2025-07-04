import React, { useState } from "react";

function Register({ onRegisterSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      setError("As senhas não coincidem");
      setMessage("");
      return;
    }

    const res = await fetch("http://localhost:3010/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      setMessage("Cadastro realizado com sucesso!");
      setError("");
      setUsername("");
      setPassword("");
      setConfirm("");
      onRegisterSuccess && onRegisterSuccess();
    } else {
      setError("Erro ao cadastrar. Nome de usuário já pode estar em uso.");
      setMessage("");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#121212",
        color: "#f0f0f0",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        padding: "2rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#1e1e1e",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 0 10px rgba(0,0,0,0.4)",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          Cadastro
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              marginBottom: "1rem",
              borderRadius: "4px",
              backgroundColor: "#2a2a2a",
              color: "#fff",
              border: "1px solid #444",
              boxSizing: "border-box",
            }}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              marginBottom: "1rem",
              borderRadius: "4px",
              backgroundColor: "#2a2a2a",
              color: "#fff",
              border: "1px solid #444",
              boxSizing: "border-box",
            }}
          />
          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              marginBottom: "1rem",
              borderRadius: "4px",
              backgroundColor: "#2a2a2a",
              color: "#fff",
              border: "1px solid #444",
              boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.5rem",
              backgroundColor: "#26a69a",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Cadastrar
          </button>
          <button
            type="button"
            onClick={onRegisterSuccess}
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: "0.5rem",
              backgroundColor: "#555",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Já tem conta? Entrar
          </button>
          {error && (
            <p
              style={{
                color: "#e74c3c",
                marginTop: "1rem",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}
          {message && (
            <p
              style={{
                color: "#2ecc71",
                marginTop: "1rem",
                textAlign: "center",
              }}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default Register;
