#!/bin/bash
# 生产环境一键部署脚本（Linux 服务器）
# 在服务器上执行：bash deploy.sh

set -e

echo "========================================"
echo "  智谱智能体后端 - 部署脚本"
echo "========================================"

# 进入脚本所在目录
cd "$(dirname "$0")"
APP_DIR="$(pwd)"
echo "部署目录: $APP_DIR"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未安装 Node.js，请先安装 Node.js 16+"
    exit 1
fi
echo "✓ Node.js 版本: $(node -v)"

# 安装依赖
if [ ! -d node_modules ]; then
    echo "→ 安装依赖..."
    npm install --production
    echo "✓ 依赖安装完成"
else
    echo "✓ 依赖已存在，跳过"
fi

# 安装 PM2（进程管理，让后端常驻）
if ! command -v pm2 &> /dev/null; then
    echo "→ 安装 PM2..."
    npm install -g pm2
    echo "✓ PM2 安装完成"
fi

# 配置文件检查
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo ""
        echo "⚠️  已从模板创建 .env，请编辑填入 API Key："
        echo "   nano .env   (或 vi .env)"
        echo "   填好 ZHIPU_API_KEY 和 ZHIPU_EMBEDDING_API_KEY 后，重新运行 bash deploy.sh"
        exit 0
    fi
fi

echo "✓ .env 配置文件已存在"

# 用 PM2 启动/重启后端
echo "→ 启动后端（PM2 托管）..."
pm2 delete wechat-agent 2>/dev/null || true
pm2 start src/index.js --name wechat-agent
pm2 save

# 设置开机自启
pm2 startup 2>/dev/null || true

echo ""
echo "========================================"
echo "🎉 部署完成！"
echo "========================================"
echo "服务地址: http://0.0.0.0:3000"
echo ""
echo "常用命令:"
echo "  pm2 status            查看运行状态"
echo "  pm2 logs wechat-agent 查看日志"
echo "  pm2 restart wechat-agent 重启"
echo "  pm2 stop wechat-agent  停止"
echo ""
echo "下一步:"
echo "  1. 在云服务器控制台开放 3000 端口（安全组）"
echo "  2. 用浏览器访问 http://服务器IP:3000/api/health 验证"
echo "========================================"
