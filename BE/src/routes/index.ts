import { Router } from "express";
import OpenAi from 'openai'
import { basicPrompt, topLevelPrompt } from "../constants/react";
import { topLevelNodePrompt } from "../constants/node";
import { getSystemPrompt } from "../constants/system";
require("dotenv").config();
const apiKey = process.env.OPENAI_API_KEY;
const client = new OpenAi({
    apiKey: apiKey
});

require("dotenv").config();
const routeRouter = Router();

const getTech = async (prompt: string) => {
    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 100,
        messages: [{
            role: "user",
            content: prompt
        },
        {
            role: "system",
            content: "This is a user prompt analyse the prompt and tell in a single word if it a react project or node project. Just send a single word 'react' or 'node'. If it matches none return 'none'."
        }]
    });
    return response.choices[0].message.content;
}

routeRouter.post('/get-template', async (req, res) => {
    const prompt = req.body.prompt;
    const tech = await getTech(prompt);

    const reactLastPrompt = `<bolt_running_commands>\n</bolt_running_commands>\n\nCurrent Message:\n\n${prompt}\n\nFile Changes:\n\nHere is a list of all files that have been modified since the start of the conversation.\nThis information serves as the true contents of these files!\n\nThe contents include either the full file contents or a diff (when changes are smaller and localized).\n\nUse it to:\n - Understand the latest file modifications\n - Ensure your suggestions build upon the most recent version of the files\n - Make informed decisions about changes\n - Ensure suggestions are compatible with existing code\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - /home/project/.bolt/config.json`

    if (tech == "none") {
        res.status(401).json({
            "system": "we do not have this tech stack ready yet. Try reactjs or node for now."
        });
        return;
    }
    else {
        if (tech === 'react') {
            res.status(200).json({
                system: [
                    { id: "topLevelPrompt", message: topLevelPrompt },
                    { id: "basicPrompt", message: basicPrompt },
                    { id: "reactLastPrompt", message: reactLastPrompt },
                    { id: "userPrompt", message: prompt }
                ],
            });
            return;
        }
        else if (tech == 'node') {
            res.status(200).json({
                system: [
                    { id: "topLevelPrompt", message: topLevelNodePrompt },
                    { id: "userPrompt", message: prompt },
                ]
            });
            return;
        }
    }
    res.status(203).json({
        "result": tech
    });
    return;
})

routeRouter.post('/ai-chat', async (req, res) => {
    const messages = req.body.messages;
    const chatMessages = [...messages, {
        "role": "system",
        "content": getSystemPrompt()
    }]
    console.log(chatMessages);
    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 2000,
        stream: true,
        messages: chatMessages,
    });
    let finalres = ""
    // console.log(JSON.stringify(response?.choices[0]?.message),'thiss');
    for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        process.stdout.write(content); // Stream output in real time
        finalres += content;
    }
    res.json({
        code: finalres
    });
    return;
}
)

export default routeRouter;