# Gatame Kosen Judo Online: 学習パス・ナビゲーター 仕様書

## 1. システム概要

ユーザーの柔道・柔術経験と現在の課題（診断）に基づき、**18 モジュール**のカタログから最適な学習順序を算出し、**ユーザー専用の学習パス（4 + 1）** として提示する Web アプリケーション。

動画の羅列ではなく **Diagnostic Navigator モデル**により、受動的な視聴から能動的な課題解決・技術証明へユーザーを導き、放置率の低減と Black Belt System（BBS）へのコンバージョンを最大化する。

## 2. 開発・UX方針

**Gatame Learning Path Navigator：開発方針および UX 戦略**

本設計は、ユーザーの「学習（動画視聴）」と「実践（道場での練習）」のループをアプリ内で完結させることで、放置率を下げ、BBS へのコンバージョン率を最大化する。

### 2.1 UX 戦略の全体像：Diagnostic Navigator モデル

| 項目 | 内容 |
|------|------|
| **課題** | 動画の羅列による認知負荷と、練習と学習の分断 |
| **解決策** | 診断により「ユーザー専用の学習パス」を生成し、行動を最適化する |
| **目的** | 受動的な動画視聴から、能動的な課題解決と技術証明へのシフト |

### 2.2 学習ループの心臓部：「練習前後の確認カード」

習慣化とコンバージョンのトリガー。

**練習前**

- アプリ起動時に **Today's Focus** カードを表示
- 本日練習する技の **3 つの意識ポイント** を提示し、**練習中の脳内メモリを占有**させる

**練習後**

- 練習直後のカードで **Triage（振り返り）** を実施
- 「成功した」「感覚が違う」「次回持ち越し」の **3 択** で状態を判定
- **重要性:** この振り返りが「自分の技術が本当に正しいのか？」という疑問（認知の歪み）を可視化する唯一の接点であり、BBS（プロのフィードバック）が必要だという納得感を生む **最大のフック**

各モジュール内の **5 つの重要技** に対しても、同様のカード振り返りを行い自己効力感を高める。

### 2.3 アプリケーションの構造：「4 + 1」デザイン

| 要素 | 説明 |
|------|------|
| **パーソナライズ学習パス** | 診断回答に基づき **スタイル/課題プールから 4 つ** を抽選して提示（`specification.md`） |
| **学習の質** | 各モジュール内の 5 つの重要技に対し、カードでの振り返りを実施 |
| **第 5 のモジュール（コンバージョンゲート）** | 4 つの学習クリア後にアンロックされる **Black Belt System 認定準備** モジュール |

第 5 モジュールの UI:

- **ゴールド**のアクセントで他モジュールと視覚的に差別化（プレミアム・特別感）
- クリックで **Offer Page** へシームレスに誘導

> **実装状況:** 診断（§1）・**4 + 1 縦型パス UI**・パス **生成算法**（`PathGenerationService` / `specification.md` §4〜7）・**Today's Focus / Triage カード**（§4.3）は実装済み。

### 2.4 コンバージョンへの導線戦略

ユーザー心理を「課題解決」から「技術証明」へ段階的に導く。

| フェーズ | アクション | UX 上の目的 |
|----------|------------|-------------|
| 入口 | 診断テスト | 自分事化（最適化されたパスの提示） |
| 循環 | 確認カード（前 / 後） | アプリ起動の習慣化 ＆「自分の技への疑問」の顕在化 |
| 学習 | 4 つのモジュール完了 | スキル習得と「できた！」という達成感の醸成 |
| 転換 | 第 5 モジュール（BBS） | 「客観的証明（フィードバック）」への欲求喚起 |
| 購入 | 割引付き Offer Page | 心理的障壁の排除と合理的な意思決定 |

### 2.5 UI/UX デザインのトーン＆マナー

| 項目 | 方針 |
|------|------|
| **コンセプト** | プロフェッショナルな道場（洗練・効率） |
| **配色** | 黒ベース ＋ ゴールド（認定の価値を象徴） |
| **UX ライティング** | ゲーム的な甘さを排し、「技術の完成」「認定」「フィードバック」など **フォーマルかつプロフェッショナル** な表現に統一 |

## 3. ターゲット

- 未経験者、柔道 / BJJ 経験者、熟練者
- 目標：Annual Membership の新規獲得、および Black Belt System（BBS）へのコンバージョン

## 4. 主要機能（製品機能）

### 4.1 診断システム（Assessment）

診断設問の **正式仕様** は [`specification.md` §1](specification.md) を参照。

| フロー | 設問 |
|--------|------|
| **未経験者**（Q1 = Absolute Beginner） | Q1 → **Q2-alt** → **Q3** → **Q4** Annual Membership |
| **経験者・熟練者** | Q1 → **Q2** → **Q3** → **Q4** Annual Membership |

**Q4（共通）** — *Do you have an active Annual Membership?*（単一選択。パス抽選には使わない）

- Yes → Bottom Bar **Videos** / ドロワー **Watch Video** は [Gatame Kosen Online](https://www.kosenjudoonline.com/login) ログインへ
- Not yet → **Membership** / **Get Membership** は [Annual オファー](https://www.kosenjudoonline.com/offers/RsoV92Tp/checkout) シートへ
- 詳細: [`specification.md` §1 / §10.14](specification.md)

**Q1（共通）** — *Which profile fits you best today?*（単一選択）

- Absolute Beginner — No martial arts experience
- Judo Student — White through brown belt
- BJJ Practitioner — White through blue belt
- Advanced Judoka — Black belt (shodan) and above
- Elite BJJ Roller — Purple belt and above

**Q2-alt（未経験者のみ）** — *What fighting style do you aspire to?*（複数選択可）

- Dynamic Throws / Ground Control / Submission Arts / Standing to Ground

**Q2（経験者・熟練者）** — *What technical challenges do you want to solve?*（複数選択可・スキップ可）

- Throw to Submission / Pin Escapes / Flipping the Turtle / Submission Arts Mastery / Guard Pass & Defense / Gripping Battles

**Q3（共通）** — *What is your ultimate goal for this path?*（単一選択）

- Fix Your Weakness / Gatame Kosen Mastery / Fill the Gaps / Curriculum for Coaches

- 診断完了時に **学習パス生成アルゴリズム**（§7 / `specification.md` §4〜7）を実行
- **UI では 4 モジュール + 第 5（BBS ゲート）** を提示（§2.3）

> **廃止:** 経験者向け旧 Q2（Judo/BJJ/Mix 興味）、旧 Q5 ゴール設問。

### 4.2 パーソナライズ学習パス（縦型ナビゲーター）

- 診断結果に基づく **4 モジュール** の順序付きリスト
- モジュール単位の進捗・メモ・完了フィードバック
- 4 モジュール完了後に **第 5 モジュール（BBS 認定準備）** を利用可能（コンバージョンゲート）
- **4 モジュールすべて完了時:** ステージ完了プロンプト → **「Generate next path」** で同一診断・習得済み除外の **次 4 モジュール** を自動生成（`specification.md` §6.4）
- **目標変更時:** 「Retake assessment」で診断からやり直し（副次導線）

### 4.3 練習前後の確認カード（実装仕様確定）

> **正式仕様:** `specification.md` §11  
> **実装状態:** 初版実装済み（起動時表示・Practice Check・Not Working 導線・Undo 5 秒）

- **自動表示:** 2 回目以降のアプリ起動時（session 有無不問）
- **抑制:** 最後の Not now から 6 時間は自動再表示しない
- **対象技:** UI 表示順で最初の未完了 technique
- **Drawer 導線:** 未完了技がある場合のみ **Practice Check** ボタンを表示
- **成功時:** local 即時反映 → outbox enqueue → 非同期 Supabase 同期（Undo 5 秒）
- **連続進行:** 完了後は次の未完了 technique カードを連続表示
- **Not Working:** 教育文言（3 種ランダム）→ BBS 訴求文 → CTA
- **BBS 遷移先:** 4+1 パスの **5 枠目 module `url`**

### 4.4 認証・会員アクセス

> **正式仕様:** [`specification.md` §10](specification.md)（Guest 優先・JIT・トップゲートウェイ・Magic Link 復元）。  
> **実装状況:** §10 どおり実装済み（トップゲートウェイ、Guest、Magic Link 別デバイス復元）。Supabase 初回設定は `specification.md` §10.13。

| 柱 | 内容 |
|----|------|
| **トップ（ゲートウェイ）** | 状態に応じて「診断を始める」「前回から再開」「続きから始める」を出し分け |
| **Guest 優先** | 初回はログイン不要。診断完了・パス生成後のみ `localStorage` に保存 |
| **同一デバイス** | local から即再開（パス・進捗・Memo・TODO） |
| **別デバイス** | **Magic Link 必須**（未認証 Lookup は行わない）→ 認証後 Supabase からフル復元 |
| **Member** | Supabase が正本。トップ CTA「続きから始める」 |
| **Just-in-Time** | 学習パス上「進捗を保存（同期）」で初めてクラウド保存を促す |
| **Kajabi** | **Redirect（リンク）方式** — `?email=` 付き `/access`（API 連携なし） |

- 診断途中の離脱は **保存しない**（`specification.md` §10.3）
- 同期基盤: Supabase（§8）。`localStorage` は同一端末の快適用キャッシュ

### 4.5 廃止・非推奨とした旧仕様

以下は **本 UX 方針と整合しない** ため、仕様書から削除した。コードに残存する場合はリファクタ対象とする。

- インタラクティブ技術ツリー（React Flow Skill Map）を主 UI とする設計
- Pass あたり **最大 8 テクニック** ＋ 途中 **BBS マイルストーン挿入**（未経験 3 完了で九級、等）
- インスタ共有用ツリー画像生成を中核機能とする位置づけ
- 「次のステージへ」による **8 件単位の Pass 再生成** を主導線とする設計
- 全モジュール **重み和スコアリングのみ** で上位 4 件を選ぶ方式（Score Spec v0）
- 経験者向け **Q2 興味**（Judo/BJJ/Mix）、旧 **Q5** ゴール設問（Q3 に統合）

## 5. モジュールカタログ

全 **18 モジュール**（`backend/src/main/resources/modules.json`）。

生成アルゴリズムでは `category` / `difficulty` から **FOUNDATION / INTERMEDIATE / ADVANCED** 階層に分類し（`specification.md` §3）、ユーザーレベルごとの枠ルール（§7.2）に従って **4 件を抽選** する。第 5 枠は BBS 購入ゲート（§2.3）。

## 6. 技術スタック
- **Backend**: Java 21 / Spring Boot 3
- **Frontend**: React / Tailwind CSS / React Flow
- **Database**: PostgreSQL (ユーザー進捗・カスタムツリー保存用)
- **Tool**: Cursor

## 7. 学習パス生成アルゴリズム

> **正式版:** マッピング表・モジュール ID・実装契約の全文は [`specification.md`](specification.md) を参照。  
> **実行タイミング:** 診断完了 → 結果画面遷移の瞬間（サーバーまたはクライアント）。  
> **実装状況:** 本節が **正**。`PathGenerationService` / `LearningPathService` で実装済み。

### 7.1 ユーザーレベル（前提定義）

| レベル | 診断 UI（英語） |
|--------|-----------------|
| **Unexperienced** | Absolute Beginner |
| **Experienced** | Judo Student, BJJ Practitioner |
| **Advanced** | Advanced Judoka, Elite BJJ Roller |

### 7.2 抽出・構成ルール（4 枠 + Goal）

| ユーザーレベル | 構成（計 4 枠） | Goal（5 枠目） |
|----------------|-----------------|----------------|
| **Unexperienced** | Ukemi（固定）+ FOUNDATION×1 + INTERMEDIATE×2 | Kyukyu 購入 |
| **Experienced** | FOUNDATION×1 + INTERMEDIATE×2 + ADVANCED×1 | Sankyu 購入 |
| **Advanced** | INTERMEDIATE×2 + ADVANCED×2 | Sankyu 購入 |
| **Advanced（Gripping 例外）** | INTERMEDIATE×3 + ADVANCED×1 | Sankyu 購入 |

Advanced かつ Q2 **Gripping Battles**（`grip-fight`）選択時は Gripping 例外行を適用。

### 7.3 実行フロー

1. **プール取得** — 未経験: Q2-alt スタイル / 経験・熟練: Q2 課題に基づき候補モジュールプールを構築（`specification.md` §7）
2. **フィルタリング** — レベル外モジュール（例: 未経験者の ADVANCED）を除外
3. **ランダム抽出** — 枠数（例: INTERMEDIATE×2）より候補が多い場合、該当枠から **ランダム** に選ぶ（重複なし）
4. **ソート** — FOUNDATION → INTERMEDIATE → ADVANCED の難易度順
5. **Goal 結合** — 末尾（5 番目）に BBS 購入ゲート（Kyukyu / Sankyu）を追加

### 7.4 実装上の注意

- **重複排除:** Q2 / Q2-alt の複数選択時、マッピングプールを和集合し、抽出 4 件はすべてユニーク
- **枠不足:** プール内に INTERMEDIATE 等が足りない場合、カタログ全体の当該階層からランダム補完（`specification.md` §6.2）

### 7.5 マッピング概要

| 対象 | 入力 | 詳細 |
|------|------|------|
| 未経験者 | Q2-alt: Dynamic Throws / Ground Control / Submission Arts / Standing to Ground | `specification.md` §7.1 |
| 経験者・熟練者 | Q2: Throw to Submission / Pin Escapes / … / Gripping Battles | `specification.md` §7.2 |

### 7.6 API レスポンス（互換）

`POST /api/assessment` の `AssessmentResponse` 構造は維持する。

- `recommendedModules` — **生成 4 モジュールを先頭**（`finalScore > 0`）、続けてカタログ残り
- `recommendedBbsGrade` — Unexperienced: `九級`（Kyukyu）、それ以外: `三級`（Sankyu）
- UI 表示 — フロント `buildFourPlusOnePath` が **4 + BBS ゲート** に整形（§2.3）

---

## 8. データ永続化とクロスブラウザ同期

### 8.1 ストレージアーキテクチャ

| データ | 書き込み先 | 読み取り優先順 |
|---|---|---|
| 学習パス（診断結果・推奨一覧） | localStorage + Supabase `user_learning_paths` | Supabase（新しい方） > localStorage |
| 完了状態（session/lifetime/BBS） | localStorage + Supabase `user_module_progress` | Supabase ∪ localStorage（マージ） |
| TODO チェック・Memo | Supabase `user_module_details` | Supabase（local はキャッシュ） |

### 8.2 Supabase テーブルのセットアップ

`supabase/migrations/001_user_progress.sql` を Supabase Dashboard の SQL Editor で実行する。

```sql
-- 実行するだけ。CREATE TABLE IF NOT EXISTS / RLS ポリシー込み。
-- supabase/migrations/001_user_progress.sql を参照。
```

### 8.3 同期フロー

1. **ブラウザ A で操作**
   - localStorage に書き込む（即時）
   - Supabase DB へ非同期 write-through（fire-and-forget）
2. **ブラウザ B でアクセス**
   - localStorage キャッシュが空 → Supabase から最新データをロードして表示
3. **Supabase 未設定 / オフライン時**
   - 全関数が no-op となり localStorage のみで動作（従来の挙動に自然フォールバック）

### 8.4 セキュリティ

- 全テーブルに Row Level Security (RLS) を有効化。`auth.uid() = user_id` の条件でユーザーは自分のデータのみ操作可能。
- フロントエンドは Supabase の anon key を使用。進捗の読み書きは **JWT 確立後**（Member）。
- 未認証での Supabase upsert **禁止**。別デバイス復元は **Magic Link 後のみ**（§10.5）。
- Magic Link 送信レート制限（目安: 3 回 / 15 分 / email）。初回マージは §10.8。

## 9. Render（Docker）でバックエンド API

Render は JVM をネイティブランタイムとして提供しないため、**Web Service の Language を Docker** にし、`backend/Dockerfile` でビルド・起動する。

| Render 設定 | 値 |
|--------------|-----|
| Root Directory | `backend` |
| Dockerfile Path | `Dockerfile`（`backend/Dockerfile` にしないこと） |
| Build Command | （空で可。Dockerfile の `RUN mvn` でビルド） |
| Start Command | （空で可。`ENTRYPOINT` で起動） |

> **よくあるエラー:** Root Directory = `backend` のまま Dockerfile Path を `backend/Dockerfile` にすると、`.../backend/backend` を参照して **Deploy 失敗**（`lstat .../backend/backend: no such file or directory`）。**Dockerfile Path は `Dockerfile` のみ。**
>
> **代替:** Root Directory を空にする場合は、Dockerfile Path を `backend/Dockerfile` にする（どちらか一方の書き方に統一する）。

環境変数:

| Key | 例 |
|-----|-----|
| `GATAME_CORS_ALLOWED_ORIGINS` | 通常は **未設定で可**（`application.yml` のデフォルトが本番 Vercel）。ローカルで API 単体起動する場合のみ `http://localhost:5173`（`backend/.env.example` 参照） |
| `PORT` | Render が自動注入（手動不要） |

`application.yml` の `server.port: ${PORT:8080}` と `gatame.cors.allowed-origins` の環境変数上書きに対応済み。

## 10. 本番 URL

| 用途 | URL |
|------|-----|
| **フロント（Vercel）** | https://gatame-kosen-learning-pass-navigato.vercel.app/ |
| **トップ（目標）** | `/` — ゲートウェイ（診断開始 / 再開 / 続きから / 別デバイス復元） |
| **診断・学習パス** | `/diagnostic`（Guest 可） |
| **会員・別デバイス復元** | `/access`（Magic Link・Kajabi `?email=`） |
| Kajabi（推奨） | `https://gatame-kosen-learning-pass-navigato.vercel.app/access?email=【ここにEmailのLiquidを挿入】` |
| **API（Render）** | https://gatame-kosen-learning-pass-navigator.onrender.com |

### Kajabi でメールを URL に載せるとき

`{{member.email}}` は **Kajabi 公式の会員メール用タグ一覧に含まれない**ことが多く、そのまま貼るとブラウザにも `{{member.email}}` と表示されたままになります（アプリ側では展開できません）。

1. **Email Broadcast / Sequence** のボタンリンクを編集する  
2. ツールバーの **Personalize（パーソナライズ）** から **Email** を選び、リンク URL に挿入する  
   - 例: `https://gatame-kosen-learning-pass-navigato.vercel.app/access?email=` の直後に Email タグを置く  
3. **テスト送信** して、受信メール内のリンクを開き、アドレスバーに実際の `xxx@gmail.com` が出るか確認する  
4. プレビュー画面や通常のテキスト欄に `{{member.email}}` を手打ちしない（Liquid が処理されない場所がある）

メールが URL に載らない場合でも、会員は `/access` で手入力して利用できます。

> **Kajabi URL 注意:** ドメインは **`…vercel.app`**（末尾に **`.com` を付けない**）。`…vercel.app.com` は証明書エラー（`NET::ERR_CERT_COMMON_NAME_INVALID`）になる。

`application.yml` の CORS デフォルトは上記 Vercel ドメインと一致済み。Supabase の **Redirect URLs** に `…/diagnostic`（旧 `/dashboard` も可）を登録すること。

## 11. Vercel（フロント）と API プロキシ

診断送信は `POST /api/assessment` を呼ぶ。本番では Vercel の **Rewrites** で Render に転送する（ローカルは `frontend/vite.config.ts` の proxy）。

**ローカルでデプロイせず試す:** [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) — ターミナル A: `npm run dev:api`、ターミナル B: `npm run dev` → http://localhost:5173

| Vercel 設定 | 値 |
|--------------|-----|
| **Root Directory** | **空欄**（リポジトリルート。`frontend` でも可だが `frontend/vercel.json` は**絶対に不可**） |
| Build / Output / Rewrites | リポジトリ直下の **`vercel.json`** に記載（手動上書き不要） |

ダッシュボードで **Root Directory に `frontend/vercel.json` と入れている場合**は、フィールドを**完全に空**にして Save → Redeploy（ファイルパスではなくフォルダ名の誤入力が原因）。

> **404 on `/api/*`:** ルートの `vercel.json` がデプロイに含まれているか確認。Render URL 変更時は `vercel.json` の `destination` を更新する。
