# CYBER PROTOCOL: OVERDRIVE - Google Play Store 配信ガイド

本ゲームは **PWA (Progressive Web Apps)** 仕様および **Capacitor / TWA (Trusted Web Activity)** に完全対応するように設計されています。以下のいずれかの方法で、Google Play Store 向けの Android アプリ（`.aab` または `.apk`）をビルドして公開できます。

---

## 方式1: Capacitor による Android ネイティブアプリ化（推奨・最も拡張性が高い）

Capacitor を使用すると、Android Studio で直接プロジェクトを開くことができ、Google Play 請求（In-App Purchase / アプリ内課金）や Google AdMob 広告、オフライン完全動作のパッケージングが容易になります。

### 手順

1. **Capacitor の依存関係をインストール**:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```

2. **Capacitor 設定を初期化**:
   ```bash
   npx cap init "CYBER PROTOCOL" "com.cyberprotocol.overdrive" --web-dir "dist"
   ```

3. **Webアプリをプロダクションビルド**:
   ```bash
   npm run build
   ```

4. **Android プラットフォームを追加**:
   ```bash
   npx cap add android
   ```

5. **Webアセットを Android プロジェクトに同期**:
   ```bash
   npx cap sync android
   ```

6. **Android Studio で開く**:
   ```bash
   npx cap open android
   ```
   - Android Studio が起動したら、アプリアイコンや署名鍵（Keystore）を設定し、`Build > Generate Signed Bundle / APK` から Google Play 用の **Android App Bundle (.aab)** を作成できます。

---

## 方式2: Bubblewrap / TWA (Trusted Web Activity - Google公式ツール)

自前の Web サーバー（Vercel, Cloudflare Pages, Firebase Hosting など）に本ゲームをデプロイし、その URL をラップして Google Play Store に配信する公式の手法です。

### 手順

1. ゲームをビルドして Web サーバーにデプロイ:
   ```bash
   npm run build
   ```
   （`dist` ディレクトリの内容をホスティングサービスにアップロードし、HTTPS の URL を取得します）

2. Bubblewrap CLI を実行:
   ```bash
   npx @bubblewrap/cli init --manifest=https://あなたのドメイン/manifest.webmanifest
   ```
   対話形式でアプリ名やパッケージ名、Keystore を設定します。

3. アプリバンドル (.aab) をビルド:
   ```bash
   npx @bubblewrap/cli build
   ```

4. 生成された `.aab` ファイルを Google Play Console にアップロードして審査へ提出します。

---

## 本プロジェクトですでに設定済みの Android 向け最適化

- **PWA Web App Manifest**: `public/manifest.webmanifest`（縦画面固定 `portrait`、スタンドアロン全画面表示 `standalone`）
- **Service Worker**: `public/sw.js` によるオフラインキャッシュ動作
- **ハイレゾ・アプリアイコン**: `public/icon-512.jpg` (512x512)
- **触覚フィードバック (Haptic Vibration)**: タップ時・購入時・クリティカル時の `navigator.vibrate`
- **内蔵シンセサイザー (Web Audio API)**: 外部アセットロード待ち不要の高速軽量オーディオ
- **タッチ操作の誤動作防止**: ダブルタップズーム防止 (`touch-action: manipulation`)、テキスト選択防止 (`user-select: none`)、ノッチ対応 (`viewport-fit=cover`)
