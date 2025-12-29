[![Web demo](https://img.shields.io/badge/Web%20demo-Open-blue?logo=google-chrome)](https://ai-review.neurodong.top)&nbsp;&nbsp;&nbsp;&nbsp;[![Prompt Engineering](https://img.shields.io/badge/Prompt%20Engineering-Enabled-brightgreen)](https://github.com/dair-ai/Prompt-Engineering-Guide)&nbsp;&nbsp;&nbsp;&nbsp;[![LLM](https://img.shields.io/badge/LLM-Enabled-brightgreen)](https://github.com/simonw/llm)&nbsp;&nbsp;&nbsp;&nbsp;[![VLM](https://img.shields.io/badge/VLM-Enabled-brightgreen)](https://github.com/facebookresearch/nougat)&nbsp;&nbsp;&nbsp;&nbsp;[![Gradio](https://img.shields.io/badge/Gradio-Enabled-brightgreen?logo=gradio)](https://gradio.app)&nbsp;&nbsp;&nbsp;&nbsp;[![FastAPI](https://img.shields.io/badge/FastAPI-Enabled-brightgreen?logo=fastapi)](https://fastapi.tiangolo.com/)&nbsp;&nbsp;&nbsp;&nbsp;[![Cloudflare](https://img.shields.io/badge/Cloudflare-Deployed-orange?logo=cloudflare)](https://www.cloudflare.com)&nbsp;&nbsp;&nbsp;&nbsp;

<img src="https://github.com/NeuroDong/Ai-Review/blob/main/Logo.png" width="100%">

[English](README.md)
# 关于 Ai-Review

本仓库致力于使用AI优化论文，方便研究者检查稿件的优点、缺点与改进建议。

快速使用（网页版）: 请访问 [在线使用](https://ai-review.neurodong.top)。下图是使用预览：

<p align="center">
	<img src="Show.gif" alt="Usage Preview" width="800" />
</p>

# 持续更新
本仓库会长期持续更新。欢迎使用本仓库、提交 issue 或 pull request，以帮助改进提示词模板与网站功能，从而帮助社区伙伴们提升论文质量与被接受的概率。

# 审稿效果示例
请参见示例： [Deep Residual Learning for Image Recognition 的审稿示例](Examples/Review_in_Deep_Residual_Learning_for_Image_Recognition.pdf)。

# 提示词工程
- ***逆向提示词 (已包括)***: 通过以往大型模型生成的优秀结果反推提示词的内容。这里的优秀结果来自AAAI2026的AI审稿。
- ***小样本提示词 (已包括)***: 网页端在“Prompting mode”里选择“Prompt + Examples (Few-Shot)”，系统将从 `Prompts/` 读取相应模板，并把 `Examples/review_in_Resnet.md` 与 `Examples/review_in_Verified.md` 作为示例一并提供给大模型以提升效果。背景介绍见[小样本提示词](https://www.promptingguide.ai/zh/techniques/fewshot)。
- ***思考链提示词 (已包括)***: 让模型在回答问题前，显式地进行逐步推理，以提高复杂任务回答的准确性和逻辑性。具体见[这里](https://github.com/NeuroDong/Ai-Review/tree/main/Prompts).
- ***动态交互提示词（准备加入）***: 让模型先提计划，与用户交互，确定计划后再执行审稿。

# 辅助功能
- ***使用 VLM 精准提取 PDF 内容（已包含）***：PDF内容提取的准确性直接影响审稿效果，因此已集成了基于VLM的精准PDF内容提取功能。该功能已加入网页版 (在网页上点击“Accurately extract PDF content”)，用户可按需启用（可选）。注意该功能可能不稳定，如果提取失败，取消精准提取功能，原来的功能可以照常使用。
- ***科研图像质量评估功能（准备加入）***：计划使用 VLM 对 PDF 中的图像质量进行评估并给出改进建议，帮助用户更好地优化图片。

# 提示词评估
- ***提示词对比模式(Side by Side, 已包含)***: 加入提示词对比功能，帮助统计大众喜好的提示词，从而为用户推荐，具体见 [这里](https://ai-review.neurodong.top/side_by_side.html).

# 查看提示词
见 [这里](Prompts/). 欢迎每个人在这个提示词上提出自己的见解，并帮我们优化它，以便更好地为社区服务。

# 更新与新闻
- **[29/12/2025]** 在本仓库新增了思维链提示词。具体见[这里](https://github.com/NeuroDong/Ai-Review/tree/main/Prompts).
- **[25/12/2025]** 给在线体验网站添加提示词对比模式(Side by Side), 用于帮助用户选择符合大众品味的提示词，具体见: https://ai-review.neurodong.top/side_by_side.html.
- **[08/12/2025]** 将在线体验网站部署到了Cloudflare上，之前的Github Pages的版本(在仓库分支可以找到之前的代码)不再使用。
- **[16/11/2025]** 增加了使用 VLM 精确提取 PDF 内容的功能。
- **[21/10/2025]** 在网页上加入了Few-Shot Prompting功能，见[这里](https://neurodong.github.io/Ai-Review/)。
- **[18/10/2025]** 更新了审稿效果样例, 见[这里](Examples/)。这些样例是使用小样本提示词工程技术生成的。
- **[06/10/2025]** 网页版增加了快速体验功能(不需要用户设置API)，还允许了用户设置Deepseek的API。
- **[02/10/2025]** 更新了网页端的 AI 审稿功能。
- **[20/09/2025]** 在提示词中强化了数学符号与公式检查。
- **[14/09/2025]** 新增 “Deep Residual Learning for Image Recognition” 的审稿示例。
- **[14/09/2025]** 优化 Prompt，使 AI 能以二级列表形式生成更细致的 Strengths、Weaknesses 与 Suggestions。
