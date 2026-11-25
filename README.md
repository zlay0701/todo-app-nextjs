# Todo App with WebDAV Sync

一个基于 Next.js 的待办事项应用。任务数据保存在浏览器本地存储中，可配置为自动或手动同步到 WebDAV 服务器上的单个 `tasks.json` 文件。

## 功能

- 任务增删改查、完成状态切换
- 优先级（高 / 中 / 低）、分类、标签、截止日期
- 全文搜索：匹配标题、描述、分类和标签
- 多条件筛选：分类、标签、状态、优先级
- 排序规则：完成状态 → 优先级 → 截止日期 → 创建时间
- 首页统计：任务总数、待办数、已完成数
- 数据管理：JSON 导入导出、批量清除已完成任务
- WebDAV 配置、连接测试、手动同步、按间隔自动同步
- 同步时按 `updatedAt` 合并本地与远端冲突

## 技术栈

| 层次 | 技术 |
| --- | --- |
| 框架 | Next.js 14.2.5（App Router） |
| UI | React 18.3.1 |
| 语言 | TypeScript 5.5.3（strict） |
| 样式 | Tailwind CSS 3.4.4、PostCSS、Autoprefixer |
| 同步 | webdav 5.3.0 |
| 代码检查 | ESLint 8.57.0 + eslint-config-next |

## 快速开始

环境要求：Node.js 18.17 或更高版本。

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`。

其他命令：

```bash
npm run build        # 生产构建
npm run start        # 启动生产服务（需先 build）
npm run lint         # ESLint 检查
npx tsc --noEmit     # TypeScript 类型检查
```

## 项目结构

```text
todo-app/
├── package.json
├── package-lock.json
├── next.config.js
├── tsconfig.json               # 路径别名 @/* -> ./src/*
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.json
├── .gitignore
├── README.md
├── CHANGELOG.md
└── src/
    ├── app/
    │   ├── layout.tsx          # 根布局，挂载 TaskProvider
    │   ├── page.tsx            # 首页：统计、表单、列表、筛选
    │   ├── globals.css         # Tailwind 入口与基础样式
    │   └── settings/page.tsx   # 设置页：WebDAV 与数据管理
    ├── components/
    │   ├── TaskForm.tsx        # 新建任务表单
    │   ├── TaskList.tsx        # 搜索、筛选与排序
    │   ├── TaskItem.tsx        # 单项展示、切换、编辑、删除
    │   ├── CategoryFilter.tsx  # 筛选侧栏
    │   ├── WebDavConfig.tsx    # WebDAV 配置与连接测试
    │   ├── SyncStatus.tsx      # 同步状态与"立即同步"
    │   └── DataManagement.tsx  # JSON 导入导出、清除已完成
    ├── contexts/
    │   └── TaskContext.tsx     # useReducer 全局状态、本地持久化、同步调度
    ├── types/index.ts          # Task、WebDavConfig、SyncStatus 等类型
    └── utils/
        ├── syncManager.ts      # 同步入口与冲突解决
        └── webDavClient.ts     # WebDAV 客户端封装
```

## 数据模型

任务类型定义在 `src/types/index.ts`，也是导出文件的格式：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 唯一标识，创建时用时间戳生成 |
| `title` | `string` | 标题，必填 |
| `description` | `string?` | 描述 |
| `completed` | `boolean` | 完成状态 |
| `priority` | `'low' \| 'medium' \| 'high'` | 优先级 |
| `category` | `string` | 分类 |
| `tags` | `string[]` | 标签 |
| `dueDate` | `string?` | 截止日期，ISO 日期格式 `YYYY-MM-DD` |
| `createdAt` | `string` | 创建时间，ISO 8601 |
| `updatedAt` | `string` | 更新时间，ISO 8601，用于同步冲突合并 |

导出的 JSON 是一个任务对象数组，导入时要求每个对象都符合上述结构（可选字段除外）。字段不全的文件会被拒绝，不会部分导入。示例：

```json
[
  {
    "id": "1732512000000",
    "title": "完成项目文档",
    "description": "补充 README 和变更记录",
    "completed": false,
    "priority": "high",
    "category": "Work",
    "tags": ["docs", "release"],
    "dueDate": "2026-11-30",
    "createdAt": "2026-11-25T02:00:00.000Z",
    "updatedAt": "2026-11-25T02:00:00.000Z"
  }
]
```

## WebDAV 同步说明

在设置页填写 Server URL、用户名、密码，并勾选自动同步后即可启用。未填写完整三项时不会启用同步。

- **存储格式**：整个任务数组序列化为 `tasks.json`，通过 `putFileContents` 写入服务器根目录，`overwrite: true` 全量覆盖。
- **同步流程**：拉取远端 → 用 `resolveConflicts()` 按 `updatedAt` 合并 → 写回本地 → 上传合并结果。手动点击"立即同步"和自动同步都走这条流程。
- **自动同步**：按 `syncInterval`（分钟，默认 5）定时执行，范围 1 到 60。计时器只随配置项变化重建，任务变更不会重置。
- **认证方式**：`webDavClient.ts` 中使用 `AuthType.Password`（Basic 认证）。Nextcloud 等要求 digest 认证的服务器可改为 `AuthType.Digest`。
- **密码存储**：密码只保存在当前浏览器会话（`sessionStorage`）中，关闭标签页后需要重新输入；服务器地址、用户名等仍保存在本地存储中。

## 数据管理

设置页提供三个操作：

- **Export tasks as JSON**：把当前任务导出为 `tasks-YYYY-MM-DD.json`。
- **Import tasks from JSON**：从 JSON 文件导入任务并覆盖当前数据。导入前会校验字段格式并要求确认。
- **Clear completed tasks**：批量删除已完成任务，删除前要求确认。

## 提交前检查

提交代码前建议依次执行以下命令，全部通过后再提交：

```bash
npm run lint
npx tsc --noEmit
npm run build
```

构建产物（`.next/`、`out/`）、依赖（`node_modules/`）、本地工具数据（`.workbuddy/`）和 TypeScript 缓存已写入 `.gitignore`，不会被提交。如果需要给他人运行，保留 `package-lock.json` 以确保依赖版本一致。

## 已知限制

1. **构建依赖网络**：`layout.tsx` 使用 `next/font/google` 加载 Inter，离线环境构建会失败。
2. **不支持多用户**：同一 WebDAV 地址由多个客户端同时写入时，后写入者会覆盖先写入者的改动；合并只基于各客户端本地记录的时间戳。
3. **单文件远端存储**：所有任务集中在一个 `tasks.json` 中，任务量大时同步开销线性增长。

变更记录见 [CHANGELOG.md](./CHANGELOG.md)。
