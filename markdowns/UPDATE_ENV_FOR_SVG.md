# How to Use SVG Logo in .env

## Quick Fix: Comment Out PNG Logo

In your `.env` file, comment out or remove the `GLOBAL_COMPANY_LOGO_SVG` line with the PNG:

```bash
# GLOBAL_COMPANY_LOGO_SVG="<img src='data:image/png;base64,..."
```

The code will automatically use `public/img/capco-logo.svg` instead!

## Option 2: Replace PNG with SVG Content

If you want to set the SVG in `.env` instead, here's how:

1. Read the SVG file content:
```bash
cat public/img/capco-logo.svg
```

2. Copy the entire SVG content (without the XML declaration)

3. In your `.env`, replace the PNG line with:
```bash
GLOBAL_COMPANY_LOGO_SVG="<svg id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" width=\"336.4\" height=\"61.3\" version=\"1.1\" viewBox=\"0 0 336.4 61.3\">..."
```

**Note:** Make sure to escape all quotes with `\"` and keep it on one line.

## Recommended: Use File-Based Approach

The easiest approach is to **comment out** `GLOBAL_COMPANY_LOGO_SVG` in `.env` and let the code automatically load from `public/img/capco-logo.svg`. This way:
- ✅ SVG file is version controlled
- ✅ Easy to update
- ✅ No need to escape quotes
- ✅ Works automatically

The updated code now detects if your env var has a PNG/image and will prefer the SVG file automatically!

