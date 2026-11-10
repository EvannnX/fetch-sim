# Fetch 磁流体问答（仿真）

一个网页仿真：一块 21×12 的电磁铁矩阵，磁流体在重力下沉在底部，回答时由磁铁一格一格把流体搬上去拼成形状。可以打字、说话或者对着摄像头做手势，由 Claude 或豆包（Doubao）来决定怎么回应。

整个页面就是一个 `index.html`，不需要构建。

## 部署到 GitHub Pages

1. 在 GitHub 新建一个仓库（比如 `fetch-sim`），把本文件夹里的所有文件放到仓库根目录：`index.html`、`.nojekyll`、`README.md`、`proxy/`。
2. 仓库 **Settings → Pages**，Source 选 **Deploy from a branch**，分支选 `main`、目录选 `/ (root)`，保存。
3. 一两分钟后页面在 `https://<你的用户名>.github.io/fetch-sim/`。

摄像头和麦克风只在 https 下可用，GitHub Pages 默认就是 https。语音识别用的是浏览器自带的 Web Speech API，Chrome 支持最好。

## 选择模型

点输入框左边的齿轮：

- **Claude**：填 Anthropic API key。浏览器直接调用 API（Claude Opus 5.5，effort low）。
- **Doubao**：填火山方舟（Ark）的 API key，模型填模型 ID 或你的推理接入点 `ep-...`。默认是 `doubao-seed-1-6-flash-250615`，请换成你账号里开通的、支持图片输入的模型。

Key 只存在当前浏览器的 localStorage，不会写进代码或仓库。

## 回复的 schema

模型必须按这个 JSON 结构回复（页面里的 `REPLY_SCHEMA`）。调用豆包时会先用 `response_format: {type: "json_schema", strict: true}` 强制结构；如果模型不支持，会自动退到 `{type: "json_object"}`，再退到不加格式、由页面自己解析。

```json
{
  "steps": [
    {"kind": "icon", "icon": "smile", "text": "", "pattern": [], "effect": "pulse", "seconds": 4},
    {"kind": "text", "icon": "", "text": "2",  "pattern": [], "effect": "hold",  "seconds": 5}
  ]
}
```

- `kind`：`icon` / `text` / `pattern` / `effect_only`，说明这一步用哪个字段，其余字段留空（`""` 或 `[]`）。
- `icon`：heart, smile, sad, check, cross, up, down, left, right, star, sun, rain, music。
- `pattern`：10 个长度为 21 的字符串，`#` 表示有流体（抽象模式用）。
- `effect`：hold, pulse, shake, drip, collapse, slide-left, slide-right, wave。
- 每次 1–5 步。图片（摄像头最近 4 帧）以 `image_url` 的 base64 data URL 传给豆包。

## 浏览器直连被拦（CORS）怎么办

如果豆包接口不允许浏览器跨域直接调用，页面会提示 "could not reach the model directly"。这时用 `proxy/doubao-worker.js` 部署一个 Cloudflare Worker 做中转，key 放在服务端：

```bash
npx wrangler deploy proxy/doubao-worker.js --name fetch-doubao
npx wrangler secret put ARK_API_KEY
```

可以再设一个变量 `ALLOWED_ORIGIN=https://<你的用户名>.github.io`，只允许你的页面使用。然后在页面设置里把 Worker 地址填到 **Proxy URL**，key 留空。

公开部署时建议走中转：直接在浏览器里填 key 只适合自己用。

## 说明

- 磁铁控制逻辑仿照 Applied Procrastination 的 FerroFetchFirmware（GPL-3.0）的时序重新实现。
- 这个版本的磁铁用简单圆柱表示，没有包含 Fetch 的 CAD 模型（原 CAD 仓库没有写明许可）。
