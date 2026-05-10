# car-ai-game

スマホ縦画面向けの 5 車線 2D カー回避ゲームです。

## 現在の機能
- 5車線の回避ゲーム（左右ボタン / スワイプ / ←→キー）
- 敵車3種類（sedan / truck / sport）
- コイン出現・取得
- スキン購入 / 選択
- `localStorage` 保存（score / best / coins / owned skins / active skin）
- GitHub Pages向け相対パス `./styles.css` `./game.js`

## トラブルシュート
- 画面に `LOAD ERROR` が表示された場合は、`game.js` の読み込み失敗です。ページ再読み込み後も続く場合、デプロイ済みファイルに `index.html`, `game.js`, `styles.css` が揃っているか確認してください。
