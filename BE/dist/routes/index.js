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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openai_1 = __importDefault(require("openai"));
const react_1 = require("../constants/react");
const node_1 = require("../constants/node");
const system_1 = require("../constants/system");
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
            res.status(200).json({
                system: [
                    { id: "topLevelPrompt", message: react_1.topLevelPrompt },
                    { id: "basicPrompt", message: react_1.basicPrompt },
                    { id: "reactLastPrompt", message: reactLastPrompt },
                    { id: "userPrompt", message: prompt }
                ],
            });
            return;
        }
        else if (tech == 'node') {
            res.status(200).json({
                system: [
                    { id: "topLevelPrompt", message: node_1.topLevelNodePrompt },
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
}));
routeRouter.post('/ai-chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    var _d, _e;
    const messages = req.body.messages;
    const chatMessages = [...messages, {
            "role": "system",
            "content": (0, system_1.getSystemPrompt)()
        }];
    console.log(chatMessages);
    const response = yield client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 2000,
        stream: true,
        messages: chatMessages,
    });
    let finalres = "";
    try {
        // console.log(JSON.stringify(response?.choices[0]?.message),'thiss');
        for (var _f = true, response_1 = __asyncValues(response), response_1_1; response_1_1 = yield response_1.next(), _a = response_1_1.done, !_a; _f = true) {
            _c = response_1_1.value;
            _f = false;
            const chunk = _c;
            const content = ((_e = (_d = chunk.choices[0]) === null || _d === void 0 ? void 0 : _d.delta) === null || _e === void 0 ? void 0 : _e.content) || '';
            process.stdout.write(content); // Stream output in real time
            finalres += content;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_f && !_a && (_b = response_1.return)) yield _b.call(response_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    res.json({
        code: finalres
    });
    return;
}));
exports.default = routeRouter;
