---
name: aigcpanel-skills
description: 通过 AigcPanel Pro 内置 HTTP 接口调用本地 AI 模型。当需要列出可用模型、调用模型生成内容、或查询任务结果时使用本技能。适用场景：自动化脚本调用 AI 模型、外部程序集成 AigcPanel Pro、批量处理任务。
---

# AigcPanel Pro HTTP 接口

AigcPanel Pro 内置 HTTP 接口服务，默认监听 `http://localhost:59999`，提供模型列表、模型调用和结果查询能力。

## 前提条件

确认服务已启动：打开应用 **设置 → HTTP 接口**，确认状态为"运行中"。若未启动，点击"启动服务"按钮，或开启"自动启动"后重启应用。

## 接口说明

### 获取可用模型

```
GET http://localhost:59999/api/model/list
```

响应示例：
```json
{
  "code": 0,
  "data": [
    { "id": "openai|gpt-4o", "providerId": "openai", "modelId": "gpt-4o", "modelName": "GPT-4o" },
    { "id": "deepseek|deepseek-chat", "providerId": "deepseek", "modelId": "deepseek-chat", "modelName": "DeepSeek Chat" }
  ]
}
```

`id` 格式为 `providerId|modelId`，调用时需传此值。

### 调用模型

```
POST http://localhost:59999/api/model/call
Content-Type: application/json

{ "model": "deepseek|deepseek-chat", "prompt": "用一句话介绍自己", "systemPrompt": "你是助手" }
```

- `model`（必填）：模型 ID，来自列表接口的 `id` 字段
- `prompt`（必填）：用户输入
- `systemPrompt`（可选）：系统提示词

响应：
```json
{ "code": 0, "data": { "taskId": "m3x7k2abc" } }
```

### 查询任务结果

```
GET http://localhost:59999/api/model/query?taskId=m3x7k2abc
```

响应（进行中）：`{ "code": 0, "data": { "status": "pending" } }`

响应（成功）：`{ "code": 0, "data": { "status": "success", "result": "..." } }`

响应（失败）：`{ "code": 0, "data": { "status": "error", "error": "..." } }`

`status` 为 `pending` 时继续轮询，建议间隔 500ms。

## 标准调用流程

1. 调用 `/api/model/list` 获取可用模型列表，选取目标模型 `id`
2. 调用 `/api/model/call` 传入 `model` 和 `prompt`，获得 `taskId`
3. 轮询 `/api/model/query?taskId=xxx` 直至 `status` 不为 `pending`
4. 读取 `result`（成功）或 `error`（失败）

## 错误处理

所有接口错误时返回 `{ "code": -1, "msg": "错误描述" }`，`code` 非 0 时视为失败。
常见原因：服务未启动、模型未在设置中启用、API Key 未配置。

