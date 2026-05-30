# ローカル開発（デプロイ不要）

本番（Vercel / Render）の設定は変えず、**ローカルだけ**で診断〜学習パス生成まで試す手順です。

## 前提

- Java 21、Node.js 20 前後
- リポジトリルートで `npm run install:frontend` 済み

## 1. バックエンド（API）

ターミナル A（リポジトリルート）:

```bash
npm run dev:api
```

- `spring.profiles.active=dev` で起動（`application-dev.yml` が CORS に localhost を許可）
- ポート **8080**
- **本番 JAR / Docker では `dev` プロファイルは使わない**ため、デプロイ後の CORS 挙動は従来どおり

IDE から起動する場合: Run Configuration に環境変数または VM オプションで  
`spring.profiles.active=dev` を付ける。

## 2. フロントエンド

ターミナル B（リポジトリルート）:

```bash
npm run dev
```

- **http://localhost:5173** を開く（`127.0.0.1` でも可）
- `/api/*` は Vite が `http://localhost:8080` にプロキシする（ブラウザから CORS 不要）

## 3. 動作確認

1. トップまたは `/diagnostic` で診断を完了する
2. 学習パス（縦型ロードマップ）が表示されれば OK
3. 失敗時はブラウザの Network で `POST /api/assessment` の URL が  
   `http://localhost:5173/api/...` であることを確認（`onrender.com` 直叩きはローカルでは不要）

### API 単体テスト（任意）

```bash
curl.exe -s -X POST "http://localhost:8080/api/assessment" ^
  -H "Content-Type: application/json; charset=utf-8" ^
  --data-binary "@scripts/local-dev/assessment-payload.json"
```

`dev` プロファイル起動時は `Origin: http://localhost:5173` 付きのブラウザ相当リクエストも CORS 許可されます。

## 4. ビルド成果物のローカル確認（任意）

```bash
npm run build
npm run preview
```

- プレビューは **http://localhost:4173**（`vite.config.ts` の `preview.proxy` で `/api` を 8080 に転送）
- このときもターミナル A で API を起動しておく

## Supabase（任意）

Member 同期をローカルで試す場合のみ:

```bash
cp frontend/.env.development.example frontend/.env.development
# NEXT_PUBLIC_SUPABASE_* を設定
```

未設定でも **Guest**（診断・パス・進捗の localStorage）は利用できます。

## 本番との違い

| 項目 | ローカル | 本番 |
|------|----------|------|
| フロント | Vite dev / preview | Vercel |
| API | localhost:8080 | Render（Vercel Rewrite 経由） |
| CORS | `dev` プロファイルで localhost 許可 | `application.yml` デフォルト（Vercel URL） |
| `application-dev.yml` | 有効 | **読み込まれない** |
