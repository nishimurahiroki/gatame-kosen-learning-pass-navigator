# Gatame Kosen Judo Online: 学習パス・ナビゲーター 仕様書

## 1. システム概要
ユーザーの柔道・柔術経験や現在の課題に基づき、100本以上の動画コンテンツから最適な学習順序（学習パス）を自動生成するWebアプリケーション。

## 2. ターゲット
- 未経験者、柔道/BJJ経験者、熟練者。
- 目標：Annual Membershipの新規獲得、およびBlack Belt System (BBS) へのコンバージョン。

## 3. 主要機能
### 3.1 診断システム（Assessment）
- 属性（未経験/Judo/BJJ）と悩み（課題）を選択。
- 重み付けアルゴリズムにより、パーソナライズされた学習パスを生成。

### 3.2 インタラクティブ技術ツリー（Skill Map）
- React Flowを使用した、技術の繋がりを可視化するマップ。
- 初級・中級・上級のカラーコーディング。
- 自己申告（完了ボタン）による進捗管理。
- インスタ共有用の画像生成（Gatameロゴ、ユーザー名、自作ツリー）。

### 3.3 BBS誘導ロジック
- **未経験者**: 3モジュール完了で BBS 九級を提案。
- **経験者**: 3モジュール完了で BBS 三級を提案。
- **熟練者**: 1モジュール完了で BBS 三級を提案。

### 3.4 学習ストリート（縦 Pass / Black Belt Pass）のテクニック件数
- **1 Pass あたり表示するテクニックモジュールは、BBS マイルストーンを除き最大 8 件**とする（フロント定数 `STREET_PASS_TECHNIQUE_MAX`／`buildLearningStreetPathForPass`）。
- BBS ノードは `streetPathWithBbs.ts` がテクニック列に挿入するため、**画面上のノード総数は「テクニック 8 + BBS」**になりうる。件数カウントと UI 説明では「テクニック 8」と「BBS」を分けて扱う。
- 前提閉包だけをトポロジカルに並べた結果が 8 未満になる場合（例: シード縮小や熟練者向けに `locked` の FOUNDATION をストリートから外した直後）は、**推薦リスト内のスコア降順**で、前提（未経験者では ukemi を含む有効前提／熟練者では §5.7 に沿う前提緩和と同じ FOUNDATION ロック免除）を満たす **未ロック**のモジュールから不足分を追記し、可能な限り 8 件に近づける。
- カタログ上の未ロック・未到達モジュールが 8 件に満たない場合は、その時点で存在する件数が上限となる。

#### 同一 Pass 内の完了と再表示
- **モジュール完了（フィードバック送信）のたびに学習パス API を再取得しない**。Pass 上のテクニック列は、完了操作では組み直さない。
- **完了したテクニックモジュールは、その Pass が終わるまで Pass 上に残す**（完了表示のまま固定）。残り枠（8 − 完了数）だけが未完了候補から選ばれる（`pinnedModuleIds`／`buildLearningStreetPathForPass`）。
- セッション完了 ID は `progressStorage` の診断キー付き localStorage に保存する。**生涯習得（lifetime）へのマージは「次のステージへ」操作時のみ**行い、それまでは `stageMasteredExclude` に含めない（再読み込み後も同一 Pass の完了が Pass から消えないようにする）。

#### 次 Pass（2 回目以降の学習パス生成）
- ユーザーが **「次のステージへ」** を選ぶと、当該 Pass の完了分を lifetime にマージし、セッション完了をクリアしたうえで API を `completedModuleIds`（lifetime）付きで再取得する。
- 新 Pass のテクニック 8 件は、**前ステージで lifetime に入ったモジュールを除いた未完了プール**（`stageMasteredExclude`）から `buildLearningStreetPathForPass`（ピンなし）で選ぶ。
- **BBS マイルストーン**は、未経験／経験者／熟練者ごとの挿入間隔（§3.3）に従い、**まだ合格宣言していない最初の級**（`effectiveBbsSequenceStartIndex`）から表示する。初段まで宣言済みのときは BBS ノードを挿入しない。

## 4. 技術スタック
- **Backend**: Java 21 / Spring Boot 3
- **Frontend**: React / Tailwind CSS / React Flow
- **Database**: PostgreSQL (ユーザー進捗・カスタムツリー保存用)
- **Tool**: Cursor

## 5. スコアリング仕様（Scoring Spec v0）

> このセクションはアルゴリズムの **正式な仕様** であり、`backend/.../LearningPathService.java` および `application.yml` の `gatame.scoring` はこの記述に追従する。係数の数値は v0 の暫定値で、運用データに合わせて調整する。

### 5.1 設計方針
- **入力（診断ウィザード）は維持**：Q1 セグメント、Q2 興味（経験者）／Q2-alt 憧れスタイル（未経験）、Q3 課題、Q5 最終ゴール。
- **計算方式**：観点ごとに 0〜1 に正規化したスコア $s_i$ に重み $w_i$ を掛け、その総和を 0〜100 に丸める **重み和方式**。
- **Q5 はスコアに影響しない**：`finalGoal` は早期 BBS 訴求バナー（`suggestBBSEarly`）と推奨 BBS 級判定にのみ用いる。スコア順位や必修固定には使わない（現状踏襲）。
- **ハード制約**：前提未充足やセグメント別の不適合は `locked: true` でマークし**リスト末尾ブロックに固定**する（API レスポンスの構造・件数・フィールド挙動は現状の `LearningPathService` と互換を保ち、フロント UI には影響を与えない）。

### 5.2 入力（Assessment Input）
| Q | 項目 | 値 | スコアでの役割 |
|---|---|---|---|
| Q1 | `userAttribute` | `NOVICE` / `JUDO_BEGINNER` / `BJJ_BEGINNER` / `JUDO_ADVANCED` / `BJJ_ADVANCED` | 観点 A、ロック判定、重みプロファイル選択 |
| Q2 | `interests`（経験者のみ） | `JUDO` / `BJJ` / `MIX` | 観点 B |
| Q2-alt | `aspirations`（未経験のみ・複数可） | `THROW_FOCUS` / `SUBMIT_FOCUS` / `NEWAZA_BJJ_FOCUS` / `PIN_JUDO_FOCUS` / `CONNECTIVITY_MIX_FOCUS` | 観点 C |
| Q3 | `problems`（経験者のみ・複数可） | A〜G | 観点 D |
| Q5 | `finalGoal` | `課題解決` / `BBS取得` / `技術補完` / `指導参考` | スコア外：`suggestBBSEarly` 判定のみ |
| 進捗 | `completedModuleIds` | モジュール ID 配列 | 観点 F、ロック判定（推薦リストからは除外しない） |

### 5.3 スコア式
モジュール $m$、ユーザー入力 $u$ に対して：

$$
\text{Score}(m,u) = \mathrm{round}\!\left( 100 \cdot \sum_{i \in D(u)} w_i(u) \cdot s_i(m,u) \right)
$$

ただし、

- $D(u)$ はユーザーセグメントに応じて使用する観点集合（§5.4 表）。
- $w_i(u)$ は観点 $i$ の重み。$\sum_i w_i(u) = 1$。
- $s_i(m,u) \in [0,1]$ は観点 $i$ のモジュール別正規化スコア（§5.5）。

ロックされたモジュールにも上式でスコアを計算するが、最終並び順は §5.7 の規則で**末尾ブロック**に固定する。

### 5.4 観点と重み（v0 暫定値）
セグメントごとに使用観点と重みを切り替える。`application.yml` で上書き可能。

| 観点 | 略称 | NOVICE | EXPERIENCED |
|---|---|---:|---:|
| A. `userAttribute` 適合度 | A | 0.30 | 0.15 |
| B. `interest` 適合度（経験者のみ） | B | — | 0.20 |
| C. `aspiration` 適合度（未経験のみ） | C | 0.40 | — |
| D. `problem` 適合度（経験者のみ） | D | — | 0.45 |
| F. 前提充足率 (`completedModuleIds`) | F | 0.30 | 0.20 |
| 合計 | | 1.00 | 1.00 |

> EXPERIENCED は **課題重視** プロファイル：診断で挙げた課題（Q3）が推薦順位を最も大きく動かす。NOVICE は **憧れ重視** プロファイル：未経験者は課題を持たない代わりに、Q2-alt の憧れスタイルが最強の手がかりになる。

> 採用しなかった観点：E `finalGoal` 適合度（v0 では Q5 をスコアに使わない方針）、G 難易度フィット（属性ボーナスと §5.7 のロックに吸収）、H カテゴリ均衡（v0 では入れない／必要なら後段で正則化）。

### 5.5 観点ごとの正規化（0〜1 化）

#### A. `userAttribute` 適合度  $s_A(m,u)$
属性 × モジュール ID の事前テーブル `userAttributeAffinity[segment][moduleId]` を参照し、

$$
s_A = \mathrm{clip}_{[0,1]}\!\left( \frac{\mathrm{aff}(\text{seg}, m)}{\max_{m'} \mathrm{aff}(\text{seg}, m')} \right)
$$

> 旧 `user-attribute-bonuses` の構造をそのまま流用するが、最大値で除して 0〜1 に正規化する。負の値は 0 にクリップ（ロックは別レイヤで扱う）。

#### B. `interest` 適合度（経験者のみ）  $s_B(m,u)$
`interest`（`JUDO` / `BJJ` / `MIX`）に対する `interestAffinity[interest][moduleId]` を最大値で正規化。`MIX` は `TRANSITION` カテゴリに対して 1.0、それ以外は両 (`JUDO`,`BJJ`) のテーブル値を平均してから正規化。

#### C. `aspiration` 適合度（未経験のみ）  $s_C(m,u)$
ユーザーが選んだ憧れスタイル集合 $S$ について、

$$
s_C(m) = \max_{a \in S}\, \mathrm{aff}_C(a, m) \;/\; \max_{m'} \max_{a \in S}\, \mathrm{aff}_C(a, m')
$$

> 「最大」を採るのは、複数選択時に弱い相乗が薄まらないようにするため。

#### D. `problem` 適合度（経験者のみ）  $s_D(m,u)$
ユーザーが選んだ課題集合 $P \subseteq \{A,\dots,G\}$ と、課題 → モジュール対応 `problemTargets[letter]` を用いて、

$$
s_D(m) = \frac{|\{\,p \in P \mid m \in \text{problemTargets}(p)\,\}|}{|P|}
$$

$|P| = 0$ のとき $s_D = 0$。

#### F. 前提充足率  $s_F(m,u)$
$$
s_F(m) = \begin{cases}
  1 & \text{(prerequisites が空)} \\
  \dfrac{|\text{prereq}(m) \cap \text{completed}(u)|}{|\text{prereq}(m)|} & \text{otherwise}
\end{cases}
$$

> 経験者では `ukemi` を `prereq` から除外して計算する（既習を前提とする）。

### 5.6 並び順（Sort Order）
レスポンスは次の順で並べる（**API レスポンス構造は現状維持**：`recommendedModules` に全モジュールを返し、UI 側のソート再計算なしで意図した並びになる）。

#### NOVICE
1. **unlocked** モジュール（completed を含む）→ §5.5 のスコア降順
2. **locked** モジュール（末尾ブロック）→ §5.5 のスコア降順

#### EXPERIENCED / ADVANCED（NOVICE 以外）
1. **unlocked かつ非 TRANSITION** → §5.5 のスコア降順
2. **locked かつ非 TRANSITION** → §5.5 のスコア降順
3. **TRANSITION 3 モジュール**（`shime-waza-transition` / `kansetsu-waza-transition` / `osaekomi-transition`）→ §5.5 のスコア降順
   - locked / unlocked を問わず、**常にリストの末尾 3 ポジションを占める**。
   - 経験者・熟練者の初期学習パスは TRANSITION で締めくくる（古傳柔道の到達点）という設計上の制約。

`completedModuleIds` に含まれるモジュールはレスポンスから除外しない（観点 F の前提充足判定にのみ用いる）。Q5 `finalGoal` は並び順に影響を与えない。

### 5.7 ハード制約（Locked / Excluded）
**API レスポンス構造は現状維持**（フロント UI 不変）。次の規則で `locked` フラグを立て、§5.6 のとおり末尾ブロックへ固定する。**API から完全に除外する**のは現状ロジックと同じく経験者の `ukemi` のみ。

| 条件 | 効果 |
|---|---|
| カテゴリが `TRANSITION` で、前提（`single-technique` + `throwing`）が `completedModuleIds` に揃っていない | `locked = true`（末尾固定） |
| `m == throwing` で、その前提（`fundamental-tachi-waza` 等）が揃っていない | `locked = true` |
| NOVICE × `ukemi` 未完了 のとき：`throwing` および全 `TRANSITION` | `locked = true` |
| 熟練者（`JUDO_ADVANCED` / `BJJ_ADVANCED`） × FOUNDATION カテゴリ（`ukemi` / `solo-newaza-workout` / `osaekomi` / `fundamental-tachi-waza`） | `locked = true`（既習前提のため初期学習パスの上位には出さない） |
| 経験者（NOVICE 以外）× `ukemi` モジュール | レスポンスから完全除外（既存挙動。上の FOUNDATION ロックよりこちらが優先される） |
| `completedModuleIds` に含まれる | `locked` は変えず、観点 F=1 として通常ソートに従う（完了済みは自然に上位から外れる傾向） |

> 経験者の前提充足判定では `ukemi` を `prereq` から除外する（既習を前提）。このときも観点 F の分母は `ukemi` を除いたサイズで計算する。

### 5.8 出力（API Response）
**現行の `AssessmentResponse` 構造を一切変更しない。** 内部の値の作り方だけ差し替える。

- `recommendedModules`：§5.6 の並び順。NOVICE は「unlocked → locked」、それ以外は「unlocked 非 TRANSITION → locked 非 TRANSITION → TRANSITION 3 本」。各要素は現行の `ScoredModule` と同じフィールド（`id` / `name` / `difficulty` / `description` / `videoUrl` / `thumbnailUrl` / `prerequisites` / `finalScore` / `scoreBreakdown` / `locked`）。
  - `finalScore`：§5.3 の式で得られる 0〜100 の整数。
  - `scoreBreakdown`：現行のフィールド（`baseScore` / `userAttributeBonus` / `orientationBonus` / `aspirationBonus` / `problemMatchBonus` / `prerequisitePenalty`）を保持する。**新仕様での意味割り当ては §5.10 を参照**。
  - `locked`：§5.7 の規則で算出。
- `totalModules`：`recommendedModules.size()`（経験者×`ukemi` のみ除外なので、ほぼ常に 17 または 18）。
- `recommendedBbsGrade`：NOVICE は `九級`、それ以外は `三級`（既存）。
- `suggestBBSEarly`：`finalGoal.triggersEarlyBbsSuggestion()` の戻り値（既存）。

### 5.9 設定ファイルとの対応（実装の契約）
- 重み $w_i(u)$ は `gatame.scoring.weights.<segment>.<dimension>` で管理。
- アフィニティテーブル（A/B/C/D の生値）は `gatame.scoring.affinity.<dimension>.*` に集約し、各観点の正規化はサービス層で行う。
- ロック条件は **コード（サービス層）に固定** とし、yml では係数を持たない（誤設定でセーフティが外れることを避けるため）。
- `gatame.layout.attribute-module-pull-bias` などスコア外の設定は触らない。

### 5.10 `ScoreBreakdown` フィールドの新仕様マッピング
`AssessmentResponse` の構造変更を避けるため、既存のフィールド名はそのまま使い、意味だけを差し替える。値は 0〜100 のスケールで $\mathrm{round}(100 \cdot w_i \cdot s_i)$ とする（合計はおおむね `finalScore` に一致）。

| 既存フィールド | 新仕様での意味 |
|---|---|
| `baseScore` | 観点 F（前提充足率）の寄与：$100 \cdot w_F \cdot s_F$ |
| `userAttributeBonus` | 観点 A：$100 \cdot w_A \cdot s_A$ |
| `orientationBonus` | 観点 B（経験者）：$100 \cdot w_B \cdot s_B$／NOVICE は 0 |
| `aspirationBonus` | 観点 C（未経験）：$100 \cdot w_C \cdot s_C$／経験者は 0 |
| `problemMatchBonus` | 観点 D（経験者）：$100 \cdot w_D \cdot s_D$／NOVICE は 0 |
| `prerequisitePenalty` | locked 時のみ負値（表示上の整合のため）。例：locked=true なら -1。unlocked は 0 |

> 実装：`LearningPathService` / `GatameScoringProperties` / `application.yml` に反映済み。`AssessmentResponse` / `ScoreBreakdown` / `ScoredModule` のシグネチャは変更しない。

---

## 6. データ永続化とクロスブラウザ同期

### 6.1 ストレージアーキテクチャ

| データ | 書き込み先 | 読み取り優先順 |
|---|---|---|
| 学習パス（診断結果・推奨一覧） | localStorage + Supabase `user_learning_paths` | Supabase（新しい方） > localStorage |
| 完了状態（session/lifetime/BBS） | localStorage + Supabase `user_module_progress` | Supabase ∪ localStorage（マージ） |
| TODO チェック・Memo | バックエンド IMDB + Supabase `user_module_details` | Supabase ∪ バックエンド（マージ） |

### 6.2 Supabase テーブルのセットアップ

`supabase/migrations/001_user_progress.sql` を Supabase Dashboard の SQL Editor で実行する。

```sql
-- 実行するだけ。CREATE TABLE IF NOT EXISTS / RLS ポリシー込み。
-- supabase/migrations/001_user_progress.sql を参照。
```

### 6.3 同期フロー

1. **ブラウザ A で操作**
   - localStorage に書き込む（即時）
   - Supabase DB へ非同期 write-through（fire-and-forget）
2. **ブラウザ B でアクセス**
   - localStorage キャッシュが空 → Supabase から最新データをロードして表示
   - バックエンドのインメモリ TODO/Memo も Supabase のデータでマージ
3. **Supabase 未設定 / オフライン時**
   - 全関数が no-op となり localStorage のみで動作（従来の挙動に自然フォールバック）

### 6.4 セキュリティ

- 全テーブルに Row Level Security (RLS) を有効化。`auth.uid() = user_id` の条件でユーザーは自分のデータのみ操作可能。
- フロントエンドは Supabase の anon key を使用。データは JWT で認証されたユーザーにのみ返る。

## 7. Render（Docker）でバックエンド API

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
