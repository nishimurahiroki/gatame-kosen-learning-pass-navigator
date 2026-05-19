# プロジェクト・ファイルメモ

最終更新: 2026-05-19

このメモは、`c:\dev\Gatame 学習Pass` 配下の主要ファイルの「パス」と「役割」をまとめた一覧です。  
今後ファイルの追加・削除があった場合は、このメモも更新します。

## ルート

- `README.md`  
  学習パス・ナビゲーターの仕様書（システム概要、機能、重み付けロジック）。

- `PROJECT_FILE_MEMO.md`  
  本メモ。ファイルパスと役割の参照用ドキュメント。

## バックエンド（Spring Boot）

- `backend/pom.xml`  
  Maven設定。Spring Boot / Java 21 / PostgreSQL / テスト依存関係を定義。

- `backend/src/main/java/com/gatame/learningpass/GatameLearningPassApplication.java`  
  Spring Boot起動クラス（エントリーポイント）。

### config

- `backend/src/main/java/com/gatame/learningpass/config/ModuleConfigLoader.java`  
  `modules.json` を読み込み、`List<Module>` としてDIコンテナに登録。

### constants

- `backend/src/main/java/com/gatame/learningpass/constants/UserType.java`  
  ユーザー属性（`BEGINNER` / `JUDO` / `BJJ` / `ADVANCED`）定義。

- `backend/src/main/java/com/gatame/learningpass/constants/ModuleCategory.java`  
  モジュールカテゴリ（基礎、単体技術、攻防、遷移）定義。

- `backend/src/main/java/com/gatame/learningpass/constants/WeightConstants.java`  
  重み付けロジックで使う定数（Base Score、属性補正、課題ボーナス、BBSしきい値）。

### model

- `backend/src/main/java/com/gatame/learningpass/model/Module.java`  
  モジュール情報モデル。JSONデータをマッピングするドメインクラス。

- `backend/src/main/java/com/gatame/learningpass/model/DifficultyLevel.java`  
  難易度（`BEGINNER` / `INTERMEDIATE` / `ADVANCED`）定義。

### dto

- `backend/src/main/java/com/gatame/learningpass/dto/AssessmentRequest.java`  
  診断フォームから受け取るリクエストDTO。

- `backend/src/main/java/com/gatame/learningpass/dto/LearningPathResponse.java`  
  学習パスAPIのレスポンスDTO（モジュール一覧 + BBS誘導情報）。

- `backend/src/main/java/com/gatame/learningpass/dto/ScoredModule.java`  
  スコア計算済みモジュールDTO。

- `backend/src/main/java/com/gatame/learningpass/dto/ScoreBreakdown.java`  
  スコア内訳DTO（base / userType / problemMatch）。

### service

- `backend/src/main/java/com/gatame/learningpass/service/LearningPathService.java`  
  学習パス生成の中核ロジック（重み付け計算、ソート、BBS判定）。

### controller

- `backend/src/main/java/com/gatame/learningpass/controller/LearningPathController.java`  
  `POST /api/v1/learning-path` を受けるAPIコントローラー。

### resources

- `backend/src/main/resources/application.yml`  
  Spring設定（DB接続、CORS、`modules.json` 読み込みパスなど）。

- `backend/src/main/resources/modules.json`  
  モジュール定義データ。初期スコアや関連情報を外部管理するためのJSON。

## フロントエンド（React + Vite）

- `frontend/package.json`  
  npm依存関係とスクリプト定義。

- `frontend/vite.config.ts`  
  Vite設定（開発サーバー、APIプロキシ）。

- `frontend/tsconfig.json`  
  TypeScript設定（アプリ本体）。

- `frontend/tsconfig.node.json`  
  TypeScript設定（Node/Vite設定ファイル向け）。

- `frontend/tailwind.config.js`  
  Tailwind CSS設定（テーマカラー含む）。

- `frontend/index.html`  
  Reactマウント用HTML。

### src

- `frontend/src/main.tsx`  
  Reactアプリのエントリーポイント。

- `frontend/src/App.tsx`  
  画面全体のルートコンポーネント（診断フォームとスキルマップ切替）。

- `frontend/src/index.css`  
  グローバルスタイル（Tailwind + React Flowスタイル読み込み）。

### src/types

- `frontend/src/types/index.ts`  
  共通型定義（API型、課題一覧、BBSしきい値）。

### src/api

- `frontend/src/api/learningPathApi.ts`  
  バックエンドAPI呼び出し処理（Axios）。

### src/hooks

- `frontend/src/hooks/useLearningPath.ts`  
  学習パス取得の状態管理フック（loading/error/data）。

### src/components/assessment

- `frontend/src/components/assessment/AssessmentForm.tsx`  
  診断フォームUI（ユーザー属性・課題の入力）。

### src/components/skillmap

- `frontend/src/components/skillmap/SkillMap.tsx`  
  React Flowによる技術ツリー表示、進捗管理、画像保存導線。

- `frontend/src/components/skillmap/SkillNode.tsx`  
  技術ノード表示コンポーネント（難易度色分け、完了ボタン）。

### src/api（Supabase 同期で追加）

- `frontend/src/api/supabaseProgressApi.ts`  
  Supabase DB への進捗永続化 API（学習パス / 完了状態 / TODO・Memo）。  
  supabase が null（env 未設定）の場合は全関数が no-op で localStorage のみ動作。

### src/components/common（UX 改善で追加）

- `frontend/src/components/common/Toast.tsx`  
  グローバル `showToast(message, variant?, duration?)` 関数と `<ToastHost />`。`App.tsx` で 1 個マウント。
- `frontend/src/components/common/ConfirmDialog.tsx`  
  汎用 2 ボタン確認ダイアログ（Esc / バックドロップで閉じる、`tone='destructive' | 'default'`）。
- `frontend/src/components/common/PathGenerationLoadingScreen.tsx`  
  学習パス生成中のフルスクリーン表示（Cancel ボタン付き、`useLearningPath.cancel()` を呼ぶ）。
- `frontend/src/components/common/EnvErrorScreen.tsx`  
  必須環境変数（Supabase）未設定時に表示する代替画面。`App.tsx` が `isSupabaseConfigured === false` で切替。

## 更新ルール（運用）

- 新規ファイル作成時: このメモに「パス + 役割」を1行追加。
- ファイル削除時: このメモから該当行を削除。
- 役割変更時: 該当説明文を更新。
- 迷った場合: 「何のためのファイルか」を最短1文で記載。

## UX 改善変更履歴 (2026-05-19〜)

### #1 AssessmentForm: Q1 切替後 Next 無反応バグ修正
- `frontend/src/components/assessment/AssessmentForm.tsx`
- `SET_SEGMENT` 時に segment が変わった場合 `stepId` を `q1` にリセットし、無効化される回答（NOVICE 化で interests/painIds、経験者化で aspirations）をクリア。
- `NEXT` / `BACK` で `state.stepId` が現 order に含まれない（未到達ステップ）場合は order の先頭に復帰させる防御を追加。

### #2 モジュール完了を楽観更新に変更（サーバー停止時も完了可能）
- `frontend/src/components/skillmap/VerticalPathContainer.tsx`
- `submitModuleFeedback` で `setCompletedIds` と Dialog クローズを **API 送信前に**実行。フィードバック API は fire-and-forget に変更。
- 失敗時はトースト「Could not save your feedback. Completion is recorded locally.」のみ表示し、完了状態は維持する。
- 新規ユーティリティ `frontend/src/components/common/Toast.tsx`:
  - `showToast(message, variant?, duration?)` をどこからでも呼べる関数として export。`<ToastHost />` を `App.tsx` でマウント。
  - variant は `info` / `success` / `error`、固定 4500ms で自動消滅。
- `frontend/src/locales/en.json` に `toast.*`（feedbackSaveFailed / todoSaveFailed / memoSaveFailed）を追加。

### #3 Memo 未保存リスク修正（手動 Save ボタン + アンマウント時 flush）
- `frontend/src/components/skillmap/VerticalPathDrawerPanel.tsx`
- 明示的な「Save」ボタンを追加（dirty なときのみ enable）。
- ステータス表示「Unsaved / Saving… / Saved」をラベル右に表示。
- moduleId 切替・Drawer アンマウント時に dirty なら `onMemoSave` を呼んで未保存を救う。
- 失敗時は `savedMemoRef` を更新せず Unsaved 表示を維持。
- `frontend/src/components/skillmap/VerticalPathContainer.tsx`
- `handleMemoSave` で失敗時にトーストを出し、呼び出し元へ例外を再 throw。
- `handleToggleTodo` で失敗ロールバック時に「Could not save the checklist update.」トーストを追加。
- `frontend/src/locales/en.json` の `pathDrawer.*` に memoSave / memoSaving / memoSaved / memoUnsaved を追加。

### #4 SignUp 成功後に自動で Sign In タブへ切替
- `frontend/src/components/auth/LoginScreen.tsx`
- `signUp` 成功時に `setMode('signIn')` で即座にタブを切替、`password` フィールドをクリア。
- 「Account created. Check your email to confirm, then sign in.」をフォーム内バナーとトースト（6 秒, success 配色）の両方で提示。

### #5 破壊的アクションに確認ダイアログを追加
- 新規 `frontend/src/components/common/ConfirmDialog.tsx`:
  - 汎用 2 ボタンダイアログ（title / description / confirmLabel / cancelLabel / tone='default' or 'destructive'）。
  - バックドロップ・Esc・Cancel で閉じる。`busy` 中は閉じる操作を無効化。
- `frontend/src/locales/en.json`:
  - `common.cancel` / `common.confirm` を追加。
  - `confirm.retakeAssessment` / `confirm.bbsMastered` / `confirm.annualMembership` を追加。
- `frontend/src/NavigatorApp.tsx`: 「Retake assessment」をクリックすると ConfirmDialog（destructive）を開く。説明文で「学習パスはクリアされる／進捗・メモは保たれる」を明示。
- `frontend/src/components/skillmap/AnnualMembershipPromoOverlay.tsx`: 「I have Annual Membership」を押下時に ConfirmDialog（default tone）を表示。
- `frontend/src/components/skillmap/VerticalPathContainer.tsx`:
  - `handleDeclareBbsMastered` を「ConfirmDialog を開くだけ」に変更。
  - 確認後 `handleConfirmBbsMastered` で `addCompletedBbsLevel` 等を実行。
  - BbsPathStepNode / BbsOfferDrawerPanel からの呼び出しは引数互換のため不変。

### #6 PathStepNode: 内部スコア「score N」表示を削除
- `frontend/src/components/skillmap/PathStepNode.tsx`
- 各ノードのカテゴリ・名前直下に出ていた `<p className="...font-mono...">score {module.finalScore}</p>` を完全削除。
- 推奨度はトポロジカル順とハイライト（active/locked/completed）で伝える方針に統一。

### #7 AnnualMembershipPromo の多重表示抑制
- `frontend/src/utils/annualMembershipPromoStorage.ts`:
  - `isAnnualMembershipPromoOnCooldown()` / `markAnnualMembershipPromoDismissed()` を追加。
  - 「Not now」押下から **24 時間**は両トリガーともプロモを抑止。
- `frontend/src/components/skillmap/VerticalPathContainer.tsx`:
  - 診断直後の自動表示は **同一ブラウザセッション 1 回**のみ（`sessionStorage` にフラグ）。リロードや「Retake」越しでも再表示しない。
  - 学習パス完了時の自動表示はクールダウン中なら抑止。
  - `closeAnnualPromoOnly`（Not now / 背景クリック）で `markAnnualMembershipPromoDismissed` を呼ぶ。

### #8 Forgot Password に Resend ボタンと再入力導線
- `frontend/src/components/auth/LoginScreen.tsx`
- 送信成功後に CTA ラベルを「Resend reset link」に変更。直後 30 秒は「Resend in Ns」で disabled（クールダウン）。
- 「Wrong email? Use a different address」リンクで送信状態をクリアして再入力可能に。
- 送信状態にあっても email 入力フィールドの disabled は解除し、誤入力修正を阻害しない。
- `resetForgotForm()` が `resetSent` / `resetCooldown` / フィードバックメッセージをまとめてクリア。

---

## クロスブラウザ同期: Supabase DB 永続化対応 (2026-05-19)

### 問題の根本原因
全進捗データが `localStorage`（ブラウザ固有）またはバックエンドの揮発性インメモリ（`ConcurrentHashMap`）にしか保存されていなかった。同一ユーザーが別ブラウザ / デバイスからアクセスすると学習パス・完了状態・TODO・Memo がすべて別々の状態になる問題。

### 対応内容

#### Supabase DB テーブル（SQL マイグレーション）
- `supabase/migrations/001_user_progress.sql`（新規）
  - `user_learning_paths`: 学習パス（診断リクエスト + 推奨モジュール一覧）、userId で 1 行。
  - `user_module_progress`: 完了状態（session/lifetime/BBS）、(userId, fingerprint) で 1 行。
  - `user_module_details`: TODO チェック + Memo、(userId, sessionKey, moduleId) で 1 行。
  - 全テーブルに RLS ポリシー（`auth.uid() = user_id`）を設定。

#### フロントエンド変更
- `frontend/src/api/supabaseProgressApi.ts`（新規）
  - 上記 3 テーブルへの load / save 関数を提供。supabase が null なら no-op。
- `frontend/src/hooks/useLearningPath.ts`
  - ハイドレーション時に localStorage キャッシュ → Supabase の順で取得し、新しい方を採用。
  - `persist` / `reset` で Supabase へも write-through（非同期）。
- `frontend/src/components/skillmap/VerticalPathContainer.tsx`
  - `userId` props を追加。
  - 完了状態 (`completedIds`) の初期化時に Supabase からリモートデータをマージ。
  - `completedIds` / `lifetime` 変更時に Supabase へ非同期 write-through。
  - TODO/Memo ロード時に Supabase のリモートデータとバックエンドデータをマージ。
  - `handleToggleTodo` / `handleMemoSave` でバックエンドと Supabase へ並行 write-through。
- `frontend/src/NavigatorApp.tsx`
  - `userId` を `VerticalPathContainer` へ渡す。

#### データ同期フロー（ブラウザ A → ブラウザ B）
1. ブラウザ A で操作 → localStorage 更新 + Supabase write-through。  
2. ブラウザ B で開く → localStorage キャッシュが空 → Supabase から最新データを取得して表示。  
3. バックエンド再起動してもメモ・TODO は Supabase に残る。

#### 注意事項
- Supabase テーブルは `supabase/migrations/001_user_progress.sql` の SQL を Supabase Dashboard > SQL Editor で実行してから使う。
- 進捗の正本は Supabase。バックエンドの `/api/progress/*`（TODO/Memo）は廃止し、モジュール完了フィードバック（ログ）のみ残す。

### 同期アウトボックス + ステータスバナー (2026-05-19)
- **問題**: Supabase 保存失敗を握りつぶすと、ユーザーは進んだつもりで別端末では続きからにならない。
- **`frontend/src/sync/`**（`syncOutbox.ts`, `syncService.ts`, `syncTypes.ts`）
  - 全書き込みを `localStorage` アウトボックスに積み、成功するまで保持。同一キーは最新で上書き。
  - `flushSyncQueue(userId)` で順次 Supabase へ送信（起動時・オンライン復帰時・「Retry」）。
- **`frontend/src/context/SyncContext.tsx`** + **`SyncStatusBanner.tsx`**
  - 状態: `synced` / `syncing` / `pending` / `error` / `offline`。未同期時は画面上部にバナー + Retry。
- **`useLearningPath`**: ハイドレーション前に `flushSyncQueue`。ローカルキャッシュがクラウドより新しければ再送。
- **`VerticalPathContainer`**: `syncModuleProgress` / `syncModuleDetail`（TODO+Memo 同一行 upsert）経由で保存。
- **`App.tsx`**: ログイン後 `SyncProvider` + `SyncStatusBanner` を `NavigatorApp` 外側に配置。

### #9 TODO チェック / Memo 保存失敗のユーザー通知
- `frontend/src/components/skillmap/VerticalPathContainer.tsx`
- `handleToggleTodo` API 失敗時はチェック状態をロールバックしつつトースト「Could not save the checklist update.」（error）を表示。
- `handleMemoSave` API 失敗時はトースト「Could not save your notes.」（error）を表示し、呼び出し元（Drawer）に例外を再 throw。Drawer は `savedMemoRef` を更新せず Unsaved 表示を維持する。
- ※ #2 / #3 と一体実装。

### #10 学習パス生成にタイムアウトと Cancel ボタンを追加
- `frontend/src/api/learningPathApi.ts`
- `fetchLearningPath(request, signal?)` で `AbortSignal` を受け取れるように変更。axios の `CanceledError` を `AbortError` に正規化して上位へ伝搬。
- `frontend/src/hooks/useLearningPath.ts`
- `LEARNING_PATH_TIMEOUT_MS = 25_000` を定義。`generate` 内で `AbortController` を生成し、25 秒経過で自動 abort。
- `cancel()` を新規 export（進行中リクエストを即中断）。`reset()` も内部で `cancel()` を呼ぶ。
- Abort 時は `error` を立てず、初回フェッチでは `AbortError` を throw（NavigatorApp で診断画面に戻す）。
- `frontend/src/components/common/PathGenerationLoadingScreen.tsx`（新規）
- ローディング表示 + 「Cancel」ボタンを最初から表示（Q10 の選択 B）。
- `frontend/src/NavigatorApp.tsx`
- 初回フェッチ中は `PathGenerationLoadingScreen` を表示し、`onCancel` で `useLearningPath.cancel()` を呼ぶ。
- Cancel/Timeout 時はトースト「Path generation canceled. You can try again anytime.」（info）。
- `frontend/src/locales/en.json`
- `errors.pathGenerationCanceled`、`api.requestCanceled` / `api.requestTimedOut` を追加。

### #11 環境変数未設定でホワイトアウトする問題を救済
- `frontend/src/lib/supabase.ts`
- 必須 env が無い場合に throw せず、`supabase` を `null`、`isSupabaseConfigured = false`、`missingSupabaseEnvKeys: string[]` を export。
- `frontend/src/components/common/EnvErrorScreen.tsx`（新規）
- 「Configuration error」と不足キー一覧、`frontend/.env` への設定方法、「Reload」ボタンを表示。
- `frontend/src/App.tsx`
- `isSupabaseConfigured === false` なら `EnvErrorScreen` を return。`AuthProvider` 配下のすべての副作用を未起動にする。
- `frontend/src/context/AuthContext.tsx`
- `supabase === null` の早期 return を追加（auth 関連の effect / signOut を no-op に）。
- `frontend/src/components/auth/LoginScreen.tsx`
- Google / Email / Reset 各ハンドラ冒頭に `if (!supabase) return` ガードを追加。

### #環境変数未設定対応の追加修正（#11 余波）
- `frontend/src/components/profile/ProfileScreen.tsx`
- `handleSaveDisplayName` / `handleSaveEmail` / `handleSavePassword` 冒頭に `if (!supabase) return` ガードを追加（strictNullChecks 下のビルドエラー解消）。

### #18 Sign Up モードのパスワード強度ヒント表示
- `frontend/src/components/auth/LoginScreen.tsx`
- `evaluatePasswordStrength(pw)`: 0–4 のスコア（長さ・大小英字混在・数字・記号）でラベルとヒント生成。
- Sign Up タブ かつ `password.length > 0` のときだけ password 入力下に 4 セグメントバー + ラベル + 改善ヒントを表示。
- 配色: score 0–1 赤, 2 amber, 3 lime, 4 emerald。a11y のため `aria-live="polite"`。

### #17 AppBrandLogo と Pass UI ヘッダーの重なりを解消
- `frontend/src/components/layout/AppBrandLogo.tsx`
- `variant: 'fixed' | 'inline'` を追加。`inline` 時は親レイアウト内のフロー要素として描画。
- `frontend/src/NavigatorApp.tsx`
- Pass 表示中 (`onPathView`) は fixed 配置のロゴをアンマウントし、Pass ヘッダー内に inline ロゴを表示。
- 診断画面（onPathView=false）では従来通り左上 fixed 配置のまま。

### #16 完了済みノード/ドロワーの「タップして取り消し」ボタンの hover を抑制
- `frontend/src/components/skillmap/PathStepNode.tsx`
- 完了状態の完了ボタンを「リング枠 + 半透明 emerald」に変更。`hover:bg-emerald-500` の輝度上げを撤去し、`hover:bg-emerald-600/30` の微変化に留める。
- `frontend/src/components/skillmap/VerticalPathDrawerPanel.tsx`
- Drawer 内 Undo ボタンも同様に抑制スタイルに変更。誤って押せる感を弱め、ラベル「Done — tap to undo」が主役となる UX に。

### #14 完了済みドロワーでも Memo を編集可能に
- `frontend/src/components/skillmap/VerticalPathDrawerPanel.tsx`
- textarea から `disabled={completed}` を撤去。Memo は完了モジュールでも追記可能に。
- Save ボタンも常時表示（dirty 時のみ active）に変更。
- TODO チェックは引き続き完了モジュールではロックする（既達成のため）。

### #13 AssessmentForm 進捗バー初期表示の不整合を解消
- `frontend/src/components/assessment/AssessmentForm.tsx`
- `progressOf` をセグメント未選択時 `{ current: 0, total: 4 }` に変更。
- 進捗バー描画も常に `total` 個の枠を出し、`current=0` で全枠グレー → 「Q1 を回答するとバーが伸びる」予測通りの動作。
- 表示文字列も `{current}/{total}` を「1/?」に統一し、`100%` 表示が出ないよう修正。

### #12 Reset Password 成功後にフィードバック画面を追加
- `frontend/src/components/auth/ResetPasswordScreen.tsx`
- 即時 `window.location.replace('/')` を廃止。`success` ステートで成功ビューに切り替え。
- 「✓ Password updated」見出し、説明（前セッションは sign out 済み）、「Continue to sign in」ボタンを表示。
- ボタン押下時のみ `/` へ遷移。
- supabase が null（env 未設定）の場合は `setHasSession(false)` で早期停止。

