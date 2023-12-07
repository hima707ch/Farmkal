const OpenAI = require("openai");

const openAI = async (req, res, next) => {
  console.log(process.env.OPENAI_KEY);

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
    // Additional configuration options (optional)
  });

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "system", content: "" }],
  });

  console.log(response.data.choices[0].message.content);

  next();
}

module.exports = openAI;
