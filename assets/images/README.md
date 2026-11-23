# Passmark — Image Assets

## Required Images

Replace the placeholder `<img src>` attributes in `index.html` with real photos.
All images should be high-quality, well-lit, and show **diverse students and healthcare professionals**.

---

## Files Needed

| File | Used In | Size | Description |
|------|---------|------|-------------|
| `hero-students.jpg` | Hero section (right column) | 600×380px | Students studying together — library, desk, books and/or laptops. |
| `lecture-hall.jpg` | Photo Split A | 1200×800px | University lecture hall with students seated, taking notes. |
| `lab-students.jpg` | Photo Split B | 1200×800px | Science lab or medical setting — students in lab coats, microscopes, stethoscopes. |

---

## Recommended Free Sources

All sources below are **free for commercial use, no attribution required** (check individual photo license to confirm):

### Unsplash (unsplash.com)
Best for diverse, modern, realistic stock photography. Download directly.

Suggested searches:
- "students studying library"
- "medical students lecture"
- "nursing students hospital"
- "university exam hall"
- "science laboratory students"

### Pexels (pexels.com)
Same quality as Unsplash. Free commercial use.

Suggested searches:
- "students taking notes"
- "diverse students classroom"
- "medical school students"
- "laboratory science"

### StockSnap (stocksnap.io)
All photos are CC0 — zero restrictions.

---

## Image Specs

- **Format:** JPG (JPEG) preferred for photographs. WebP for production.
- **Resolution:** Minimum 1200×800px for split panels. 600×380px for hero.
- **Orientation:** Landscape for all three images.
- **Optimisation:** Compress using TinyJPG (tinypng.com) before adding to this folder.
- **File size target:** Under 200KB per image after compression.

---

## Production Tip

For the live site, serve images via a CDN (Cloudflare, AWS CloudFront, or Cloudinary).
Use `loading="lazy"` on all images except the hero (which should be `loading="eager"`).

Example using Cloudinary:
```html
<img src="https://res.cloudinary.com/passmark/image/upload/w_1200,q_80/lecture-hall.jpg"
     alt="Students in a university lecture hall"
     loading="lazy">
```
