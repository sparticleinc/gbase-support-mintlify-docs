import { useState } from "react";

/**
 * 「GBase Knowledge 使い方ガイド」動画（YouTube）の埋め込み。
 *
 *   <KnowledgeVideo chapter="full" />     … 全編＋チャプター一覧（quickstart 用）
 *   <KnowledgeVideo chapter="meeting" />  … 該当チャプターだけを再生（各機能ページ用）
 *
 * - チャプターの時刻はこのファイルにだけ書く。動画を撮り直したら CHAPTERS を直すだけでよい。
 * - Mintlify はエクスポートしたコンポーネントしかスコープに入れないため、
 *   定数はすべてコンポーネント内部に置く（knowledge-chatbot.jsx と同じ制約）。
 * - 各機能ページでは折りたたみ表示にし、開いたときだけ iframe を読み込む
 *   （ページを開いた時点でプレーヤーを読み込まない）。
 */
export const KnowledgeVideo = ({ chapter = "full" }) => {
  const VIDEO_ID = "tDQDIr0WtI4";
  const WATCH_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
  const CHAPTERS = [
    { key: "login", label: "ログイン・ホーム画面の見方", start: 12, end: 62, page: "/knowledge/home" },
    { key: "projects", label: "① ナレッジ集約（プロジェクト作成・資料アップロード・共有）", start: 62, end: 137, page: "/knowledge/projects" },
    { key: "chat", label: "② AIチャット検索（質問・回答・成果物保存）", start: 137, end: 198, page: "/knowledge/agent-search" },
    { key: "deep-research", label: "③ ディープリサーチ（Web調査レポート）", start: 198, end: 231, page: "/knowledge/agent-search" },
    { key: "meeting", label: "④ AI会議ノート（録音・文字起こし・要約テンプレート）", start: 231, end: 341, page: "/knowledge/meeting-notes" },
    { key: "slides", label: "⑤ AIスライド（PowerPoint自動生成）", start: 341, end: 383, page: "/knowledge/ai-slides" },
    { key: "admin", label: "管理者設定（ダッシュボード・メンバー管理・セキュリティ）", start: 383, end: 463, page: "/knowledge/admin" },
  ];

  const [open, setOpen] = useState(false);

  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const duration = (s) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m ? (r ? `${m}分${r}秒` : `${m}分`) : `${r}秒`;
  };
  const embed = (start, end) => {
    const p = new URLSearchParams({ rel: "0", modestbranding: "1" });
    if (start) p.set("start", String(start));
    if (end) p.set("end", String(end));
    if (start || end) p.set("autoplay", "1");
    return `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?${p.toString()}`;
  };

  const frameStyle = {
    position: "relative",
    width: "100%",
    paddingTop: "56.25%",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#0f172a",
  };
  const iframeStyle = { position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 };
  const Player = ({ src, title }) => (
    <div style={frameStyle}>
      <iframe
        src={src}
        title={title}
        style={iframeStyle}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );

  // ── 全編＋チャプター一覧 ──
  if (chapter === "full") {
    return (
      <div style={{ margin: "1.5rem 0" }}>
        <Player src={embed(0, 0)} title="GBase Knowledge 使い方ガイド" />
        <table style={{ marginTop: "1rem", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ whiteSpace: "nowrap" }}>時間</th>
              <th>内容</th>
              <th style={{ whiteSpace: "nowrap" }}>マニュアル</th>
            </tr>
          </thead>
          <tbody>
            {CHAPTERS.map((c) => (
              <tr key={c.key}>
                <td style={{ whiteSpace: "nowrap" }}>
                  <a href={`${WATCH_URL}&t=${c.start}s`} target="_blank" rel="noopener noreferrer">
                    {mmss(c.start)}
                  </a>
                </td>
                <td>{c.label}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <a href={c.page}>手順を読む</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── 各機能ページ：該当チャプターのみ（折りたたみ） ──
  const c = CHAPTERS.find((x) => x.key === chapter);
  if (!c) return null;
  return (
    <details
      onToggle={(e) => setOpen(e.currentTarget.open)}
      style={{
        margin: "1.25rem 0",
        border: "1px solid rgba(100,116,139,.25)",
        borderRadius: "12px",
        padding: "0.75rem 1rem",
      }}
    >
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>
        動画で見る（{duration(c.end - c.start)}）：{c.label}
      </summary>
      <div style={{ marginTop: "0.75rem" }}>
        {open && <Player src={embed(c.start, c.end)} title={c.label} />}
        <p style={{ fontSize: "0.85rem", opacity: 0.75, marginTop: "0.5rem", marginBottom: 0 }}>
          全編（約8分）は{" "}
          <a href={WATCH_URL} target="_blank" rel="noopener noreferrer">YouTube</a>{" "}
          または <a href="/knowledge/quickstart#動画で見る">はじめに</a> でご覧いただけます。
        </p>
      </div>
    </details>
  );
};
