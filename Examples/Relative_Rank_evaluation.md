# Relative Rank Evaluation

---

## 中文

本页报告 **Relative Rank**（[在线网站](https://ai-review.neurodong.top/compete.html) 实际使用的排序方法）在竞争力排序上的效果。评估时模型**看不到**审稿分数和录用决定，也**不做**接受/拒稿预测。

### 实验是怎么做的

已有的公开审稿数据，通常用来给**单篇论文**打分或预测录用。Relative Rank 问的是另一件事：在**同一会议的一小撮稿件里，谁更有竞争力？**

我们把 [PeerRead](https://github.com/allenai/PeerRead) 的 **ICLR 2017** 划分改造成排序评测：

1. **金标强度**取官方审稿推荐分（1–10 分）的中位数，再结合正式录用结果。
2. 只保留两端、丢掉中间带，避免金标自己打架：
   - **H（强）：** 已录用且推荐分中位数 ≥ 7 → 130 篇
   - **L（弱）：** 已拒稿且推荐分中位数 ≤ 4 → 98 篇
   - 中间带 199 篇去掉（低分录用、高分拒稿、以及卡在中间的稿）
3. 随机种子 42，抽 **100 组**，每组 **2 篇 H + 2 篇 L**（每组 4 篇）。
4. 每篇稿都先**匿名化**（去掉作者、单位、致谢）。模型只看到匿名后的 PDF 文本。
5. 在线方案所用模型与网站 **Quick Try** 相同（`deepseek-chat`，温度 0）。

### 四个指标是什么意思

每组固定是 2 篇强稿 + 2 篇弱稿。排出一个名次后，用下面四个数字衡量排得好不好（都是越高越好）：

1. **两两正确率 (Pairwise accuracy)**  
   每组有 4 对「强稿 vs 弱稿」。这一项看：强稿排在弱稿前面的比例。随机乱排期望是 **50%**（一半对、一半错）。

2. **完全分离 (Complete separation)**  
   更严的一项：一组里两篇强稿是否都排在两篇弱稿之上（中间没有穿插）。4 篇乱排时，碰巧做到这一点的概率只有 **1/6 ≈ 16.7%**。

3. **NDCG**  
   不只看强/弱两档，还看审稿推荐分中位数：真人打分更高的稿，越应排在前面。完美排序为 1。四篇一组时，即使随机打乱，NDCG 也不会掉到 0（本评测的随机期望约为 **0.785**），所以这一项的差距看起来会比两两正确率小一些。

4. **Spearman**  
   预测名次与审稿推荐分中位数的秩相关：1 表示完全同序，0 表示没有关系，−1 表示完全反了。随机乱排的期望是 **0**。

### 100 组结果

| 方法 | 两两正确率 ↑ | 完全分离 ↑ | NDCG ↑ | Spearman ↑ |
|------|--------------|------------|--------|------------|
| 随机基线 | 50.0% | 16.7% | 0.785 | 0.000 |
| **在线方案（Relative Rank）** | **83.8%（335/400）** | **62%** | **0.909** | **0.601** |

**随机基线**不是另一个模型，而是：在同样这 100 组上，把 4 篇论文的次序均匀随机打乱后，四个指标的期望值。

在同一会议的一小撮论文里，Relative Rank 通常能把明显更强的稿排到明显更弱的稿前面，而且不用分数、不用录用结果。

---

## English

This page reports how well **Relative Rank** (the method used on the [website](https://ai-review.neurodong.top/compete.html)) can order papers by competitiveness. At ranking time the model does **not** see review scores or accept/reject labels, and it does **not** predict acceptance.

### How the experiment was done

Public review datasets are usually used to score or accept/reject **one paper at a time**. Relative Rank asks a different question: **in a small set of manuscripts from the same venue, which are more competitive?**

We turn [PeerRead](https://github.com/allenai/PeerRead)’s **ICLR 2017** split into a ranking benchmark:

1. **Gold strength** is the median of official reviewer recommendation scores (1–10 scale), combined with the official decision.
2. We keep only the two clear ends, so the gold does not fight itself:
   - **H (strong):** accepted and recommendation median ≥ 7 → 130 papers
   - **L (weak):** rejected and recommendation median ≤ 4 → 98 papers
   - The middle band (199 papers: low-scoring accepts, high-scoring rejects, and borderline cases) is dropped.
3. We sample **100 pools** (random seed 42), each with **2 H + 2 L** papers (4 papers per pool).
4. Every manuscript is **anonymized** (authors, affiliations, acknowledgements removed). The model sees only anonymized PDF text.
5. The online method uses the same **Quick Try** stack as the website (`deepseek-chat`, temperature 0).

### What the four metrics mean

Each pool is 2 strong + 2 weak papers. After a ranking is produced, four numbers say how good it is (higher is better):

1. **Pairwise accuracy**  
   Each pool has 4 strong-vs-weak pairs. This is the fraction of those pairs in which the strong paper is ranked above the weak one. A random order is expected to get **50%**.

2. **Complete separation**  
   A stricter check: both strong papers sit above both weak papers, with no interleaving. For a random permutation of 4 papers this happens only **1/6 ≈ 16.7%** of the time.

3. **NDCG**  
   Uses the reviewer recommendation median, not just the strong/weak bit: higher-scored papers should appear earlier. A perfect order scores 1. On a 4-paper list, even a random shuffle does not drive NDCG to 0 (about **0.785** here), so the gap looks smaller than on pairwise accuracy.

4. **Spearman**  
   Rank correlation between the predicted order and the recommendation medians: 1 is the same order, 0 is no relationship, −1 is reversed. A random order is expected to score **0**.

### Results on 100 pools

| Method | Pairwise ↑ | Complete sep. ↑ | NDCG ↑ | Spearman ↑ |
|--------|------------|-----------------|--------|------------|
| Random baseline | 50.0% | 16.7% | 0.785 | 0.000 |
| **Online method (Relative Rank)** | **83.8% (335/400)** | **62%** | **0.909** | **0.601** |

The **random baseline** is not another model. It is the expected value of the four metrics if the four papers in each of these 100 pools are put in a uniformly random order.

Given a handful of same-venue papers, Relative Rank usually puts the clearly stronger manuscripts above the clearly weaker ones, without using scores or decisions.
