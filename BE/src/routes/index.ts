import { Router } from "express";
import OpenAi from 'openai'
import { topLevelNodePrompt } from "../constants/node";
import { getSystemPrompt } from "../constants/system";
import { BASE_PROMPT } from "../prompts";
import { basePrompt as nodeBasePrompt } from "../defaults/node";
import { basePrompt as reactBasePrompt } from "../defaults/react";
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
            res.json({
                prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [reactBasePrompt]
            })
            return;
        }
        if (tech === "node") {
            res.json({
                prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [nodeBasePrompt]
            })
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
    const chatMessages = [
        {
            role: "system",
            content: getSystemPrompt()
        },
        {
            role: "system",
            content: "you can also give code and artifacts for the files which will be required to as per the user project demands. Also give code in such format that is runs directly, do not need to parse the code. Do not use annotations such as &gt and others."
        },
        ...messages // <- messages already contains proper role/content structure
    ];
    console.log(chatMessages, 'chat messages')
    const response = await client.chat.completions.create({
        model: "chatgpt-4o-latest",
        temperature: 0,
        max_tokens: 8000,
        messages: chatMessages,
    });
    res.json({
        response: response?.choices[0]?.message
    });
    return;
}
)

routeRouter.get('/health', async (req, res) => {
    res.json({
        "response": "Server is fine."
    })
})

export default routeRouter;