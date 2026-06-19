# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request


class KAICodeScanController(http.Controller):
    @http.route('/kAIcodescan/scan', type='json', auth='user', methods=['POST'], csrf=False)
    def receive_scan(self, barcode=None, **kwargs):
        """Receive scanned barcode value from browser and optionally log it."""
        barcode = barcode or kwargs.get('barcode')
        if not barcode:
            return {"ok": False, "error": "No barcode provided"}

        request.env['kai.codescan.log'].sudo().create({
            'name': barcode,
            'user_id': request.env.user.id,
        })
        return {"ok": True, "barcode": barcode}
