# -*- coding: utf-8 -*-
{
    "name": "kAIcodescan",
    "summary": "Scan barcodes using device camera in Odoo CE",
    "version": "19.0.1.0.0",
    "category": "Inventory",
    "author": "iamzic",
    "website": "https://github.com/iamzic/kaicodescan",
    "license": "LGPL-3",
    "depends": ["base", "web"],
    "data": [
        "security/ir.model.access.csv",
        "views/menu_views.xml",
        "views/scanner_template.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "kAIcodescan/static/src/lib/jsQR.js",
            "kAIcodescan/static/src/js/camera_scanner.js",
            "kAIcodescan/static/src/xml/camera_scanner.xml",
        ],
    },
    "application": True,
    "installable": True,
}
