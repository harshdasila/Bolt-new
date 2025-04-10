import express from 'express'
import cors from 'cors'
import routeRouter from './routes';
import OpenAi from 'openai'
require("dotenv").config();
const apiKey = process.env.OPENAI_API_KEY;

const app = express();
app.use(express.json());
app.use(cors());
app.use('/', routeRouter);
app.listen(3000);

const client = new OpenAi({
  apiKey: apiKey
});

async function chat() {
    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 100,
        stream: true,
        messages: [{
            role: "user",
            content: "create a simple static html page that has  tables for dummmy data."
            
        }]
    });
    // console.log(JSON.stringify(response?.choices[0]?.message),'thiss');
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content); // Stream output in real time
    }
}
// chat();