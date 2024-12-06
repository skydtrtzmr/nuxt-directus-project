# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## 进度

终于完成了连接directus的基础配置。

### TODO

- [x] `review/[id]`页面，显示答案。
- [ ] 添加做题操作自动脚本。

## 关于UI

使用[primevue](https://primevue.org/)。

注意要把release下载下来放到项目里。参见[primevue-tailwindcss/nuxt/styles](https://tailwind.primevue.org/nuxt/#styles)。

## 关于nuxt-directus

有空好好看看这个项目的源码。
他这个如果你配置项开了auto-fetch，就会启动时自动尝试fetchUser，fetch不到就会报错。
有些自动的功能它里面已经写好了，我自己再写就重复了。

## 运行

### Setup

Make sure to install dependencies:

```bash
# pnpm
pnpm install
```

### Development Server

Start the development server on `http://localhost:3000`:

```bash
# pnpm
pnpm dev
```

### Production

Build the application for production:

```bash
# pnpm
pnpm build
```

Locally preview production build:

```bash
# pnpm
pnpm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
