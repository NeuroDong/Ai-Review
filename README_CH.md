[![Website](https://img.shields.io/badge/Website-Open-blue?logo=google-chrome)](https://ai-review.neurodong.top)&nbsp;&nbsp;&nbsp;&nbsp;[![Skills](https://img.shields.io/badge/Skills-Enabled-brightgreen)](ai-review-skills/SKILL.md)&nbsp;&nbsp;&nbsp;&nbsp;[![Prompt Engineering](https://img.shields.io/badge/Prompt%20Engineering-Enabled-brightgreen)](https://github.com/dair-ai/Prompt-Engineering-Guide)&nbsp;&nbsp;&nbsp;&nbsp;[![LLM](https://img.shields.io/badge/LLM-Enabled-brightgreen)](https://github.com/simonw/llm)&nbsp;&nbsp;&nbsp;&nbsp;[![VLM](https://img.shields.io/badge/VLM-Enabled-brightgreen)](https://github.com/facebookresearch/nougat)&nbsp;&nbsp;&nbsp;&nbsp;[![Gradio](https://img.shields.io/badge/Gradio-Enabled-brightgreen?logo=gradio)](https://gradio.app)&nbsp;&nbsp;&nbsp;&nbsp;[![FastAPI](https://img.shields.io/badge/FastAPI-Enabled-brightgreen?logo=fastapi)](https://fastapi.tiangolo.com/)&nbsp;&nbsp;&nbsp;&nbsp;[![Cloudflare](https://img.shields.io/badge/Cloudflare-Deployed-orange?logo=cloudflare)](https://www.cloudflare.com)&nbsp;&nbsp;&nbsp;&nbsp;

<img src="https://github.com/NeuroDong/Ai-Review/blob/main/Logo.png" width="100%">

[English](README.md)

# 关于 Ai-Review

本仓库致力于使用AI优化论文，方便研究者检查稿件的优点、缺点与改进建议。

快速使用（网页版）: 请访问 [在线网站](https://ai-review.neurodong.top)。下图是使用预览：

<p align="center">
	<img src="Show.gif" alt="Usage Preview" width="800" />
</p>

# 使用教程

## 一、在线网站使用教程

Ai-Review 提供网页端审稿，无需本地环境，打开浏览器即可使用。

### 1. 基础审稿（LLM）

- **入口**：[https://ai-review.neurodong.top](https://ai-review.neurodong.top)
- **步骤**：上传PDF稿件，选择提示词模式（如 SoT, Few-Shot 等），点击审稿即可获得结构化的Strengths, Weaknesses, Suggestions等意见。
- **说明**：可使用页面提供的快速体验，或自行配置 API（如 Deepseek）以获得更稳定的效果。

### 2. VLM 审稿

- **入口**：[https://ai-review.neurodong.top/vlm_review.html](https://ai-review.neurodong.top/vlm_review.html)
- **步骤**：上传 PDF，系统对页面进行快照后由VLM审稿，可感知排版与插图信息，适合需要看图、看公式排版的场景。

### 3. 提示词对比（Side by Side）

- **入口**：[https://ai-review.neurodong.top/side_by_side.html](https://ai-review.neurodong.top/side_by_side.html)
- **步骤**：同一篇稿件可用不同提示词并行生成多份审稿，便于对比并选择更符合需求的提示词。

## 二、Skills使用教程

在支持Agent Skill的平台（如 Cursor 等）中，可将Ai-Review作为Skill使用，在对话里直接对稿件进行审稿。

### 1. 获取与安装

- 本仓库已包含Skill定义，路径为：[ai-review-skills/SKILL.md](ai-review-skills/SKILL.md)
- 在 Cursor 中：可将上述ai-review-skills文件夹放入项目下的 `.cursor/skills/` 或用户目录的 `~/.cursor/skills/`，具体以各平台的 Skill 加载方式为准。

### 2. 支持的稿件格式

- **LaTeX**：`.tex`
- **PDF**：`.pdf`
- **Word**：`.docx` / `.doc`

### 3. 使用方式与触发

- 直接说: 使用 @ai-review-skills 审稿 @论文名 。
- 或在对话中说「审稿」「论文审稿」或 “review my paper” 等，并**提供稿件路径**（如 `paper/main.tex`, `article.pdf`），Agent 会调用 Ai-Review Skill 生成审稿意见。

# 持续更新

本仓库会长期持续更新。欢迎使用本仓库、提交 issue 或 pull request，以帮助改进提示词模板与网站功能，从而帮助社区伙伴们提升论文质量与被接受的概率。

# 审稿效果示例

请参见示例： [Deep Residual Learning for Image Recognition 的审稿示例](Examples/review_in_Resnet.pdf)。

# 提示词工程

- ***逆向提示词 (已包括)***: 通过以往大型模型生成的优秀结果反推提示词的内容。这里的优秀结果来自AAAI2026的AI审稿。
- ***小样本提示词 (已包括)***: 网页端在“Prompting mode”里选择“Prompt + Examples (Few-Shot)”，系统将从 `Prompts/` 读取相应模板，并把 `Examples/review_in_Resnet.md` 与 `Examples/review_in_Verified.md` 作为示例一并提供给大模型以提升效果。背景介绍见[小样本提示词](https://www.promptingguide.ai/zh/techniques/fewshot)。
- ***思考链提示词 (已包括)***: 让模型在回答问题前，显式地进行逐步推理，以提高复杂任务回答的准确性和逻辑性。具体见[这里](https://github.com/NeuroDong/Ai-Review/tree/main/Prompts).
- ***动态交互提示词（准备加入）***: 让模型先提计划，与用户交互，确定计划后再执行审稿。

# 审稿方式

- ***使用VLM模型进行审稿(已包括)***：对PDF文件进行快照，然后使用VLM模型对PDF的快照进行审稿，这样可以让模型感知图片和排版信息。点击[这里](https://ai-review.neurodong.top/vlm_review.html)可体验VLM的审稿效果。
- ***Ai-Review Skills (已包括)***: 可以使用ai-review-skills在智能体平台对论文进行审稿，直接使用智能体平台自带的大模型审稿就行。支持Latex, Word等格式的论文，可以论文内容进行精准感知。具体见[ai-review-skills/SKILL.md](ai-review-skills/SKILL.md)。
- ***科研图像质量评估功能（准备加入）***：计划使用VLM对PDF中的图像质量进行评估并给出改进建议，帮助用户更好地优化图片。

# 提示词评估

- ***提示词对比模式(Side by Side, 已包含)***: 加入提示词对比功能，帮助统计大众喜好的提示词，从而为用户推荐，具体见 [这里](https://ai-review.neurodong.top/side_by_side.html).

# 查看提示词

见 [这里](Prompts/). 欢迎每个人在issues中提出自己的见解，并帮我们优化它，以便更好地为社区服务。

# 更新与新闻

- **[26/02/2026]** 增加了Ai-Review的Skills, 用于对 LaTeX, PDF, Word 稿件生成结构化审稿意见。可在Cursor等支持 Agent Skill的平台上使用，当用户说「审稿」「论文审稿」时可触发。详细见[这里](ai-review-skills/SKILL.md)
- **[05/02/2026]** 增加了VLM模型审稿的功能，点击[这里](https://ai-review.neurodong.top/vlm_review.html)可体验VLM的审稿效果。
- **[31/01/2026]** Ai-Review 在线网站已添加了 SoT 提示，并修复了"Side by Side"模式下评论内容与文章内容无关的bug（由于PDF文件未成功加载）。
- **[29/12/2025]** 在本仓库新增了思维链提示词。具体见[这里](https://github.com/NeuroDong/Ai-Review/tree/main/Prompts).
- **[25/12/2025]** 给在线体验网站添加提示词对比模式(Side by Side), 用于帮助用户选择符合大众品味的提示词，具体见[这里](https://ai-review.neurodong.top/side_by_side.html).
- **[08/12/2025]** 将在线体验网站部署到了Cloudflare上，之前的Github Pages的版本(在仓库分支可以找到之前的代码)不再使用。
- **[16/11/2025]** 增加了使用 VLM 精确提取 PDF 内容的功能。
- **[21/10/2025]** 在网页上加入了Few-Shot Prompting功能，见[这里](https://neurodong.github.io/Ai-Review/)。
- **[18/10/2025]** 更新了审稿效果样例, 见[这里](Examples/)。这些样例是使用小样本提示词工程技术生成的。
- **[06/10/2025]** 网页版增加了快速体验功能(不需要用户设置API)，还允许了用户设置Deepseek的API。
- **[02/10/2025]** 更新了网页端的 AI 审稿功能。
- **[20/09/2025]** 在提示词中强化了数学符号与公式检查。
- **[14/09/2025]** 新增 “Deep Residual Learning for Image Recognition” 的审稿示例。
- **[14/09/2025]** 优化 Prompt，使 AI 能以二级列表形式生成更细致的 Strengths、Weaknesses 与 Suggestions。
