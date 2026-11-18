# Product renders

The store's product images (`src/assets/products/*.jpg`) are 3D renders made in code with three.js,
so every product and color comes from the same studio setup. The models, materials, lighting and
camera are all in `render.html`.

To change or re-render them:

```sh
cd scripts/product-renders
npm install --no-save three@0.170.0
node server.mjs
```

Open http://localhost:8093, run `await renderAll()` in the console (or `renderAll(['bottle-sage'])`
for some), and the 1440px PNGs land in `out/`. Convert each to a 720px JPG in `src/assets/products/`:

```sh
for f in out/*.png; do sips -Z 720 -s format jpeg -s formatOptions 88 "$f" --out "../../src/assets/products/$(basename "$f" .png).jpg"; done
```
