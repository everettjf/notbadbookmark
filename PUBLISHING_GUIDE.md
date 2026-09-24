# Chrome扩展发布指南

## 概述
本指南将帮助你将NotbadBookmark扩展发布到Chrome Web Store。

## 准备工作

### 1. 开发者账户
- 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- 支付一次性注册费（$5.00 USD）
- 完成开发者账户验证

### 2. 扩展包准备
✅ 已完成：`NotbadBookmark-v1.0.0.zip` (292.9 KB)

## 发布步骤

### 第一步：登录开发者控制台
1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. 使用Google账户登录
3. 接受开发者协议

### 第二步：创建新项目
1. 点击"添加新项目"
2. 选择"Chrome扩展程序"
3. 上传 `NotbadBookmark-v1.0.0.zip` 文件

### 第三步：填写扩展信息

#### 基本信息
- **扩展名称**: NotbadBookmark
- **简短描述**: A better bookmark manager for Chrome with modern UI and enhanced features
- **详细描述**:
```
NotbadBookmark is a modern, feature-rich bookmark manager that replaces Chrome's default bookmark interface.

Features:
• Beautiful, intuitive user interface
• Drag and drop bookmark organization
• Advanced search and filtering
• Folder management and organization
• Export/import functionality
• Dark/light theme support
• Responsive design for all screen sizes

Transform your bookmark management experience with NotbadBookmark!
```

#### 分类信息
- **类别**: Productivity
- **语言**: English

#### 图片资源
- **图标**: 使用 `icons/icon128.png`
- **截图**: 需要添加至少1张截图（1280x800或640x400像素）
- **宣传图片**: 440x280像素（可选）

### 第四步：隐私政策
由于扩展需要访问书签数据，需要提供隐私政策：

```
Privacy Policy for NotbadBookmark

NotbadBookmark is a Chrome extension that helps you manage your bookmarks more effectively.

Data Collection:
- We do not collect, store, or transmit any personal data
- All bookmark data remains on your local device
- No analytics or tracking code is included

Permissions Used:
- bookmarks: To read and manage your bookmarks
- storage: To save your preferences locally
- activeTab: To access the current tab when needed

Contact: [Your contact information]
```

### 第五步：发布设置
- **发布类型**: Public
- **地区**: 选择目标市场
- **价格**: Free

### 第六步：提交审核
1. 检查所有必填字段
2. 点击"提交审核"
3. 等待Google审核（通常1-3个工作日）

## 审核要求

### 技术检查
- ✅ Manifest V3 兼容
- ✅ 权限使用合理
- ✅ 无恶意代码
- ✅ 性能符合要求

### 内容检查
- ✅ 描述准确
- ✅ 功能说明清晰
- ✅ 隐私政策完整
- ✅ 截图真实有效

## 常见问题

### Q: 审核被拒绝怎么办？
A: 查看拒绝原因，修改后重新提交

### Q: 如何更新扩展？
A: 修改版本号，重新打包，在开发者控制台更新

### Q: 扩展大小限制？
A: 单个文件最大10MB，总包最大10MB

## 发布后维护

### 监控
- 用户反馈
- 崩溃报告
- 使用统计

### 更新
- 定期修复bug
- 添加新功能
- 保持与Chrome版本兼容

## 联系信息
如有问题，请联系：[你的联系方式]

---
*最后更新: 2024年9月*
