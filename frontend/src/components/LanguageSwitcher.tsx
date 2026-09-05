import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const buttonStyle = (lang: string): React.CSSProperties => ({
    backgroundColor: i18n.language === lang ? "var(--color-primary)" : "transparent",
    color: i18n.language === lang ? "white" : "var(--color-text-muted)",
    border: "1px solid var(--color-border)",
    borderRadius: "6px",
    padding: "0.3rem 0.7rem",
    fontSize: "0.8rem",
    fontWeight: 500,
  });

  return (
    <div style={{ display: "flex", gap: "0.4rem" }}>
      <button style={buttonStyle("it")} onClick={() => i18n.changeLanguage("it")}>
        IT
      </button>
      <button style={buttonStyle("en")} onClick={() => i18n.changeLanguage("en")}>
        EN
      </button>
    </div>
  );
}