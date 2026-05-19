# Gatame 学習パス・ナビゲーター — 重み付けアルゴリズム設計図（Ver.2.0）

## 総合スコア

全モジュールに対し次式でスコアを算出し、降順で学習パスを生成する。

$$
\text{Total Score} = (\text{Base Weight}) + (\text{User Attribute Bonus}) + (\text{Problem Matching Bonus})
$$

---

## 1. ベース重み付け（Base Weight）

技術的難易度と依存関係に基づく階層別の基礎スコア。

| 基礎点 | カテゴリ | 該当モジュール（例） |
|--------|-----------|----------------------|
| 100 | 基礎 | Ukemi, Solo Newaza Workout, OSAEKOMI, Fundamental Tachi Waza |
| 90 | 組手 | KUMIKATA（AI YOTSU / KENKA YOTSU）, Break the Gripping（AI YOTSU / KENKA YOTSU） |
| 80 | 単体技術 | KANSETSU WAZA, SHIME, Throwing |
| 60 | 攻防 | Guard pass（top / bottom）, On the Turtle, Escape from OSAEKOMI |
| 20 | 遷移・上級 | SHIME WAZA Transition, KANSETSU WAZA Transition, OSAEKOMI Transition |

実装上は `modules.json` の `category` と `WeightConstants` の係数で対応付ける。

---

## 2. ユーザー属性による加点・補正（User Attribute Bonus）

| 対象モジュール | 未経験者 | 柔道経験者 | BJJ経験者 | 備考 |
|----------------|----------|------------|-----------|------|
| Ukemi | +500 | −50 | −50 | 未経験者では Ukemi を最優先 |
| Solo Newaza Workout | +100 | +200 | −20 | 柔道家は寝技単独動作を優先 |
| Fundamental Tachi Waza | +100 | −50 | +200 | BJJ 家は立ち技基礎を優先 |
| OSAEKOMI | +50 | −50 | +150 | BJJ 家は抑込概念を優先 |
| Throwing | −500（※） | 0 | +50 | （※）後述の未経験者ガード |

**熟練者（ADVANCED）**: 上表の属性補正は適用しない（0 とみなす）。

### 未経験者の Throwing 制限（※）

- Ukemi が「完了」になるまで、**Throwing** および **各 Transition モジュール**はレスポンスから除外する（非表示）。
- Ukemi 完了後は Throwing に −500 の属性補正が適用され、優先度は低くなるが表示される。
- Ukemi 完了後の **Transition** は常にレスポンスに含めるが、後述の「単体技＋Throwing」前提を満たさない場合は **ロック** と **スコアペナルティ**によりパス末尾側に配置される。

完了状態は API の `completedModuleIds`（モジュール ID のリスト）で渡す。初回診断時は空リストとみなす。

---

## 3. 課題マッチングによる加点（Problem Matching Bonus）

アンケートで選んだ課題 ID と `modules.json` の `relatedProblems` が一致するごとに **+300** 点を加算する。スコアが高いモジュールほどパス上位に来るため、課題に直結するコンテンツが自然に「初級コンテンツの直後」付近まで繰り上がる。

| 課題の内容（ユーザー向け文言の例） | 関連付けるモジュール |
|-----------------------------------|----------------------|
| 立ち技から一気に極めたい | SHIME WAZA Transition, KANSETSU WAZA Transition |
| 投げた後、逃がさず抑えたい | OSAEKOMI Transition |
| 亀（四つん這い）の相手を崩したい | On the Turtle |
| ガードの上からパスしたい | Guard pass on the top |
| 下からスイープ・極めを狙いたい | Guard pass on the bottom, KANSETSU WAZA, SHIME |
| 組手争いで負けたくない | Break the Gripping（AI YOTSU / KENKA YOTSU） |
| とにかく抑え込まれたくない | Escape from OSAEKOMI |

課題 ID と `relatedProblems` の対応はフロントの課題マスタと `modules.json` で一致させる。

---

## 4. 技術的依存関係（Transition：単体技 ＋ Throwing）

すべての **Transition** は、対応する **単体技モジュール** と **Throwing** の両方を前提とする（いずれも `completedModuleIds` で完了済みであること）。

| 上級モジュール（Transition） | 必須完了モジュール（Prerequisites） |
|------------------------------|--------------------------------------|
| SHIME WAZA Transition | SHIME（`shime-waza`） **および** Throwing（`throwing`） |
| KANSETSU WAZA Transition | KANSETSU WAZA（`kansetsu-waza`） **および** Throwing |
| OSAEKOMI Transition | OSAEKOMI（`osaekomi`） **および** Throwing |

### 4.1 ロックとスコア（LearningPathService）

- `modules.json` の `prerequisites` に上表と同一の **単体技 ID ＋ `throwing`** を記述する。
- 前提のいずれかが未完了の Transition は **`locked: true`** として返し、`scoreBreakdown.transitionPrerequisitePenalty` に負の値を入れて **合計スコアを下げる**。
- **Throwing が未完了**のときは、さらに追加ペナルティを加算し、単体技のみ完了している状態よりも **パス順で後方**になるようにする。
- ソート順では **未ロック（アンロック）を先**、ロック済みを後に並べる。ロック群内では `finalScore` 降順、さらに課題マッチングボーナスでタイブレークする。

未経験者かつ Ukemi 未完了の間は、§2 のとおり Transition をレスポンスから除外する（Ukemi 完了後は本節のロック／ペナルティが適用される）。

---

## 5. ソート順

1. **ロック状態**の昇順（`locked == false` を先、`true` を後）。
2. **finalScore** の降順。
3. 同点のときは **Problem Matching Bonus** の降順（課題一致モジュールを前に）。

---

## 6. 関連ファイル

- `backend/src/main/resources/modules.json` — モジュール定義・タグ・`relatedProblems`・`prerequisites`
- `backend/src/main/java/com/gatame/learningpass/constants/WeightConstants.java` — 係数
- `backend/src/main/java/com/gatame/learningpass/service/LearningPathService.java` — スコアリング・ゲート・ソート
