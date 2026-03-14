---
title: Hack Claude Code 使用 Kimi K2 模型
date: '2025-07-12T13:39:00+00:00'
published: true
feature: ''
---
昨天晚上（20250711）刷到开源的 Kimi K2 模型（非推理模型）。

[官方号称：上下文 128K，总参数 1T，成本超低。](https://github.com/MoonshotAI/Kimi-K2)

意外地是看到支持 Anthropic 协议，印象里面还没有其他官方模型主动支持的（大家都是 OpenAI compatible），这不是一下就来了兴致。研究了一下怎么在 Claude Code 中用 Kimi K2。

直接说结论，在已安装过 ClaudeCode 的情况下，不用安装任何新的玩意就能用上，具体步骤如下：

*   [Kimi 官网生成 API key](https://platform.moonshot.cn/console/api-keys)
    
*   打开命令行导出两个环境变量即可（ANTHROPIC\_BASE\_URL 和 ANTHROPIC\_AUTH\_TOKEN），见 P1。
    

![](https://static.gridea.dev/98cd32d9-2e67-4904-bba1-f2457817463a/CMPTU0VEC.png)

```markup
export ANTHROPIC_AUTH_TOKEN=sk-qViCuNrhyQaDPrELy3aM3UVZXcQmIz5Oh4iNRtm8XXXXXXXX
export ANTHROPIC_BASE_URL=https://api.moonshot.cn/anthropic
claude

```

## 在 CC 中使用外部模型的方法

常规在 ClaudeCode 中使用外部模型有两种方法：Proxy 代理，LLM 网关。

### Proxy 代理

测了 claude-code-router（claude-bridge、anthropic-proxy 未测）。结果发现 Proxy 在上下文维持上有问题，初始化就会触发 TPM（每分钟 Token 处理量）限制，基本不可用，见 P2。

![](https://static.gridea.dev/98cd32d9-2e67-4904-bba1-f2457817463a/Jnc4vzfzR.png)

### LLM 网关（推荐）

[LLM Gateway 是 Claude Code 官方支持的企业级方案。](https://docs.anthropic.com/en/docs/claude-code/llm-gateway)

这个口子本来是开给企业级 Claude 模型用的，但是 Kimi K2 主动兼容支持了下，对 ClaueCode 客户端来说，它认为在与 Anthropic 服务器通信，实际上请求被重定向到了 Kimi 服务器，返回的响应也符合 Anthropic API 的格式要求，这样一来就能在 ClaueCode 中用 Kimi K2 模型啦。

#### 绕过 Claude Code 认证

打开项目文件夹，终端启动 Claude Code

```hljs
cd /path/to/your_project
claude

```

如果是首次启动 Claude Code，会弹出登录认证网页。

只需要编辑 `$HOME/.claude.json` 添加新字段 `"hasCompletedOnboarding": true` 即可。

![](https://static.gridea.dev/98cd32d9-2e67-4904-bba1-f2457817463a/BoPZrYk8H.png)

至此就是全部配置完成啦。实际体验下来，用 ClaudeCode 过程中还有概率爆 TPM，[账号升级 T1 后 TPM 扩大到 128000 才基本可用](https://platform.moonshot.cn/docs/pricing/limits)（至少充 50 CNY），如果单次会话爆 TPM 可用 /clear 或开新会话。

![](https://static.gridea.dev/98cd32d9-2e67-4904-bba1-f2457817463a/KE99OYUCc.png)

#### VScode + Cline 使用 Kimi K2

另外，也尝试了下 VScode + Cline 使用 Kimi K2，UI 驱动逻辑打断太多，个人感觉没 ClaudeCode 丝滑。也可作为一个参考，见 P3。

![](https://static.gridea.dev/98cd32d9-2e67-4904-bba1-f2457817463a/9YSoSlhHx.png)

#### 初体验

最后用 CC + K2 实现了一个简单的小想法（P4，P5）。

![](https://static.gridea.dev/98cd32d9-2e67-4904-bba1-f2457817463a/XLhPa64r2.png)![](https://static.gridea.dev/98cd32d9-2e67-4904-bba1-f2457817463a/d067lLfr2.png)

## 总结

个人感觉 ClaudeCode + Kimi K2 是国内免魔法、免第三方号商情况下 Vibe Coding 的最优解。

总的来说，K2 模型还是挺不错的，开源且 API 便宜又大碗，直接作为 LLM 应用 API 也是个十分不错的选择。
