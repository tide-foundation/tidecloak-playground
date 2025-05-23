# TideCloak developer playground 🚀

A secure, privacy-first identity and data management sandbox built with TideCloak. This repo demonstrates key functionality of TideCloak through interactive examples and self-hosted services — all runnable in one-click via **GitHub Codespaces**.

---

## 🚀 Quick Start (with GitHub Codespaces)

Launch a preconfigured development environment directly in your browser:

[![Open in Codespaces](https://github.com/codespaces/badge.svg)](https://codespace.new/tide-foundation/tidecloak-playground?quickstart=1)

**While you wait (7 mins or so), here's what happens automatically:**

- Installs required dependencies (`libssl-dev`)
- Auto-updates config files with your Codespace URLs
- Installs `npm` packages
- Starts the Tidecloak backend in Docker
- Launches the frontend dev server (Next.js)

Feel free to grab a coffee, star this project, or read about the latest breach headlines, that won't bother you when you're TideCloaked

You’ll see:

- `https://${CODESPACE_NAME}-3000.app.github.dev` → ✅ **Next.js App**
- `https://${CODESPACE_NAME}-8000.app.github.dev` → 🔐 **TideCloak IAM**

These are auto-forwarded and opened in your browser.

### **Have a play with the demo app** ▶️

**a) Tiny manual adjustment needed!**

> [!IMPORTANT]
> For this to work, you must make port 8080 public to allow your app to access Tidecloak.
> _(Currently GitHub restricts us from automating this step, so you'll have to do it manually)_

Go to the Ports tab in Codespaces, find port `Tidecloak Server (8080)`, and right-click → `Port visibility` → 'Public'


![how to make public](https://raw.githubusercontent.com/tide-foundation/tidecloakspaces/main/image/README/tidecloak_howto_makepublic.gif)

**b) Your Next.js app secured by Tidecloak is now ready for you to take for a spin**

The Preview opens automatically, otherwise check the **Ports tab** in Codespaces for the **Forwarded address** in the format of _https://${CODESPACE_NAME}-3000.app.github.dev_.

### **Accessing the TideCloak backend**

---

Then in the **Ports tab** click on the **Forwarded addess** in the format of _https://${CODESPACE_NAME}-8080.app.github.dev_. The default administrator credentials are `admin` / `password`.

> [!WARNING]
> When you click `Login` for the first time, you'll see the below Github warning. Just press `Continue` to move on.

<img src="https://raw.githubusercontent.com/tide-foundation/tidecloakspaces/main/image/README/1743562446996.png" alt="Codespaces warning" style="border: 2px solid #ccc; border-radius: 6px;" />

## 🔧 Development Environment

This project uses a custom [dev container](.devcontainer/devcontainer.json) which includes:

- Node.js 18 (via [official container](https://mcr.microsoft.com/devcontainers/javascript-node))
- Docker-in-Docker support
- ESLint, Prettier, GitLens, Docker extensions
- Auto-forwarding of ports 3000 and 8080
- A post-creation script: [`setup.sh`](.devcontainer/setup.sh)

### Codespace Setup Overview

On first boot, your Codespace runs this command:

```bash

chmod +x .devcontainer/setup.sh
./.devcontainer/setup.sh
npm install
npm run dev
```

## 🗂 Project Structure

```bash
.
├── .devcontainer/        # Codespaces config and setup script
├── app/                  # Application routes and API handlers
├── lib/                  # Helper libraries and utilities
├── public/               # Static assets (e.g. images, fonts)
├── tide-modules/         # Custom TideCloak modules
├── .gitignore
├── README.md
├── middleware.js         # Edge/middleware logic
├── next.config.js        # Next.js configuration
├── package.json          # NPM dependencies and scripts
├── postcss.config.js     # PostCSS configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── test-realm.json       # TideCloak realm configuration
├── tidecloak.json        # General TideCloak config

```

## 🤝 Contributing

We welcome contributions! To get started:

1. Fork the repo
2. Open in a Codespace
3. Make your changes
4. Submit a pull request

Please follow conventional commit standards and include relevant documentation if needed.

---

## 📄 License

This project is licensed under the [MIT License]().

---

## 📚 Resources

* [Tide Foundation](https://tide.org/)
* [TideCloak Documentation]()
* [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)
