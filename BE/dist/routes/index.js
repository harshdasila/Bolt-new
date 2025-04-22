"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openai_1 = __importDefault(require("openai"));
const system_1 = require("../constants/system");
const prompts_1 = require("../prompts");
const node_1 = require("../defaults/node");
const react_1 = require("../defaults/react");
require("dotenv").config();
const apiKey = process.env.OPENAI_API_KEY;
const client = new openai_1.default({
    apiKey: apiKey
});
require("dotenv").config();
const routeRouter = (0, express_1.Router)();
const getTech = (prompt) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield client.chat.completions.create({
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
});
routeRouter.post('/get-template', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = req.body.prompt;
    const tech = yield getTech(prompt);
    const reactLastPrompt = `<bolt_running_commands>\n</bolt_running_commands>\n\nCurrent Message:\n\n${prompt}\n\nFile Changes:\n\nHere is a list of all files that have been modified since the start of the conversation.\nThis information serves as the true contents of these files!\n\nThe contents include either the full file contents or a diff (when changes are smaller and localized).\n\nUse it to:\n - Understand the latest file modifications\n - Ensure your suggestions build upon the most recent version of the files\n - Make informed decisions about changes\n - Ensure suggestions are compatible with existing code\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - /home/project/.bolt/config.json`;
    if (tech == "none") {
        res.status(401).json({
            "system": "we do not have this tech stack ready yet. Try reactjs or node for now."
        });
        return;
    }
    else {
        if (tech === 'react') {
            res.json({
                prompts: [prompts_1.BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${react_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [react_1.basePrompt]
            });
            return;
        }
        if (tech === "node") {
            res.json({
                prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${react_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [node_1.basePrompt]
            });
            return;
        }
    }
    res.status(203).json({
        "result": tech
    });
    return;
}));
routeRouter.post('/ai-chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const messages = req.body.messages;
    const chatMessages = [
        {
            role: "system",
            content: (0, system_1.getSystemPrompt)()
        },
        {
            role: "system",
            content: "you can also give code and artifacts for the files which will be required to as per the user project demands. Also give code in such format that is runs directly, do not need to parse the code. Do not use annotations such as &gt and others."
        },
        ...messages // <- messages already contains proper role/content structure
    ];
    console.log(chatMessages, 'chat messages');
    const response = yield client.chat.completions.create({
        model: "chatgpt-4o-latest",
        temperature: 0,
        max_tokens: 8000,
        messages: chatMessages,
    });
    res.json({
        response: (_a = response === null || response === void 0 ? void 0 : response.choices[0]) === null || _a === void 0 ? void 0 : _a.message
    });
    return;
}));
routeRouter.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({
        "response": "Server is fine."
    });
}));
exports.default = routeRouter;
