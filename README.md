# PPet

> 给你的桌面多一点趣味~
>
> 支持 Live2D v2 / v3

## ⚠️ 注意

> - 由 **DeepSeek** 重构自 [zenghongtu/PPet](https://github.com/zenghongtu/PPet)
> - 此为个人 fork，非通用仓库
> - 仅支持 **Arch Linux + Hyprland (Wayland)** 环境
> - 针对 **AMD GPU**（多卡）做了 ANGLE/opengles + SwiftShader 兼容优化

## 截图

<img src="assets/record1.gif" width="400">

## 功能

- Live2D v2/v3 本地模型
- 配置面板一键扫描模型目录
- 托盘菜单：置顶、忽略点击、切换模型、中英切换
- 拖动位置、调整大小

## 开发

```bash
# 安装依赖
pnpm install

# 开发运行
pnpm start

# 生产构建
pnpm run build

# 打包 AppImage
pnpm run dist
```

## 模型

克隆模型仓库后，在托盘 → 配置 → 输入目录路径 → 扫描目录即可导入：

```bash
git clone https://github.com/zenghongtu/live2d-model-assets.git ~/GitHub/live2d-model-assets
```

## 许可

MIT
