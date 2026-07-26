import { Link, useParams, Navigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Icon from "../components/Icon";
import { TOOLS, CATEGORIES, getTool } from "../toolsConfig";

export default function ToolPage() {
  const { toolKey } = useParams();
  const tool = getTool(toolKey);

  if (!tool) return <Navigate to="/" replace />;

  const ActivePanel = tool.component;

  return (
    <div className="page">
      <SiteHeader />

      <div className="tool-layout">
        <nav className="tool-rail" aria-label="All PDF tools">
          {CATEGORIES.map((category) => (
            <div className="tool-rail-group" key={category}>
              <span className="tool-rail-label">{category}</span>
              {TOOLS.filter((t) => t.category === category).map((t) => (
                <Link
                  key={t.key}
                  to={`/tool/${t.key}`}
                  className={`tool-rail-item ${t.key === tool.key ? "active" : ""}`}
                  style={{ "--tool-color": t.color }}
                >
                  <span className="tool-rail-icon">
                    <Icon name={t.icon} size={18} />
                  </span>
                  <span className="tool-rail-text">
                    <span className="tool-rail-title">{t.label}</span>
                    <span className="tool-rail-short">{t.short}</span>
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <main className="tool-main">
          <div className="tool-crumb">
            <Link to="/">All tools</Link>
            <span aria-hidden="true">/</span>
            <span>{tool.label}</span>
          </div>
          <ActivePanel key={tool.key} />
        </main>
      </div>

      <footer className="site-footer">
        Files are deleted from the server immediately after processing.
      </footer>
    </div>
  );
}
