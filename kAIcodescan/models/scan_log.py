# -*- coding: utf-8 -*-
from odoo import fields, models


class KAICodeScanLog(models.Model):
    _name = 'kai.codescan.log'
    _description = 'kAI Code Scan Log'
    _order = 'create_date desc'

    name = fields.Char(required=True, string='Barcode')
    user_id = fields.Many2one('res.users', string='Scanned By', readonly=True)
    create_date = fields.Datetime(string='Scanned On', readonly=True)
