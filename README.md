# MiniFlow

可视化工作流编辑器：拖拽节点、连线配置、一键运行整条链路，支持 JSON 导出/导入。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/924950698/MiniFlow&env=MOONSHOT_API_KEY,MOONSHOT_API_BASE&envDescription=Kimi%20API%20%E9%85%8D%E7%BD%AE&envLink=https://platform.moonshot.cn/console/api-keys&project-name=miniflow&demo-title=MiniFlow&demo-description=%E5%8F%AF%E8%A7%86%E5%8C%96%E5%B7%A5%E4%BD%9C%E6%B5%81%E7%BC%96%E8%BE%91%E5%99%A8)

## 功能

- **画布编辑**：开始 / LLM / HTTP / 条件分支 / 结束 五种节点
- **工作流运行**：顶部「运行」按链路顺序执行，展示各节点输入输出
- **保存恢复**：导出 JSON、导入 JSON、浏览器自动保存草稿

## 本地开发

```bash
npm install
cp .env.example .env   # 填入 MOONSHOT_API_KEY
npm run dev
```

在 [Moonshot 控制台](https://platform.moonshot.cn/console/api-keys) 获取 API Key，写入 `.env`：

```env
MOONSHOT_API_KEY=sk-...
MOONSHOT_API_BASE=https://api.moonshot.cn/v1
```

## 部署到 Vercel

### 方式一：GitHub 导入（推荐）

1. 将代码推送到 GitHub
2. 打开 [vercel.com/new](https://vercel.com/new)，导入仓库 `MiniFlow`
3. 框架会自动识别为 **Vite**，无需改构建命令
4. 在 **Settings → Environment Variables** 添加：
   - `MOONSHOT_API_KEY` — Kimi API Key（运行 LLM 节点必需）
   - `MOONSHOT_API_BASE` — 可选，默认 `https://api.moonshot.cn/v1`
5. 点击 **Deploy**，完成后获得 `https://xxx.vercel.app` 公网地址

### 方式二：Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link          # 首次关联项目
vercel env add MOONSHOT_API_KEY   # 添加环境变量
npm run deploy       # 等价于 vercel --prod
```

### 生产环境 API

Vercel 上使用 Serverless Functions 代理 Kimi 请求（密钥仅存服务端）：

| 路径 | 说明 |
|------|------|
| `POST /api/kimi/chat` | Kimi 对话代理 |
| `POST /api/notify` | HTTP 节点 Mock 通知接口 |

本地开发仍通过 Vite 中间件提供相同路径，行为一致。

## 技术栈

- React + TypeScript + Vite
- [@xyflow/react](https://reactflow.dev) 流程画布
- Moonshot Kimi API

## License

MIT
