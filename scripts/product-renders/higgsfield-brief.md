# Harbor & Pine product renders: brief for a Claude chat session (Higgsfield)

Paste everything below the line into a new Claude chat with the Higgsfield connector on, and attach
the three photos in `scripts/product-renders/reference/` (the original Everyday Bottle renders).

---

I need 12 product images for a fictional store, Harbor & Pine, generated with Higgsfield.

**Use my unlimited free trial, never my credits.** On every generation set `use_unlim: true`. If a
request says the free trial can't cover it, stop and tell me; don't fall back to credits.

**Model and format:** `gpt_image_2_6`, aspect ratio 1:1, one image per request (12 requests).

**Style reference:** the three attached bottle photos. Upload them and pass them as reference images
on every request so all 12 match them exactly: same camera, lighting, backdrop and finish.

**Shared look (add to every prompt):** Photorealistic studio product render, square. One product,
centered, seen straight on from slightly above eye level, filling about 75% of the frame's height.
Seamless pale blue-white backdrop (#F5F9FC), very slightly darker toward the floor. Soft, diffused
light from the top front; a soft, short contact shadow directly under the product. Matte
powder-coated finishes, brushed stainless steel where noted. No text, no logos, no labels, no props,
no hands, no reflections of a room.

**The 12 images** (file name, then what to show; colors are the product's swatch):

1. `bottle-slate` — Everyday Bottle: a 20 oz insulated stainless steel water bottle, rounded
   shoulders, matte powder-coat in slate blue-gray (#6F8396), brushed steel screw cap. Match the
   attached slate photo as closely as possible.
2. `bottle-sand` — the same bottle in sand beige (#D9CBB5).
3. `bottle-sage` — the same bottle in sage green (#A9B8A2).
4. `tumbler-sand` — Travel Tumbler: a 16 oz insulated travel tumbler, slightly tapered (narrower at
   the base), matte powder-coat in sand beige (#D9CBB5), a thin brushed steel rim, and a dark
   charcoal lid with a small sliding sip opening.
5. `tumbler-slate` — the same tumbler in slate blue-gray (#6F8396).
6. `tumbler-pine` — the same tumbler in deep pine green (#3F5A4C).
7. `lid-steel` — Insulated Lid: a replacement bottle cap shown on its own, a short brushed stainless
   steel cylinder with a soft charcoal silicone carry loop arching over the top. Three-quarter view
   so the loop reads clearly.
8. `lid-black` — the same lid in matte black powder-coat (#2B2F33) with a matching black loop.
9. `sling-sand` — Carry Sling: a padded fabric sleeve made of recycled webbing in sand beige
   (#D9CBB5) holding a slate Everyday Bottle (its shoulders and steel cap show above the sleeve),
   with a matching adjustable cross-body strap rising in a loop above it and small brushed steel
   rings where the strap attaches.
10. `sling-slate` — the same sling in slate blue-gray (#6F8396), holding a sand Everyday Bottle.
11. `straw-sage` — Straw Cap: a bottle cap shown on its own, matte sage green (#A9B8A2), with a
    white silicone straw flipped up from a small spout on top. Three-quarter view.
12. `brush-natural` — Bottle Brush Kit: three cleaning brushes standing upright side by side, with
    natural beechwood handles and tan plant-based bristles: a long bottle brush, a short round cap
    brush, and a thin wire straw cleaner.

When they're done, show me all 12 together, then give me a download link for each, named exactly
as above (for example `bottle-slate.png`).

---

## Back in Claude Code

Put the 12 files in `scripts/product-renders/out/` (the names above, any image format) and ask
Claude Code to "swap in the Higgsfield renders". They become 720px JPGs in `src/assets/products/`
with the same names, so nothing else in the store changes.
