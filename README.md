![play_github_heading](https://github.com/user-attachments/assets/14e76359-799e-4fc6-8c53-d00c8c174e87)

# TideCloak developer capability playground

Open this Codespace to see what building **without breach anxiety** feels like. TideCloak is an Identity & Access Management system that locks your platforms data, identities and access rights with keys no-one will ever hold - Not admins, vendors, users, or even us.

TideCloak layers its decentralized Cybersecurity Fabric on top of [Keycloak](https://www.keycloak.org/) (Red Hat's battle-tested open-source IAM), so you keep the standard OpenID/OAuth toolkit while gaining verifiable immunity to credential theft, mis-configuration, and insider abuse.

The playground sandbox spins up in one click on GitHub Codespaces and guides you through the model with interactive demos.

---

## 🚀 Quick Start (with GitHub Codespaces)

Launch a preconfigured development environment directly in your browser:

[![Open in Codespaces](https://github.com/codespaces/badge.svg)](https://codespace.new/tide-foundation/tidecloak-playground?quickstart=1)

**While you wait (7 mins or so), here's what happens automatically:**

- Installs required dependencies (`libssl-dev`)
- Auto-updates config files with your Codespace URLs
- Installs `npm` packages
- Starts the TideCloak backend in Docker
- Launches the frontend dev server (Playground App)

Feel free to grab a coffee, star this project, or read about the latest breach headlines, that won't bother you when you're TideCloaked.

You’ll see:

- `https://${CODESPACE_NAME}-3000.app.github.dev` → ✅ **Playground App**
- `https://${CODESPACE_NAME}-8000.app.github.dev` → 🔐 **TideCloak IAM**

### **Have a play with the demo app** ▶️

The initialization screen opens automatically. Once initialization is complete your experience will begin. If the page doesn't open check the **Ports tab** in Codespaces for the **Forwarded address** (also shown above) in the format of _https://${CODESPACE_NAME}-3000.app.github.dev_.

### **Accessing the TideCloak backend**

---

Then in the **Ports tab** click on the **Forwarded addess** in the format of _https://${CODESPACE_NAME}-8080.app.github.dev_. The default administrator credentials are `admin` / `password`.

> [!WARNING]
> When you click `Login` for the first time, you'll see the below Github warning. Just press `Continue` to move on.

<img src="https://raw.githubusercontent.com/tide-foundation/tidecloakspaces/main/image/README/1743562446996.png" width="50%" alt="Codespaces warning" style="border: 2px solid #ccc; border-radius: 6px;" />

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
* [Reimagining Cybersecurity for Devs](https://tide.org/blog/rethinking-cybersecurity-for-developers)
* [TideCloak Documentation](https://docs.tidecloak.com)
* [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)
