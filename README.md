# 智谱智能体微信小程序 🤖

接入**智谱 GLM-5** 大模型的智能体微信小程序，支持多轮对话与**知识库 RAG 问答**。

- 前端：原生微信小程序（对话页 / 知识库页 / 设置页）
- 后端：Node.js + Express（无原生依赖，任意机器可跑）
- 模型：智谱 **GLM-5**（对话）+ **embedding-3**（向量化），OpenAI SDK 兼容方式调用
- 知识库：文档 → 分块 → 向量化 → 余弦相似度检索（纯 JS，数据落盘 JSON）

```
wechat-agent/
├── server/              # Node.js 后端
│   ├── src/
│   │   ├── index.js            # 入口
│   │   ├── config.js           # 配置（模型名/分块参数等）
│   │   ├── routes/             # chat / knowledge 路由
│   │   ├── services/           # glm / embedding / rag / vectorStore
│   │   └── utils/              # parser / chunker
│   └── .env.example
├── miniprogram/         # 微信小程序
│   ├── pages/{chat,knowledge,settings}/
│   ├── utils/request.js
│   └── app.*
└── project.config.json  # 微信开发者工具项目配置
```

---

## 一、准备：智谱 API Key（双 Key 配置）

由于 **Coding Plan（编码套餐）Key 只能用于对话、不能向量化**，本项目采用「双 Key 双端点」架构：

| 用途 | Key 来源 | 端点 | 模型 |
|------|---------|------|------|
| **对话** | Coding Plan 套餐 Key | `https://open.bigmodel.cn/api/coding/paas/v4` | glm-5 |
| **向量化** | 普通（按量计费）Key | `https://open.bigmodel.cn/api/paas/v4` | embedding-3（付费）/ embedding-2（免费，1024维） |

> 💡 **免费获取向量化 Key**：智谱新用户在 [bigmodel.cn](https://bigmodel.cn) 注册后通常赠送免费额度，且 `embedding-2` 本身免费。在控制台「API Keys」创建一个**普通 Key**（与 Coding Key 不同）即可。

> ⚠️ 如果你只有一个 Key 且它能同时对话+向量化（普通账号），只需把两个 Key 填成同一个即可。

---

## 二、配置并启动后端

1. 填写 Key：编辑 `server/.env`（参照 `.env.example`）
   ```bash
   ZHIPU_API_KEY=你的Coding_Plan_Key         # 对话用
   ZHIPU_EMBEDDING_API_KEY=你的普通Key         # 向量化用
   ```
2. 启动：
   ```bash
   cd server
   npm install                 # 安装依赖
   copy .env.example .env      # Windows（首次，或 cp .env.example .env）
   npm start                   # 默认 http://localhost:3000
   ```

看到以下输出即成功（注意两个 Key 都要 ✓）：
```
✅ 智能体后端已启动: http://localhost:3000
   对话  : glm-5 @ https://open.bigmodel.cn/api/coding/paas/v4
        Key: ✓ 已配置
   向量化: embedding-3 @ https://open.bigmodel.cn/api/paas/v4
        Key: ✓ 已配置
   知识库知识块: 0 条
```

快速验证：
```bash
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"message\":\"你好\",\"useKnowledge\":false}"
```

---

## 三、运行小程序

1. 打开**微信开发者工具**，导入项目，目录选 `wechat-agent`。
2. AppID 可选「测试号」（`project.config.json` 已用占位 id）。
3. **关键**：详情 → 本地设置 → 勾选 **「不校验合法域名…」**（本地开发必需）。
4. 真机调试时，把「设置」页的后端地址改成**电脑的局域网 IP**（如 `http://192.168.1.10:3000`），手机与电脑需同一 WiFi。

---

## 四、使用流程

1. **对话**：默认直接与 GLM-5 对话，支持多轮上下文。
2. **加知识库**：「知识库」页 → 上传 `.txt`/`.md` 文档 → 自动分块向量化入库。
3. **知识问答**：回到「对话」页，打开顶部「**知识库**」开关，提问即基于你的文档回答，并显示引用来源。

---

## 五、切换模型

模型名集中在 `server/.env`，**改一行重启即可**，无需改代码：

```bash
CHAT_MODEL=glm-5          # 可改为 glm-4.6 / glm-4-flash 等
EMBEDDING_MODEL=embedding-3  # 可改为 embedding-2（免费，1024维）
RAG_TOP_K=5               # 检索召回数
CHUNK_SIZE=500            # 分块大小（字符）
```

> 说明：`glm-4.6` 在部分第三方平台（如阿里云百炼）将于 2026-07-09 下架；
> 智谱官方平台（bigmodel.cn）持续提供。本方案默认 GLM-5 并可一键切换，长期可用。

---

## 六、常见问题

| 问题 | 原因 / 解决 |
|------|------|
| 对话返回 401 | `.env` 的对话 Key（`ZHIPU_API_KEY`）未填或填错 |
| 上传知识库 / RAG 问答返回 429 | 向量化 Key（`ZHIPU_EMBEDDING_API_KEY`）未配置或额度不足。Coding Plan Key 不能用于向量化，需另配普通 Key，或换免费模型 `EMBEDDING_MODEL=embedding-2` |
| 小程序连不上后端 | 未勾选「不校验合法域名」，或后端未启动 |
| 真机连不上 | 后端地址要用电脑局域网 IP，不能用 localhost |
| 上传报错 | 当前仅支持 `.txt`/`.md`，且 < 10MB |
| 想扩展 PDF/Word | 在 `server/src/utils/parser.js` 增加解析库（如 pdf-parse / mammoth） |
