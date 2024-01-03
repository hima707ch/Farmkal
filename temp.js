const OpenAI = require("openai");

console.log(process.env.OPENAI_KEY);

const openai = new OpenAI({
  apiKey: "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",
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "gpt-3.5-turbo",
  });

  console.log(completion.choices[0]);
}

main();
