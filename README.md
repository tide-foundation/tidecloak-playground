![play_github_heading](https://github.com/user-attachments/assets/14e76359-799e-4fc6-8c53-d00c8c174e87)

# TideCloak developer capability playground

Open this Codespace to see what building **without breach anxiety** feels like. TideCloak is an Identity & Access Management system that locks your platform's data, identities and access rights with keys no-one will ever hold - Not admins, vendors, users, or even us.

TideCloak layers its decentralized Cybersecurity Fabric on top of [Keycloak](https://www.keycloak.org/) (Red Hat's battle-tested open-source IAM), so you keep the standard OpenID/OAuth toolkit while gaining verifiable immunity to credential theft, mis-configuration, insider abuse, and attacks we don't even see coming yet.

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

### ▶️ **Have a play**

The initialization screen opens automatically. Once initialization is complete your experience will begin.

| Initialization: Set's up your experience             |  Invite: You're ready to go |
:-------------------------:|:-------------------------:
|![play_github_heading](https://github.com/RaymondThach/tidecloak-playground/blob/main/public/init.gif?raw=true)  |  ![play_github_heading](https://github.com/user-attachments/assets/fe25f509-297e-4384-91dd-94f017de34bf)|

If the page doesn't open check the **Ports tab** in Codespaces for the **Forwarded address**:

- `https://${CODESPACE_NAME}-3000.app.github.dev` → ✅ **Playground App**
- `https://${CODESPACE_NAME}-8000.app.github.dev` → 🔐 **TideCloak IAM**

### **Accessing the TideCloak backend**

---

In the **Ports tab** click on the **Forwarded addess** in the format of `https://${CODESPACE_NAME}-8000.app.github.dev`. The default administrator credentials are `admin` / `password`.

> [!NOTE]
> For the first visit, you'll see a Github warning like [this](https://raw.githubusercontent.com/tide-foundation/tidecloakspaces/main/image/README/1743562446996.png). Just press `Continue` to move on.

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
