---
title: 本地 LLM 应用搭建
date: '2023-06-28T11:47:48+00:00'
published: false
feature: ''
---

## 前言

这篇是本地 LLM 应用搭建的老笔记，主要记录当时用 Transformers、Gradio、FastAPI 这套链路把模型跑起来的过程。现在生态变化很快，具体模型和命令不一定是最新方案，但整体思路还能作为参考。

本地部署的好处很直接：数据不出本机，网络延迟少，可控性更强。代价也很直接：吃硬件，吃显存，踩坑也更多。

## 环境准备

### 硬件要求

- **CPU**：建议使用多核处理器，Intel i7 或 AMD Ryzen 7 以上
- **内存**：至少 16GB RAM，推荐 32GB 或更多
- **存储**：至少 100GB 可用空间，SSD 优先
- **GPU**：可选，NVIDIA RTX 系列显卡能让推理速度好很多

### 软件环境

#### Python 环境

```bash
# 安装 Python 3.8+
python --version

# 创建虚拟环境
python -m venv llm-env
source llm-env/bin/activate  # Linux/macOS
# llm-env\Scripts\activate  # Windows
```

#### 必要依赖

```bash
pip install torch torchvision torchaudio
pip install transformers accelerate
pip install gradio streamlit
pip install huggingface-hub
```

## 模型选择与下载

### 常用开源 LLM 模型

1. **LLaMA 系列**
   - Meta 开源的高质量模型
   - 支持多种规模：7B、13B、30B、65B

2. **ChatGLM 系列**
   - 清华大学开源的中英双语模型
   - ChatGLM-6B 适合个人电脑部署

3. **Vicuna 系列**
   - 基于 LLaMA 微调的对话模型
   - 性能接近 ChatGPT

### 模型下载

#### 使用 Hugging Face Hub

```bash
# 安装 git-lfs
git lfs install

# 下载 ChatGLM-6B 模型
git clone https://huggingface.co/THUDM/chatglm-6b

# 或使用 Python 代码下载
from transformers import AutoTokenizer, AutoModel

tokenizer = AutoTokenizer.from_pretrained("THUDM/chatglm-6b", trust_remote_code=True)
model = AutoModel.from_pretrained("THUDM/chatglm-6b", trust_remote_code=True).half().cuda()
```

## 本地部署方案

### 方案一：使用 Transformers 库

创建 `app.py` 文件：

```python
from transformers import AutoTokenizer, AutoModel
import gradio as gr

# 加载模型
tokenizer = AutoTokenizer.from_pretrained("THUDM/chatglm-6b", trust_remote_code=True)
model = AutoModel.from_pretrained("THUDM/chatglm-6b", trust_remote_code=True).half().cuda()
model = model.eval()

def chat(message, history):
    response, history = model.chat(tokenizer, message, history=history)
    return response, history

# 创建 Gradio 界面
with gr.Blocks() as demo:
    chatbot = gr.Chatbot()
    msg = gr.Textbox()
    clear = gr.Button("Clear")
    
    def respond(message, chat_history):
        response, _ = chat(message, [])
        chat_history.append((message, response))
        return "", chat_history
    
    msg.submit(respond, [msg, chatbot], [msg, chatbot])
    clear.click(lambda: None, None, chatbot, queue=False)

demo.launch(share=True)
```

### 方案二：使用 FastAPI

创建 `server.py` 文件：

```python
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModel
import uvicorn

app = FastAPI()

# 加载模型
tokenizer = AutoTokenizer.from_pretrained("THUDM/chatglm-6b", trust_remote_code=True)
model = AutoModel.from_pretrained("THUDM/chatglm-6b", trust_remote_code=True).half().cuda()

class ChatRequest(BaseModel):
    message: str
    history: list = []

@app.post("/chat")
async def chat(request: ChatRequest):
    response, history = model.chat(tokenizer, request.message, history=request.history)
    return {"response": response, "history": history}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 方案三：使用 Docker

创建 `Dockerfile`：

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "server.py"]
```

创建 `docker-compose.yml`：

```yaml
version: '3.8'
services:
  llm-service:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./models:/app/models
    environment:
      - CUDA_VISIBLE_DEVICES=0
```

## 性能优化

### 模型量化

```python
# 使用 8bit 量化减少内存使用
from transformers import BitsAndBytesConfig

quantization_config = BitsAndBytesConfig(
    load_in_8bit=True,
    llm_int8_threshold=6.0,
    llm_int8_has_fp16_weight=False,
)

model = AutoModel.from_pretrained(
    "THUDM/chatglm-6b",
    trust_remote_code=True,
    quantization_config=quantization_config,
    device_map="auto"
)
```

### 批处理推理

```python
def batch_chat(messages, batch_size=4):
    responses = []
    for i in range(0, len(messages), batch_size):
        batch = messages[i:i+batch_size]
        batch_responses = []
        for message in batch:
            response, _ = model.chat(tokenizer, message, history=[])
            batch_responses.append(response)
        responses.extend(batch_responses)
    return responses
```

## 部署与监控

### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 日志监控

```python
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url} - {response.status_code} - {process_time:.3f}s")
    return response
```

## 常见问题与解决方案

### 内存不足

1. 使用模型量化技术
2. 减少批处理大小
3. 使用更小的模型 variant

### GPU 显存不足

```python
# 启用梯度检查点
model.gradient_checkpointing_enable()

# 使用 CPU offload
from accelerate import dispatch_model, infer_auto_device_map

device_map = infer_auto_device_map(model, max_memory={0: "10GiB", "cpu": "30GiB"})
model = dispatch_model(model, device_map=device_map)
```

### 推理速度慢

1. 使用 GPU 加速
2. 启用模型并行
3. 优化批处理策略

## 总结

本地 LLM 应用搭建要同时考虑硬件资源、模型选择和部署方案。能跑起来只是第一步，后面还要继续处理显存、推理速度、接口稳定性这些问题。

这类东西变化很快，后面如果重写，应该优先看当时主流的本地推理框架和模型格式，不要只盯着这篇旧笔记。

## 参考资源

- [Hugging Face Transformers 文档](https://huggingface.co/docs/transformers/)
- [ChatGLM-6B 项目地址](https://github.com/THUDM/ChatGLM-6B)
- [LLaMA 官方论文](https://arxiv.org/abs/2302.13971)
- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
