# RSI Assist for Firefox

> A thoughtful browser extension designed to protect your physical well-being by reducing keystrokes and mitigating the risk of Repetitive Strain Injuries (RSI).

---

## Understanding Repetitive Strain Injury (RSI)

Repetitive Strain Injury (RSI) refers to a spectrum of painful conditions affecting muscles, tendons, nerves, and joints—most commonly in the hands, wrists, arms, and neck. These injuries are caused by repetitive movements, forceful exertions, and sustained awkward postures. 

In today's digital workplace, where knowledge workers, data entry professionals, customer support agents, and developers spend hours every day typing, RSI has become one of the most prevalent occupational health hazards. The cumulative micro-trauma from millions of repetitive keystrokes can lead to chronic pain, reduced productivity, and long-term debilitation if left unaddressed.

---

## Purpose of RSI Assist

**RSI Assist** is built with a simple, health-centric mission: to minimize unnecessary typing and repetitive data entry. By allowing users to preconfigure a list of frequently used text snippets associated with specific websites, the extension saves countless keystrokes throughout the workday, helping you maintain ergonomic comfort and reduce physical strain.

---

## Key Features

1. **Contextual Text Preloading:** Configure custom text strings tailored to the exact hostname of the website you are visiting.
2. **Context Menu Integration:** Right-click anywhere on a webpage to instantly access your saved snippets and insert them directly into the currently focused input element.
3. **Intuitive Configuration Dialog:** Click the extension toolbar icon to open a clean management interface where you can easily add, edit, save, or delete your text snippets for the current site.
4. **Privacy-First Design:** All configurations are stored locally, respecting your privacy and requiring zero external data collection.

---

## How It Works

1. **Configure Snippets per Domain:** Navigate to any website, click the **RSI Assist** extension icon, and enter your frequent text snippets into the input fields provided. Save your list.
2. **Insert with Ease:** When filling out forms or typing repetitive responses on that website, right-click to open the context menu, select **RSI Assist**, and choose the desired text snippet to insert it instantly into the focused element.

---

## Localization

While the codebase, technical documentation, and symbols are entirely in English, the extension user interface is presented in **French** to serve French-speaking users seamlessly.

---

## Development & Building

This extension uses a single unified **Manifest V3** `manifest.json` file compatible with both **Mozilla Firefox** and **Google Chrome**.

### Prerequisites
- Node.js & npm

### Development / Running locally

- **Run in Firefox:**
  ```bash
  npm start
  # or
  npm run start:firefox
  ```

- **Run in Chrome (Chromium):**
  ```bash
  npm run start:chrome
  ```

### Building for Production

- **Build Extension Package:**
  ```bash
  npm run build
  ```
  Generates zip packages ready for distribution.

---

## License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.
