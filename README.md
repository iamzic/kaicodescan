# kAIcodescan

Odoo Community Edition addon for scanning barcodes using device cameras (webcam/mobile/tablet) without requiring Odoo Enterprise Barcode app.

## Features

- Camera-based barcode scanning from browser (desktop/mobile)
- Supports common 1D/2D formats through browser BarcodeDetector API
- Falls back gracefully when camera/barcode detection is not supported
- Sends scanned values to Odoo backend endpoint for further integrations

## Compatibility

- Odoo **19.0 CE**
- Modern Chromium-based browsers are recommended for best camera/barcode support

## Install (local Odoo)

1. Copy this repository into your Odoo addons path (or add repo path to `addons_path`).
2. Restart Odoo.
3. In Apps, click **Update Apps List**.
4. Search and install **kAIcodescan**.
5. Open **kAIcodescan > Camera Scanner**.

## Notes

- Browser must run on HTTPS for camera access (except localhost).
- iOS/Safari barcode support can vary by version.
- If BarcodeDetector is unavailable, the UI will show a compatibility warning.

## Development

Module technical name: `kAIcodescan`

### File tree

- `kAIcodescan/__manifest__.py`
- `kAIcodescan/controllers/main.py`
- `kAIcodescan/models/scan_log.py`
- `kAIcodescan/static/src/js/camera_scanner.js`
- `kAIcodescan/static/src/xml/camera_scanner.xml`
- `kAIcodescan/views/menu_views.xml`
- `kAIcodescan/views/scanner_template.xml`
- `kAIcodescan/security/ir.model.access.csv`
