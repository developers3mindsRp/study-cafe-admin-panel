/** Load third-party scripts for oEmbed blockquotes (Twitter, Instagram, etc.). */

type ScriptLoader = () => void;

const scriptLoaders = new Map<string, Promise<void>>();

function loadScriptOnce(src: string, id: string): Promise<void> {
  const existing = scriptLoaders.get(id);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const found = document.getElementById(id) as HTMLScriptElement | null;
    if (found) {
      if (found.dataset.loaded === "1") {
        resolve();
        return;
      }
      found.addEventListener("load", () => resolve(), { once: true });
      found.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.charset = "utf-8";
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });

  scriptLoaders.set(id, promise);
  return promise;
}

const twitterHydrate: ScriptLoader = () => {
  const twttr = (window as Window & { twttr?: { widgets?: { load: (el?: Element) => void } } }).twttr;
  twttr?.widgets?.load();
};

const instagramHydrate: ScriptLoader = () => {
  const instgrm = (window as Window & { instgrm?: { Embeds?: { process: (el?: Element) => void } } })
    .instgrm;
  instgrm?.Embeds?.process();
};

/** After raw embed HTML is in the DOM, ask platforms to render widgets. */
export async function hydrateSocialEmbeds(root: HTMLElement): Promise<void> {
  const jobs: Promise<void>[] = [];

  if (root.querySelector("blockquote.twitter-tweet")) {
    jobs.push(
      loadScriptOnce("https://platform.twitter.com/widgets.js", "twitter-wjs").then(twitterHydrate),
    );
  }

  if (root.querySelector("blockquote.instagram-media")) {
    jobs.push(
      loadScriptOnce("https://www.instagram.com/embed.js", "instagram-embed-js").then(instagramHydrate),
    );
  }

  await Promise.all(jobs);
}
