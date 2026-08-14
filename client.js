// dsh-font — browser half (client plugin bundle).
//
// Hand-written CJS + ModuleLoader wrapper (zero build steps, the same shape
// as the shipped ui-* bundles): registers one settings row (two selects:
// UI font + code font) into Settings → General, applies the choice by
// overriding the two font CSS variables that the whole web shell derives
// every text token from, and persists in localStorage.
//
// Font variables (verified against the built base.css):
//   :root { --dsw-font-family: ...; --ds-font-family-code: ...; }
// Every --dsw-font-* token (markdown base, headings, table, xs..xl scale)
// references --dsw-font-family; every code surface (code blocks, terminal,
// JSON tree, diff) references --ds-font-family-code. Overriding those two
// variables on `:root, body` restyles the entire GUI with no component
// changes and no bundled font files — the stacks reference fonts already
// installed on the system, so nothing is downloaded and nothing is paid for.
//
// Persistence note: stored in localStorage. DSH's Host settings wire only
// exposes an allowlisted set of namespaces to browser clients, so a
// third-party namespace would answer `settings-not-exposed`; localStorage
// survives reloads on the same origin.
window.__ModuleLoader__.load({
	id: "dsh-font",
	factory: (require) => {
		'use strict';
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _react = require("react");
		let _runtime_client = require("@deepseek-ai/dsh-client-runtime/client");

		//#region dsh-font: definitions
		/** The settings row's locale namespace. */
		const SETTINGS_NS = "settings.font";
		/** localStorage key holding the UI font id. */
		const STORAGE_UI_KEY = "dsh-font:ui";
		/** localStorage key holding the code font id. */
		const STORAGE_CODE_KEY = "dsh-font:code";
		/** The injected <style> element's id (HMR driver inventories it). */
		const STYLE_ID = "dsh-font-style";
		/** Sentinel meaning "no override — follow the built-in font". */
		const DEFAULT_FONT = "default";

		/**
		 * UI font catalog. Every entry pairs a primary family with a
		 * CJK/Latin fallback stack, so mixed-script text stays harmonious no
		 * matter which font is picked:
		 *   - a Chinese font lists a Latin companion last (e.g. SimSun →
		 *     Times New Roman, Microsoft YaHei → Segoe UI);
		 *   - a Latin font lists a Chinese companion last (e.g. Times New
		 *     Roman → SimSun, Calibri → Microsoft YaHei).
		 * Stacks only name system-installed fonts (WPS/Office classics
		 * included); an uninstalled family falls back to the next one.
		 */
		const UI_FONTS = [
			{ id: "default", group: "default", label: "默认", stack: null },
			// ---- Chinese / CJK ----
			{ id: "msyh", group: "zh", label: "微软雅黑 Microsoft YaHei", stack: '"Microsoft YaHei", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Helvetica Neue", Arial, sans-serif' },
			{ id: "noto-sans", group: "zh", label: "思源黑体 Noto Sans SC", stack: '"Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", "PingFang SC", "Segoe UI", Arial, sans-serif' },
			{ id: "harmonyos", group: "zh", label: "鸿蒙黑体 HarmonyOS Sans SC", stack: '"HarmonyOS Sans SC", "HarmonyOS Sans", "Microsoft YaHei", "PingFang SC", sans-serif' },
			{ id: "pingfang", group: "zh", label: "苹方 PingFang SC", stack: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Segoe UI", sans-serif' },
			{ id: "puhuiti", group: "zh", label: "阿里巴巴普惠体 Alibaba PuHuiTi", stack: '"Alibaba PuHuiTi 3.0", "Alibaba PuHuiTi", "PingFang SC", "Microsoft YaHei", sans-serif' },
			{ id: "lxgw", group: "zh", label: "霞鹜文楷 LXGW WenKai", stack: '"LXGW WenKai", "LXGW WenKai Screen", "KaiTi", "STKaiti", serif' },
			{ id: "noto-serif", group: "zh", label: "思源宋体 Noto Serif SC", stack: '"Noto Serif SC", "Source Han Serif SC", "SimSun", "Times New Roman", serif' },
			{ id: "simsun", group: "zh", label: "宋体 SimSun", stack: '"SimSun", "NSimSun", "Times New Roman", serif' },
			{ id: "simhei", group: "zh", label: "黑体 SimHei", stack: '"SimHei", "Microsoft YaHei", "PingFang SC", sans-serif' },
			{ id: "fangsong", group: "zh", label: "仿宋 FangSong", stack: '"FangSong", "FangSong_GB2312", "Times New Roman", serif' },
			{ id: "fangsong-gb2312", group: "zh", label: "仿宋_GB2312", stack: '"FangSong_GB2312", "FangSong", "Times New Roman", serif' },
			{ id: "kaiti", group: "zh", label: "楷体 KaiTi", stack: '"KaiTi", "STKaiti", "KaiTi_GB2312", serif' },
			{ id: "dengxian", group: "zh", label: "等线 DengXian", stack: '"DengXian", "Microsoft YaHei", "PingFang SC", sans-serif' },
			{ id: "stzhongsong", group: "zh", label: "华文中宋 STZhongsong", stack: '"STZhongsong", "SimSun", "Times New Roman", serif' },
			{ id: "stheiti", group: "zh", label: "华文细黑 STHeiti", stack: '"STHeiti", "STXihei", "Microsoft YaHei", "PingFang SC", sans-serif' },
			{ id: "stxingkai", group: "zh", label: "华文行楷 STXingkai", stack: '"STXingkai", "KaiTi", "STKaiti", serif' },
			{ id: "stkaiti", group: "zh", label: "华文楷体 STKaiti", stack: '"STKaiti", "KaiTi", serif' },
			{ id: "fz-xiaobiaosong", group: "zh", label: "方正小标宋简体 FZXiaoBiaoSong", stack: '"FZXiaoBiaoSong-B05S", "STZhongsong", "SimSun", serif' },
			{ id: "fz-fangsong", group: "zh", label: "方正仿宋简体 FZFangSong", stack: '"FZFangSong-Z02S", "FangSong", "FangSong_GB2312", serif' },
			{ id: "fz-shusong", group: "zh", label: "方正书宋简体 FZShuSong", stack: '"FZShuSong-Z01S", "SimSun", "Times New Roman", serif' },
			{ id: "youyuan", group: "zh", label: "幼圆 YouYuan", stack: '"YouYuan", "幼圆", "Microsoft YaHei", "PingFang SC", sans-serif' },
			// ---- Latin / Western ----
			{ id: "times", group: "latin", label: "Times New Roman", stack: '"Times New Roman", "SimSun", serif' },
			{ id: "arial", group: "latin", label: "Arial", stack: '"Arial", "Helvetica Neue", "Microsoft YaHei", sans-serif' },
			{ id: "calibri", group: "latin", label: "Calibri", stack: '"Calibri", "Microsoft YaHei", "PingFang SC", sans-serif' },
			{ id: "cambria", group: "latin", label: "Cambria", stack: '"Cambria", "Georgia", "SimSun", serif' },
			{ id: "georgia", group: "latin", label: "Georgia", stack: '"Georgia", "Times New Roman", "SimSun", serif' },
			{ id: "verdana", group: "latin", label: "Verdana", stack: '"Verdana", "Microsoft YaHei", sans-serif' },
			{ id: "tahoma", group: "latin", label: "Tahoma", stack: '"Tahoma", "Microsoft YaHei", "PingFang SC", sans-serif' },
			{ id: "segoe", group: "latin", label: "Segoe UI", stack: '"Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif' },
			{ id: "helvetica", group: "latin", label: "Helvetica", stack: '"Helvetica Neue", Helvetica, Arial, "Microsoft YaHei", sans-serif' },
			{ id: "garamond", group: "latin", label: "Garamond", stack: '"Garamond", "EB Garamond", "SimSun", serif' },
			{ id: "trebuchet", group: "latin", label: "Trebuchet MS", stack: '"Trebuchet MS", "Microsoft YaHei", sans-serif' }
		];

		/** Code font catalog (monospace surfaces: code blocks, terminal, JSON). */
		const CODE_FONTS = [
			{ id: "default", label: "默认", stack: null },
			{ id: "consolas", label: "Consolas", stack: '"Consolas", "Courier New", monospace' },
			{ id: "cascadia", label: "Cascadia Code", stack: '"Cascadia Code", "Cascadia Mono", Consolas, monospace' },
			{ id: "jetbrains", label: "JetBrains Mono", stack: '"JetBrains Mono", Consolas, "SF Mono", monospace' },
			{ id: "fira", label: "Fira Code", stack: '"Fira Code", Consolas, "SF Mono", monospace' },
			{ id: "source-code-pro", label: "Source Code Pro", stack: '"Source Code Pro", Consolas, monospace' },
			{ id: "menlo", label: "Menlo", stack: 'Menlo, Consolas, "Courier New", monospace' },
			{ id: "monaco", label: "Monaco", stack: 'Monaco, Consolas, "Courier New", monospace' },
			{ id: "courier", label: "Courier New", stack: '"Courier New", Consolas, monospace' },
			{ id: "sarasa-mono", label: "更纱黑体 Sarasa Mono SC", stack: '"Sarasa Mono SC", "Sarasa Mono", "JetBrains Mono", Consolas, monospace' },
			{ id: "sarasa-term", label: "等距更纱黑体 Sarasa Term SC", stack: '"Sarasa Term SC", "Sarasa Term", "Sarasa Mono SC", Consolas, monospace' },
			{ id: "noto-mono", label: "思源等宽 Noto Sans Mono", stack: '"Noto Sans Mono", "Noto Sans Mono CJK SC", Consolas, monospace' }
		];

		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"font.title": "字体",
			"font.ui": "界面字体",
			"font.code": "代码字体",
			"font.default": "默认",
			"font.preview": "预览：设计字体 123 AaBb",
			"font.hint": "只使用本机已安装的字体；未安装的字体会自动回退，不影响显示"
		};

		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"font.title": "Fonts",
			"font.ui": "UI font",
			"font.code": "Code font",
			"font.default": "Default",
			"font.preview": "Preview: 设计字体 123 AaBb",
			"font.hint": "Only fonts installed on this machine are used; missing fonts fall back automatically"
		};
		//#endregion

		//#region dsh-font: persistence
		/** Read a localStorage string value (null on absence or error). */
		function readStorage(key) {
			try {
				const value = window.localStorage.getItem(key);
				return typeof value === "string" ? value : null;
			} catch {
				return null;
			}
		}

		/** Write (or remove with null) a localStorage value. */
		function writeStorage(key, value) {
			try {
				if (value === null) window.localStorage.removeItem(key);
				else window.localStorage.setItem(key, value);
			} catch {
				// storage unavailable / quota — the preference stays process-local
			}
		}

		/** Saved UI font id (validated against the catalog, default when unknown). */
		function readSavedUi() {
			const saved = readStorage(STORAGE_UI_KEY);
			return saved !== null && UI_FONTS.some((f) => f.id === saved) ? saved : DEFAULT_FONT;
		}

		/** Saved code font id (validated against the catalog, default when unknown). */
		function readSavedCode() {
			const saved = readStorage(STORAGE_CODE_KEY);
			return saved !== null && CODE_FONTS.some((f) => f.id === saved) ? saved : DEFAULT_FONT;
		}
		//#endregion

		//#region dsh-font: style application
		/** The injected style element (created lazily, id-keyed for HMR). */
		function getStyleEl() {
			let el = document.getElementById(STYLE_ID);
			if (el === null) {
				el = document.createElement("style");
				el.id = STYLE_ID;
				document.head.appendChild(el);
			}
			return el;
		}

		/**
		 * Apply (or clear) the font override. Both variables live on :root in
		 * the built base.css; re-declaring them on `:root, body` from a later
		 * stylesheet wins the cascade, so the whole GUI restyles instantly.
		 * A cleared rule set (both fonts default) leaves the built-in fonts
		 * untouched.
		 */
		function applyFonts(uiId, codeId) {
			const ui = UI_FONTS.find((f) => f.id === uiId) || null;
			const code = CODE_FONTS.find((f) => f.id === codeId) || null;
			const rules = [];
			if (ui !== null && ui.stack !== null) rules.push(`--dsw-font-family: ${ui.stack};`);
			if (code !== null && code.stack !== null) rules.push(`--ds-font-family-code: ${code.stack};`);
			getStyleEl().textContent = rules.length > 0 ? `:root, body { ${rules.join(" ")} }` : "";
		}

		/** Remove the injected style element (fiber unload). */
		function teardownStyle() {
			document.getElementById(STYLE_ID)?.remove();
		}
		//#endregion

		//#region dsh-font: settings row
		/** Inline styles for the row, token-driven like the rest of the shell. */
		const styles = {
			group: {
				borderBottom: "1px solid var(--dsw-alias-border-l2)",
				display: "flex",
				flexDirection: "column",
				gap: "10px",
				padding: "16px 0"
			},
			title: {
				color: "var(--dsw-alias-label-primary)",
				fontSize: "14px",
				fontWeight: 400,
				lineHeight: "22px"
			},
			row: {
				display: "flex",
				alignItems: "center",
				gap: "10px",
				flexWrap: "wrap"
			},
			label: {
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "13px",
				whiteSpace: "nowrap",
				width: "64px"
			},
			select: {
				flex: 1,
				minWidth: "220px",
				height: "32px",
				padding: "0 10px",
				borderRadius: "8px",
				border: "1px solid var(--dsw-alias-border-l2)",
				background: "var(--dsw-alias-button-elevated-fill)",
				color: "var(--dsw-alias-label-primary)",
				fontSize: "13px",
				font: "inherit",
				boxSizing: "border-box"
			},
			preview: {
				color: "var(--dsw-alias-label-primary)",
				fontSize: "16px",
				lineHeight: "28px",
				padding: "8px 12px",
				borderRadius: "8px",
				background: "var(--dsw-alias-markdown-code-block)",
				border: "1px solid var(--dsw-alias-border-l1)"
			},
			hint: {
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px",
				lineHeight: "18px"
			}
		};

		/**
		 * One labeled select. Options are rendered in their own font family
		 * (when the option has a stack), so the user sees a live specimen of
		 * each candidate; the preview strip below shows the actual result.
		 */
		function FontSelect({ label, value, options, onChange }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				style: styles.row,
				children: [
					(0, react_jsx_runtime.jsx)("span", { style: styles.label, children: label }),
					(0, react_jsx_runtime.jsx)("select", {
						value,
						style: styles.select,
						onChange: (event) => onChange(event.target.value),
						children: options.map((option) => (0, react_jsx_runtime.jsx)("option", {
							value: option.id,
							style: option.stack !== null ? { fontFamily: option.stack } : undefined,
							children: option.label
						}, option.id))
					})
				]
			});
		}

		/**
		 * Font row registered into the Settings → General item slot: UI font
		 * and code font selects plus a live preview strip. Selection applies
		 * instantly and persists to localStorage.
		 */
		function FontRow({ t, setUi, setCode, useStore }) {
			const ui = useStore((s) => s.ui);
			const code = useStore((s) => s.code);
			const uiFont = UI_FONTS.find((f) => f.id === ui) || null;
			const codeFont = CODE_FONTS.find((f) => f.id === code) || null;
			return (0, react_jsx_runtime.jsxs)("div", {
				style: styles.group,
				children: [
					(0, react_jsx_runtime.jsx)("div", { style: styles.title, children: t("font.title") }),
					(0, react_jsx_runtime.jsx)(FontSelect, {
						label: t("font.ui"),
						value: ui,
						options: UI_FONTS,
						onChange: setUi
					}),
					(0, react_jsx_runtime.jsx)(FontSelect, {
						label: t("font.code"),
						value: code,
						options: CODE_FONTS,
						onChange: setCode
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: {
							...styles.preview,
							fontFamily: uiFont !== null && uiFont.stack !== null ? uiFont.stack : undefined
						},
						children: t("font.preview")
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.hint,
						children: t("font.hint")
					})
				]
			});
		}
		//#endregion

		//#region dsh-font: client plugin body
		/**
		 * Required services: slots (the Settings → General item seat) and
		 * locale (row dictionaries). No settings transport is needed —
		 * persistence is localStorage.
		 */
		const inject = [
			"slots",
			"locale"
		];

		/**
		 * Client plugin body: restore the saved fonts, keep the row's store in
		 * sync, apply on every change, and register the row into
		 * Settings → General.
		 * @param ctx - client cordis context.
		 */
		function apply(ctx) {
			// Restore + apply once (before any user interaction).
			let uiId = readSavedUi();
			let codeId = readSavedCode();
			applyFonts(uiId, codeId);
			ctx.effect(() => teardownStyle, "dsh-font: style cleanup");

			ctx.effect(() => ctx.locale.register(SETTINGS_NS, {
				zh,
				en
			}), "dsh-font: settings row dictionaries");

			// Row store mirror; written only by this plugin's apply actions.
			const store = (0, _runtime_client.defineStore)({
				init: () => ({
					ui: DEFAULT_FONT,
					code: DEFAULT_FONT,
					revision: -1
				}),
				actions: {
					sync: (d, ui, code, revision) => {
						if (revision <= d.revision) return;
						d.ui = ui;
						d.code = code;
						d.revision = revision;
					}
				}
			});

			let revision = 0;
			let bound;
			const sync = () => {
				revision += 1;
				bound?.sync(uiId, codeId, revision);
			};

			ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "font",
				order: 40,
				store,
				locale: SETTINGS_NS,
				inject: (actions) => {
					bound = actions;
					sync();
					return {
						setUi: (id) => {
							uiId = UI_FONTS.some((f) => f.id === id) ? id : DEFAULT_FONT;
							writeStorage(STORAGE_UI_KEY, uiId === DEFAULT_FONT ? null : uiId);
							applyFonts(uiId, codeId);
							sync();
						},
						setCode: (id) => {
							codeId = CODE_FONTS.some((f) => f.id === id) ? id : DEFAULT_FONT;
							writeStorage(STORAGE_CODE_KEY, codeId === DEFAULT_FONT ? null : codeId);
							applyFonts(uiId, codeId);
							sync();
						}
					};
				}
			}, FontRow));
		}
		//#endregion

		exports.SETTINGS_NS = SETTINGS_NS;
		exports.UI_FONTS = UI_FONTS;
		exports.CODE_FONTS = CODE_FONTS;
		exports.DEFAULT_FONT = DEFAULT_FONT;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
