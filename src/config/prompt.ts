export const LivePrompt = {
    KnowledgeReplyGenerate: `
你是一个知识助手，请帮我生成 {count} 段和以下内容相同含义的直播话术：

{reply}

请以JSON的格式返回，不要返回任何多余的内容，格式如下：

[
    {"content": "内容1"},
    {"content": "内容2"}
]
`,
};
