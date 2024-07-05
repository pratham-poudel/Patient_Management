const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function run(prompt) {
  const model = genAI.getGenerativeModel({model:"gemini-pro"});
  const result=await model.generateContent(prompt);
  const response=await result.response;
  const text=response.text();
  console.log(text)
}

run("tell me a joke about cats");
