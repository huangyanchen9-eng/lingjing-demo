# 灵境织算 · 绿色版交互演示

基于现有绿色版 HTML / CSS / JavaScript 整理，保留原有 9 页布局、青绿色主题、字体、图标和动画。

## 启动

下载仓库并解压，在本目录双击 `启动演示.cmd`，然后打开 http://localhost:8000 。需已安装 Node.js。关闭命令窗口或按 Ctrl+C 停止服务。

也可在本目录运行：

```powershell
node server.cjs
```

端口占用时使用 `node server.cjs 8001` 并访问 http://localhost:8001 。服务器仅监听本机，不会发布到互联网。

所有图表、图标和字体已经放入 `vendor/`，日常演示不需要安装依赖，也不需要联网。请使用 HTTP 启动方式，以保证页面间会话状态正常。

## 演示流程

1. 首页点击“开始使用”。
2. 在上传页点击“使用示例数据”，或选择/拖入不超过 10MB 的 CSV、XLSX、XLS 文件。CSV 预览支持带引号的字段、逗号、换行和 UTF-8 BOM；Excel 仅展示文件信息。
3. 选择 AttnWGAIN / Transformer / RNN 和预设，可展开高级参数。
4. 点击“开始填补”，约 3 秒演示进度后进入结果页。
5. 结果页展示来源名称、模型、参数、100 条合成示例及 3 张图表。可分页、搜索所有记录、导出全部示例或下载 CSV 报告。
6. 数据集市场支持搜索、分类及高级筛选，条目详情与列表对应；可预览、下载 5 行示例或导入上传页。

## 演示边界

- **所有处理结果、指标和数据集都是演示数据。** 用户文件只在浏览器本地预览，不发送到服务器，不执行模型训练或实际填补。
- 选择的缺失率会控制示例中缺失点数量；模型、批次和轮数用于展示配置，不表示真实计算。模型对比表和缺失率性能曲线是预设示意。
- 登录、第三方登录与注册均为本地模拟。注册只保存演示用户名、邮箱，不保存输入密码；不构成真实账号或身份验证。
- 联系表单仅演示校验与完成状态，不发送消息。收藏、评论等为演示交互。
- 上传配置和结果元信息保存在当前标签页的 sessionStorage，重新打开结果页可查看；无记录时展示默认示例。搜索历史、演示资料等使用 localStorage。清除本站浏览器数据即可重置。

## 文件

- `index.html`、`upload.html`、`results.html`：首页和主要演示流程。
- `datasets.html`、`dataset-detail.html`：示例数据集市场和详情。
- `guide.html`、`contact.html`、`login.html`、`register.html`：辅助页面。
- `scripts/demo.js`：共享演示数据、CSV 预览解析与导出。
- `styles/demo.css`：响应式菜单、表格与原页面的小范围样式修复。
- `vendor/`：Chart.js 4.4.8、Font Awesome Free 6.0.0、Inter / Ma Shan Zheng / Long Cang 字体；许可证随资源保留。
- `server.cjs`：无运行时第三方依赖的本地静态服务器。

## 开发验证

首次安装测试依赖：`npm ci --ignore-scripts`，然后运行 `npm test`。测试使用 Node.js 和 jsdom，覆盖页面初始化、资源引用、上传预览、演示状态、结果分页/搜索/下载、数据集筛选、FAQ、注册和联系表单。

DOM 测试中的图表接口使用测试替身，不能替代真实浏览器的 Canvas 渲染和视觉验收。当前 Browser 插件初始化报错 `Importing module "node:process" is not allowed in node_repl`，所以桌面/手机截图验收尚未完成。样式已补充响应式规则，需在真实浏览器中最终确认。
