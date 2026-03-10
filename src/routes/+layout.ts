// ここでpage optionsを設定できる。
// SvelteKitの各ページが「いつ・どこでHTMLを生成するか」を制御する設定で、`+page.js`や`+layout.js`からexportして使うもの。主に4つある。
// **結局どうすればいいか、実践的な判断フロー：**
// ほとんどのページは**デフォルトのまま（ssr: true, csr: true）で何も書かなくていい**。これが一番安全で汎用的。適切なレンダリングのために$derivedを活用する。
// 特別なケースだけ変える：
// - 誰が見ても同じ静的ページ → `prerender = true` をつける（SEO記事、LP、ヘルプページなど）
// - JSが一切いらない読み物ページ → `csr = false` も追加すると軽くなる
// - ブラウザ専用ライブラリを使っててSSRでエラーが出る → `ssr = false`（最終手段）
// - アプリ全体をSPAにしたい → root `+layout.js` で `ssr = false`
// 設定は`+layout.js`に書けば配下の全ページに効くし、個別の`+page.js`で上書きもできる。例えばroot layoutで`prerender = true`にしておいて、ダッシュボードだけ`prerender = false`にする、みたいな使い分けができる。
// 何か特定のページで迷ってることがあれば、具体的に聞いてもらえればもっとピンポイントで答えられるよ。
// 詳しくは https://svelte.dev/docs/kit/page-options を参照
