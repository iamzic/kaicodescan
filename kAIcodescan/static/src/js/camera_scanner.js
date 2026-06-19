/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, useRef, useState, onMounted, onWillUnmount } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

class CameraScanner extends Component {
    setup() {
        this.notification = useService("notification");
        this.orm = useService("orm");
        this.videoRef = useRef("video");
        this.state = useState({
            running: false,
            supported: true,
            message: "Ready",
            lastBarcode: "",
        });
        this._stream = null;
        this._timer = null;

        onMounted(() => this._checkSupport());
        onWillUnmount(() => this._cleanup());
    }

    _checkSupport() {
        const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const hasDetector = "BarcodeDetector" in window;
        this.state.supported = hasCamera && hasDetector;
        if (!this.state.supported) {
            this.state.message = "Your browser does not fully support camera barcode scanning.";
        }
    }

    async startScan() {
        if (!this.state.supported || this.state.running) {
            return;
        }

        try {
            this._stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false,
            });
            const video = this.videoRef.el;
            video.srcObject = this._stream;
            await video.play();
            this.state.running = true;
            this.state.message = "Scanning...";
            await this._runDetectorLoop();
        } catch (error) {
            this.state.message = "Cannot access camera. Check browser permissions.";
            this.notification.add(this.state.message, { type: "danger" });
            this._cleanup();
        }
    }

    async _runDetectorLoop() {
        const detector = new window.BarcodeDetector({
            formats: [
                "qr_code", "code_128", "ean_13", "ean_8", "upc_a", "upc_e", "code_39", "code_93",
            ],
        });

        const tick = async () => {
            if (!this.state.running || !this.videoRef.el) {
                return;
            }
            try {
                const barcodes = await detector.detect(this.videoRef.el);
                if (barcodes && barcodes.length) {
                    const rawValue = (barcodes[0].rawValue || "").trim();
                    if (rawValue && rawValue !== this.state.lastBarcode) {
                        this.state.lastBarcode = rawValue;
                        this.state.message = `Scanned: ${rawValue}`;
                        await this._sendBarcode(rawValue);
                    }
                }
            } catch (e) {
                // Ignore transient detector errors
            }
            this._timer = window.setTimeout(tick, 250);
        };

        tick();
    }

    async _sendBarcode(barcode) {
        try {
            const result = await this.orm.call("ir.http", "session_info", []);
            if (!result) {
                // Keep lightweight call to ensure session alive
            }
            await fetch("/kAIcodescan/scan", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    params: { barcode },
                }),
            });
            this.notification.add(`Barcode scanned: ${barcode}`, { type: "success" });
        } catch (error) {
            this.notification.add("Failed to send barcode to server", { type: "danger" });
        }
    }

    stopScan() {
        this._cleanup();
        this.state.message = "Stopped";
    }

    _cleanup() {
        this.state.running = false;
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        if (this._stream) {
            for (const track of this._stream.getTracks()) {
                track.stop();
            }
            this._stream = null;
        }
        if (this.videoRef.el) {
            this.videoRef.el.srcObject = null;
        }
    }
}

CameraScanner.template = "kAIcodescan.CameraScanner";

registry.category("actions").add("kAIcodescan.camera_scanner", CameraScanner);
