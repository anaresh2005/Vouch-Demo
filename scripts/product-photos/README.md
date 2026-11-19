# Product photos

The store's product images (`src/assets/products/*.jpg`) are AI-generated studio photos. The brand
and its products are fictional. They were made with the ElevenLabs connector's image generation
(model `gpt-image-2.5-sunburst`), which returns 1280×720 PNGs; each was center-cropped to a 720px
square JPG with the same name as before, so nothing in the store code depends on how they were made.

## How to make a new one so it matches

1. **First colour of a product:** generate it from text with this shared wording, changing only the
   product description:

   > Studio product render of _[the product, its material and colour]_, minimal premium design,
   > upright and centered, soft even studio lighting, plain very light cool grey seamless background
   > (#F4F7FA), subtle soft contact shadow, square 1:1, high-end e-commerce product photo, no text,
   > no logo, no props

2. **Other colours:** don't generate from scratch. Edit the first image so shape, framing and light
   stay identical:

   > Same exact _[product]_, same shape, _[parts]_, framing, lighting and background, but change the
   > _[product]_'s matte body colour to _[colour name]_ (_[hex]_). Keep _[steel/other parts]_ unchanged.
   > No text, no logo.

3. Crop to the middle square and save as JPG:

   ```bash
   sips -s format jpeg -s formatOptions 90 --cropToHeightWidth 720 720 in.png --out src/assets/products/<name>.jpg
   ```

## What was made

- `bottle-slate` (November 2, 2026), then `bottle-sand` (#D9CBB5) and `bottle-sage` (#A9B8A2) as edits.
- November 18, 2026: `tumbler-sand` (16 oz tapered tumbler, sand #D9CBB5, steel rim, charcoal
  sliding lid), then `tumbler-slate` (#6F8396) and `tumbler-pine` (#3F5A4C); `lid-steel` (steel cap
  with a charcoal silicone loop, three-quarter view), then `lid-black` (#2B2F33); `sling-sand` (sand
  webbing sleeve holding a slate bottle, cross-body strap), then `sling-slate` holding a sand bottle;
  `straw-sage` (sage cap with a white flip-up straw); `brush-natural` (three beechwood brushes).

Cost on ElevenLabs: about 190 credits per text-to-image and 433 per edit.
