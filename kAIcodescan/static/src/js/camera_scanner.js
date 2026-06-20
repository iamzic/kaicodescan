/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, useRef, useState, onMounted, onWillUnmount } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

class CameraScanner extends Component {
    setup() {
        this.notification = useService("notification");
        this.orm = useService("orm");
        this.videoRef = useRef("video");
        this.canvasRef = useRef("canvas");
        this.state = useState({
            running: false,
            cameraSupported: true,
            detectionMethod: "",   // "native" | "jsqr" | "none"
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
        this.state.cameraSupported = hasCamera;

        if (!hasCamera) {
            this.state.message = "Camera API not available. Please use a modern browser over HTTPS or localhost.";
            return;
        }

        if ("BarcodeDetector" in window) {
            this.state.detectionMethod = "native";
            this.state.message = "Ready (native BarcodeDetector)";
        } else if (typeof window.jsQR === "function") {
            this.state.detectionMethod = "jsqr";
            this.state.message = "Ready (QR code scanning via jsQR — for full 1D barcode support use Chrome 83+/Edge 83+)";
        } else {
            this.state.detectionMethod = "none";
            this.state.message = "No barcode detection available. Please use Chrome 83+ or Edge 83+.";
        }
    }

    async startScan() {
        if (!this.state.cameraSupported || this.state.running || this.state.detectionMethod === "none") {
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
        if (this.state.detectionMethod === "native") {
            await this._runNativeDetector();
        } else if (this.state.detectionMethod === "jsqr") {
            this._runJsQRDetector();
        }
    }

    async _runNativeDetector() {
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

    _runJsQRDetector() {
        const canvas = this.canvasRef.el;
        const ctx = canvas.getContext("2d");

        const tick = () => {
            if (!this.state.running || !this.videoRef.el) {
                return;
            }
            const video = this.videoRef.el;
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });
                    if (code && code.data) {
                        const rawValue = code.data.trim();
                        if (rawValue && rawValue !== this.state.lastBarcode) {
                            this.state.lastBarcode = rawValue;
                            this.state.message = `Scanned: ${rawValue}`;
                            this._sendBarcode(rawValue);
                        }
                    }
                } catch (e) {
                    // Ignore transient errors
                }
            }
            this._timer = window.requestAnimationFrame(tick);
        };

        this._timer = window.requestAnimationFrame(tick);
    }

    async _sendBarcode(barcode) {
        try {
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
            cancelAnimationFrame(this._timer);
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
