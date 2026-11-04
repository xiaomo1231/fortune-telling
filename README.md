# 墨星 · 塔罗与东方命理

面向中国大陆用户的 AI 占卜网站：塔罗、八字、每日运势、六爻、观音灵签。排盘和起卦由规则引擎完成，大模型只负责把结论说成自然的话。产品定位为传统文化与心理娱乐。

## 目录

```
apps/web            Next.js 16 网站（页面 + 接口 + Prisma/PostgreSQL）
packages/engine     规则引擎：八字（真太阳时、旺衰、格局、喜用、大运流年）、每日运势、六爻纳甲、观音灵签百签、塔罗 78 张与牌阵
packages/reading    解读层：三位解读师人设、结构轮换、去 AI 味检查与重写、安全过滤、无模型时的模板解读
packages/card-art   78 张塔罗牌面与牌背（程序生成 SVG）
demo                早期静态演示页
docs                设计文档
```

## 本地运行

需要 Node 22、pnpm 10、PostgreSQL 16。

```bash
pnpm install
cp apps/web/.env.example apps/web/.env    # 填 DATABASE_URL，开发时 INVITE_REQUIRED 可设为 false
pnpm db:migrate
pnpm dev                                  # http://localhost:3000
```

开发环境里短信验证码会直接显示在登录页上。不填 `AI_API_KEY` 时，解读使用规则模板生成，所有流程都能跑通。

测试：

```bash
pnpm test        # 引擎 21 项 + 解读层 11 项
pnpm typecheck
```

## 部署

单机最简单的方式是 Docker Compose：

```bash
cp apps/web/.env.example apps/web/.env    # 按下面的清单填写
DB_PASSWORD=换成强密码 docker compose up -d --build
```

容器启动时会自动执行数据库迁移，网站监听 3000 端口，前面接 Nginx 配 HTTPS 即可。不用 Docker 时：`pnpm build`，然后运行 `node apps/web/.next/standalone/apps/web/server.js`（需先把 `.next/static` 复制到 standalone 目录下的同名位置）。

### 上线前清单

| 项目 | 环境变量 / 操作 |
| --- | --- |
| 数据库 | `DATABASE_URL` |
| 大模型 | `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL_FAST`、`AI_MODEL_PRO`。任何 OpenAI 兼容接口都可以，默认 DeepSeek；需选用已完成生成式 AI 备案的模型 |
| 短信 | `SMS_PROVIDER=aliyun` 以及 `ALIYUN_*` 四项；确认 `SMS_DEV_ECHO=false` |
| 内测 | `INVITE_REQUIRED=true` 时新用户需要邀请码 |
| 管理令牌 | `ADMIN_TOKEN` 设为随机长字符串 |
| 备案与主体 | `NEXT_PUBLIC_ICP`（页脚备案号）、`NEXT_PUBLIC_COMPANY`、`NEXT_PUBLIC_CONTACT`（协议与隐私政策里显示） |

### 生成邀请码和兑换码

目前没有接入在线支付，付费权益通过兑换码发放（可在微信、小红书等渠道售卖后发码）。

```bash
curl -X POST https://你的域名/api/admin/codes \
  -H "x-admin-token: $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"product":"member-month","count":10,"note":"首批内测"}'
```

`product` 可选：`invite`（邀请码）、`tarot-deep`、`soulmate`、`liuyao`、`bazi-full`、`member-month`、`member-year`。`quantity` 是每个码给几次，`maxUses` 是一个码能被几个人用（邀请码可以设大一些），`expiresInDays` 是有效期。

## 计费规则

| 功能 | 免费 | 单次 | 会员 |
| --- | --- | --- | --- |
| 每日一牌 | 每天 1 次 | | 包含 |
| 是与否 | 每天 3 次 | | 包含 |
| 三张牌 | 每天 1 次 | 之后按深度牌阵计 | 包含 |
| 深度牌阵（感情十字、二选一、凯尔特十字） | | ¥6.6 | 包含 |
| 正缘画像完整解读 | 前 3 张免费 | ¥19.9 | 包含 |
| 六爻问事 | | ¥9.9 | 包含 |
| 观音灵签 | 每天 3 次 | | 包含 |
| 八字简批、每日运势 | 不限 | | |
| 八字完整命书 | | ¥29.9（同一命盘永久保存） | 每月送 1 份 |

会员：月卡 ¥25、年卡 ¥168，每类功能每天 20 次的合理使用上限。新注册用户赠送 1 次深度牌阵和 1 次六爻。未满 18 岁不能兑换付费权益。规则集中在 `apps/web/src/lib/quota.ts`。

## 安全与合规

- 输入里出现自伤、轻生等信号时，停止占卜并显示心理援助热线（12356、400-161-9995）。
- 彩票博彩、寿命死亡、伤害他人、违法问题直接婉拒。
- 输出过滤绝对化断言和“开光、化解、转运”类话术。
- 用户可删除单条记录、档案，或注销账号（删除全部数据）。
- 页脚和每次解读后都标注“AI 生成，仅供娱乐参考”。

## 数据来源

历法使用 [lunar-javascript](https://github.com/6tail/lunar-javascript)（MIT）。观音灵签原文来自 [guanyin-lingqian](https://github.com/yumi966/guanyin-lingqian)（MIT），见 `packages/engine/src/lingqian/NOTICE.md`。
