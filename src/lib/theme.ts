export const THEME_STORAGE_KEY = "portfolio-theme";
export const THEME_SOURCE_KEY = "portfolio-theme-source";

/**
 * Runs before paint. An explicit Button Bar choice wins; otherwise the
 * attribute stays unset and CSS `prefers-color-scheme` paints the page.
 */
export const themeInitScript = `(function(){try{var source=localStorage.getItem(${JSON.stringify(THEME_SOURCE_KEY)});var stored=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var root=document.documentElement;if(source==="user"&&(stored==="light"||stored==="dark")){root.setAttribute("data-theme",stored);root.style.colorScheme=stored;}else{root.removeAttribute("data-theme");root.style.removeProperty("color-scheme");}}catch(e){}})();`;
