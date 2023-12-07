const { Configuration, OpenAIApi } = require("openai");

console.log(process.env.OPENAI_KEY)

const openai = OpenAIApi({
  apiKey: "",
});


// Now you can use the 'openai' instance to make API calls

  async function run(){
    const response = await openAi.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "5+5" }],
    })
  
    console.log(response.data.choices[0].message.content)

  }

  run();