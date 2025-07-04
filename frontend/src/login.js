import React, { useState } from "react";

function Login({ onLogin, onShowRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:3010/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.text();
      onLogin(username);
    } else {
      setError("Usuário ou senha inválidos");
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
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Login</h2>
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
            Entrar
          </button>
          <button
            type="button"
            onClick={onShowRegister}
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
            Não tem conta? Cadastre-se
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
        </form>
      </div>
    </div>
  );
}

export default Login;
