const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mime = require("mime-types");

const genAI = new GoogleGenerativeAI("AIzaSyCNvS9npSfcsumSLyo7tZcL80OFvPVcbEM");

async function gerarDescricaoDaImagem(caminho) {
  try {
    const modelo = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const data = fs.readFileSync(caminho);
    const mimeType = mime.lookup(caminho) || "image/jpeg";

    const imagem = {
      inlineData: {
        data: data.toString("base64"),
        mimeType,
      },
    };

    const resultado = await modelo.generateContent({
      contents: [
        {
          parts: [
            {
              text: "Descreva esta imagem em uma única frase curta e criativa. Não inclua nenhuma introdução, explicação ou frase adicional. A resposta deve conter apenas a descrição, sem rodeios.",
            },
            imagem,
          ],
        },
      ],
    });

    const resposta = await resultado.response;
    const textoFinal = await resposta.text();

    if (!textoFinal || typeof textoFinal !== "string") {
      throw new Error("Resposta inválida da IA.");
    }

    return textoFinal.trim();
  } catch (error) {
    console.error("❌ Erro ao gerar descrição da imagem:", error.message);
    return "Não foi possível gerar a descrição. Tente novamente com outra imagem.";
  }
}

module.exports = gerarDescricaoDaImagem;
