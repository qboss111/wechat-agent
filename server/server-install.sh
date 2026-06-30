#!/bin/bash
# 服务器端部署脚本：clone 后执行，自动配置 + 启动
# 用法: bash server-install.sh
set -e
cd "$(dirname "$0")"

echo "========================================"
echo "  智谱智能体后端 - 服务器部署"
echo "========================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未安装 Node.js，请先安装: curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt install -y nodejs"
    exit 1
fi
echo "✓ Node.js $(node -v)"

# 写入 .env（自动填好你的 API Key）
if [ ! -f .env ]; then
    cat > .env << 'EOF'
ZHIPU_API_KEY=a87af287bb914c329f830b7b56a68815.kNFyjeDyMpydG31F
ZHIPU_EMBEDDING_API_KEY=ea8e76a847434bab8b2491a7a0c4908f.5BnTfzznPyh2KZC3
CHAT_MODEL=glm-4-flash
EMBEDDING_MODEL=embedding-3
CHAT_BASE_URL=https://open.bigmodel.cn/api/coding/paas/v4
EMBEDDING_BASE_URL=https://open.bigmodel.cn/api/paas/v4
CHUNK_SIZE=500
CHUNK_OVERLAP=80
RAG_TOP_K=5
PORT=3000
EOF
    echo "✓ 已生成 .env（含 API Key）"
fi

# 安装依赖
echo "→ 安装依赖..."
npm install --production 2>&1 | tail -3

# 安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo "→ 安装 PM2..."
    npm install -g pm2 2>&1 | tail -2
fi

# 启动
echo "→ 启动后端..."
pm2 delete wechat-agent 2>/dev/null || true
pm2 start src/index.js --name wechat-agent
pm2 save 2>/dev/null || true
pm2 startup systemd 2>/dev/null || true

echo ""
echo "========================================"
echo "🎉 部署完成！"
echo "========================================"
echo "测试: curl http://localhost:3000/api/health"
echo "公网: http://8.217.174.154:3000/api/health"
echo "后台: http://8.217.174.154:3000/admin"
echo "日志: pm2 logs wechat-agent"
echo ""
echo "⚠️  若公网访问不了：阿里云控制台开放 3000 端口(TCP, 源0.0.0.0/0)"
echo "========================================"
