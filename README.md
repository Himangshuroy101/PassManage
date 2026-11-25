# 🛡️ PassManage — Zero-Knowledge Offline Password Manager

<div align="center">

![PassManage Banner](https://img.shields.io/badge/PassManage-Emerald%20Mint-10B981?style=for-the-badge&logo=shield&logoColor=white)
![Expo](https://img.shields.io/badge/Expo_SDK_58-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native_0.88-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Encryption](https://img.shields.io/badge/AES--256--GCM-Hardware_KeyStore-0D533A?style=for-the-badge&logo=lock&logoColor=white)

**An ultra-secure, 100% offline, zero-knowledge mobile password manager built with React Native and Expo.**  
*Your passwords stay strictly on your device. Zero servers. Zero tracking. Complete privacy.*

</div>

---

## 🌟 Highlights & Key Features

- 🔐 **Military-Grade AES-256 Client-Side Encryption**
  - All vault records are encrypted locally before writing to disk using standard 256-bit AES algorithms.
  - Master keys and PIN digests are shielded in the native **Android Hardware KeyStore** via `expo-secure-store`.

- 📴 **100% Offline & Zero-Knowledge Architecture**
  - No remote servers, no cloud databases, and no external telemetry.
  - Data never leaves the device unless explicitly shared by the user.

- 👆 **Seamless Biometric & 4-Digit Master PIN Access**
  - Quick unlock via native Android **Fingerprint Sensor** or **Face Recognition** (`expo-local-authentication`).
  - Tactile 4-digit numeric keypad with Reanimated haptic feedback and error shakes.
  - Background auto-lock after 30 seconds of inactivity.

- 🛡️ **Smart Watchtower & Dynamic Health Score**
  - Real-time animated **Health Gauge (0–100%)** assessing entire vault hygiene.
  - Instant vulnerability detection:
    - 🚨 **Breached / Compromised Passwords**
    - ⚠️ **Weak Passwords** (< 8 chars, missing character variety)
    - 🔄 **Reused Passwords** across multiple accounts
  - One-tap filter chips to isolate vulnerable credentials immediately.

- ⚡ **Native Android Auto-Fill (`onFillRequest`) & Auto-Save (`onSaveRequest`)**
  - Fully integrated with the **Android Autofill Framework** (`AutofillService` API 26+).
  - **Auto-Fill Request**: Detects login inputs in any third-party app or mobile browser (Chrome, Netflix, Instagram, etc.) and presents matching credentials as inline keyboard chips or dropdown suggestions.
  - **Auto-Save Request**: Automatically prompts the user with the native Android dialog (*"Save password to PassManage?"*) when registering or logging in anywhere, securely storing new credentials into the local vault.
  - Fast offline matching against app package names and web domains.

- 💬 **WhatsApp Credential & Vault Sharing**
  - **Individual Share**: Export any credential directly to WhatsApp with pre-formatted Markdown and security confirmation.
  - **Vault Backup Digest**: Export a formatted digest of all stored accounts to your personal WhatsApp chat or trusted contact.
  - Automatic fallback to the native system share sheet if WhatsApp is not installed.

- 🎨 **Palette A: Emerald Mint & Crisp White Aesthetic**
  - Minimalist, high-end visual design inspired by modern fintech and security applications.
  - Smooth 60/120fps hardware-accelerated animations using `react-native-reanimated`.
  - Responsive bottom sheets (`@gorhom/bottom-sheet`) and tactile haptics (`expo-haptics`).

- 🧪 **Built-in Developer & QA Utilities**
  - **Load Sample Data**: One-tap demo loader injecting 6 realistic credentials for testing filters and Watchtower analytics.
  - **Simulate Fresh Install**: Developer tool in Settings to reset the app state and re-experience the splash and onboarding sequence.

---

## 📱 Screenshots & Architecture Overview

```
                        ┌─────────────────────────────────────┐
                        │          User Interaction           │
                        └──────────────────┬──────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
                    ▼                                             ▼
       ┌────────────────────────┐                    ┌────────────────────────┐
       │   4-Digit Master PIN   │                    │   Native Biometrics    │
       │  (Keypad & Haptics)    │                    │ (Fingerprint / Face ID)│
       └───────────┬────────────┘                    └────────────┬───────────┘
                   │                                              │
                   └──────────────────────┬───────────────────────┘
                                          │
                                          ▼
                       ┌─────────────────────────────────────┐
                       │     Android Hardware KeyStore       │
                       │        (expo-secure-store)          │
                       └──────────────────┬──────────────────┘
                                          │
                                          ▼
                       ┌─────────────────────────────────────┐
                       │       AES-256 Crypto Engine         │
                       │           (crypto-es)               │
                       └──────────────────┬──────────────────┘
                                          │
                                          ▼
                       ┌─────────────────────────────────────┐
                       │     Local Encrypted Storage         │
                       │    (AsyncStorage Persistent DB)     │
                       └─────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React Native (`0.88.1`)** | Mobile application framework |
| **Expo SDK (`58.0.25`)** | Native module toolchain & runtime |
| **TypeScript** | Static typing & interface reliability |
| **React Native Reanimated (`4.7.1`)** | High-performance UI thread animations |
| **Gorhom Bottom Sheet (`5.2.14`)** | Native gesture-driven modal sheets |
| **Expo Secure Store** | Hardware-backed key protection |
| **Expo Local Authentication** | Android Biometrics (Fingerprint / Face) |
| **Expo Haptics** | Tactile touch feedback |
| **Expo Linear Gradient** | Signature Emerald Mint surfaces |

---

## 📂 Project Structure

```
PassManage/
├── android/                   # Continuous Native Generation prebuild (Gradle 9.4.1 / Kotlin 2.3.0)
├── assets/                    # App icons, splash screens, and images
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── BottomTabBar.tsx       # Liquid flow animated bottom navigation
│   │       ├── CategoryPills.tsx      # Category selector (All, Login, Card, WiFi, etc.)
│   │       ├── ChangePinModal.tsx     # 3-step PIN change modal with fingerprint bypass
│   │       ├── Header.tsx             # Dynamic greeting, avatar & quick lock
│   │       ├── HealthScoreGauge.tsx   # Reanimated circular SVG health gauge
│   │       ├── MetricCard.tsx         # Watchtower summary metric cards
│   │       ├── SyncAnimationGraphic.tsx # Reanimated local vault hardware graphic
│   │       └── VaultItemCard.tsx      # Credential item card with brand detection
│   ├── context/
│   │   └── VaultContext.tsx           # Global state, encryption lifecycle & demo seeders
│   ├── screens/
│   │   ├── SplashScreen.tsx           # Minimalist brand reveal with loading bar
│   │   ├── OnboardingScreen.tsx       # Single-screen privacy intro & vector graphic
│   │   ├── CreateAccountScreen.tsx    # 4-digit PIN setup & local profile personalization
│   │   ├── LockScreen.tsx             # 4-digit PIN keypad & biometric prompt
│   │   ├── HomeScreen.tsx             # Dashboard, Watchtower radar & recent items
│   │   ├── VaultListScreen.tsx        # Filterable, searchable credential list
│   │   ├── GeneratorModal.tsx         # Password & passphrase generator
│   │   ├── SettingsScreen.tsx         # Security settings, WhatsApp backup & testing tools
│   │   ├── VaultDetailSheet.tsx       # View credential details & WhatsApp share
│   │   └── AddEditVaultSheet.tsx      # Add or edit credential sheet
│   ├── services/
│   │   └── security.ts                # AES-256 encryption, hashing & Watchtower logic
│   └── theme/
│       └── colors.ts                  # Palette A (Emerald Mint & Crisp White)
├── App.tsx                    # Root navigator & state router
├── app.json                   # Expo configuration
├── package.json               # Dependencies
└── README.md                  # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or newer recommended, v22 tested)
- **JDK 17** (Temurin or OpenJDK)
- **Android SDK** (API 34/35) & Android Studio for running on an emulator or physical device

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Himangshuroy101/PassManage.git
   cd PassManage
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Verify typecheck:**
   ```bash
   npx tsc --noEmit
   ```

4. **Run on Android (Development Build):**
   ```bash
   npx expo run:android
   ```

5. **Start Metro dev server:**
   ```bash
   npx expo start
   ```

---

## 🔒 Security Architecture

1. **Zero-Knowledge Principle**: No master PIN or unencrypted password is ever written to plain logs, cache, or external networks.
2. **Key Derivation**: The Master PIN is hashed using **SHA-256 with unique salting** before verification.
3. **Master Key**: A high-entropy 256-bit cryptographic key is generated and locked inside Android KeyStore (`expo-secure-store`).
4. **Clipboard Protection**: Passwords copied to the clipboard use secure flags and are auto-cleared after a configurable timeout.
5. **Background Auto-Lock**: The app listens to `AppState` lifecycle events; backgrounding the app for more than 30 seconds automatically locks the vault.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
