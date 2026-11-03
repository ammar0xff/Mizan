# Mizan ERP — Hardware Integration & Automation Workers

**Target Audience:** Hardware integration specialists, IoT engineers, backend systems architects.  
**Platform Version:** Mizan 3.0 (ESC/POS + WebUSB + ZKTeco + Async Automation Engine)

---

## 1. POS Hardware & Thermal Printing

Mizan provides deep native support for point-of-sale peripherals without requiring third-party print spooler daemons.

```
+--------------------+        Browser Print / WebUSB        +---------------------+
| Mizan POS Cashier  | -----------------------------------> | Thermal Receipt     |
| (React Frontend)   |                                      | Printer (80mm/58mm) |
+--------------------+                                      +---------------------+
          |                                                            |
          | HTTP Direct Socket                                         | RJ11 / RJ12
          v                                                            v
+--------------------+            Raw ESC/POS Bytes         +---------------------+
| Mizan Backend      | -----------------------------------> | Cash Drawer Solenoid|
| (pos_hardware mod) |             Port 9100 TCP            | (Cash Drawer Kick)  |
+--------------------+                                      +---------------------+
```

### Supported Paper Profiles:
1. **80mm Standard Thermal Paper:** Width 72mm printable area (48 or 42 characters per line). Full layout with two-column line items, tax breakdown, and centered QR code.
2. **58mm Compact Mobile Paper:** Width 48mm printable area (32 characters per line). Compact typography, single-line item truncation, and high-density QR code.

---

## 2. ESC/POS Command Generation & Cash Drawer Pulse

When printing via raw TCP/IP (port 9100) or USB serial, Mizan constructs standard ESC/POS byte sequences:

```python
# backend/app/modules/pos_hardware/escpos.py
class EscPosBuilder:
    INIT = b"\x1b\x40"              # ESC @: Initialize printer
    ALIGN_LEFT = b"\x1b\x61\x00"    # ESC a 0
    ALIGN_CENTER = b"\x1b\x61\x01"  # ESC a 1
    ALIGN_RIGHT = b"\x1b\x61\x02"   # ESC a 2
    BOLD_ON = b"\x1b\x45\x01"       # ESC E 1
    BOLD_OFF = b"\x1b\x45\x00"      # ESC E 0
    FEED_AND_CUT = b"\x1d\x56\x42\x00" # GS V 66 0: Partial Cut
    
    # Cash Drawer Solenoid Kick (Pin 2, 50ms ON, 500ms OFF)
    CASH_DRAWER_PULSE = b"\x1b\x70\x00\x19\xfa"

    @classmethod
    def generate_receipt_bytes(cls, invoice_data: dict, config: dict) -> bytes:
        buf = bytearray()
        buf.extend(cls.INIT)

        # Cash drawer kick
        if config.get("cash_drawer_pulse"):
            buf.extend(cls.CASH_DRAWER_PULSE)

        # Header
        buf.extend(cls.ALIGN_CENTER)
        buf.extend(cls.BOLD_ON)
        buf.extend(config.get("header_note", "ميزان ERP").encode("cp864", errors="replace"))
        buf.extend(b"\n")
        buf.extend(cls.BOLD_OFF)
        
        # ... format lines, amounts, and ZATCA QR ...

        buf.extend(b"\n\n\n")
        buf.extend(cls.FEED_AND_CUT)
        return bytes(buf)
```

---

## 3. ZATCA & Tax Authority TLV QR Code

Saudi ZATCA (Phase 1 & 2) and Egyptian Tax Authority regulations require thermal receipts to print an electronic QR code containing a **Tag-Length-Value (TLV)** byte structure encoded in Base64:

| Tag | Field Description | Example |
| :---: | :--- | :--- |
| `1` | Seller's Legal Name | `شركة الميزان للتجارة` |
| `2` | VAT Registration Number | `310123456700003` |
| `3` | Invoice Timestamp (ISO 8601 UTC) | `2026-11-03T20:00:00Z` |
| `4` | Invoice Total (with VAT) | `150.00` |
| `5` | VAT Amount | `19.57` |

### Python TLV Generator:
```python
def generate_zatca_tlv_qr(
    seller_name: str,
    vat_number: str,
    timestamp_iso: str,
    total_amount: str,
    vat_amount: str,
) -> str:
    def _encode_tag(tag: int, value: str) -> bytes:
        raw_val = value.encode("utf-8")
        return bytes([tag, len(raw_val)]) + raw_val

    tlv_bytes = (
        _encode_tag(1, seller_name)
        + _encode_tag(2, vat_number)
        + _encode_tag(3, timestamp_iso)
        + _encode_tag(4, total_amount)
        + _encode_tag(5, vat_amount)
    )
    return base64.b64encode(tlv_bytes).decode("ascii")
```

---

## 4. Hardware Barcode Scanner Listener (`useBarcodeScanner`)

Commercial USB and Bluetooth barcode scanners act as Human Interface Devices (HID), simulating keyboard keystrokes at superhuman velocity (10–30ms per character), terminated by an `Enter` key.

Mizan's `useBarcodeScanner` hook (`frontend/src/features/pos/hooks/useBarcodeScanner.ts`) intercepts these scans globally while preventing interference with normal human typing:

```tsx
import { useBarcodeScanner } from "@/features/pos/hooks/useBarcodeScanner";

export function PosScreen() {
  const handleProductScanned = async (barcode: string) => {
    console.log("Scanned barcode:", barcode);
    await addProductToCartByBarcode(barcode);
  };

  useBarcodeScanner({
    onScan: handleProductScanned,
    minChars: 3,         // Reject spurious short keystrokes
    maxIntervalMs: 50,   // If > 50ms between keys, treat as human typing
    playSound: true,     // Triggers synthesized audio beep on valid scan
    enabled: true,
  });

  return <div>{/* POS Cashier Layout */}</div>;
}
```

---

## 5. Automation Worker & Background Cron Engine

The `automation_worker` module (`backend/app/modules/automation_worker/`) provides asynchronous, non-blocking background task scheduling for repetitive enterprise operations.

```
+-------------------------------------------------------------------+
|               Automation Worker Cron Engine                       |
+-------------------------------------------------------------------+
       |                       |                       |
       v                       v                       v
[ Job: Stock Low-Alert ] [ Job: ZK Attendance ] [ Job: Auto DB Backup ]
  Every 15 minutes         Every 5 minutes         Every night at 02:00
  "*/15 * * * *"           "*/5 * * * *"           "0 2 * * *"
       |                       |                       |
       +-----------------------+-----------------------+
                               |
                               v
               [ Audit Log in PostgreSQL ]
               - job_id, execution_time, status, error_detail
```

### Defining a Custom Background Job:
```python
# backend/app/modules/automation_worker/jobs.py
from app.modules.automation_worker.registry import register_cron_job

@register_cron_job(
    job_id="inventory_reorder_check",
    name="فحص نواقص المخزون وتوليد مسودات التوريد",
    schedule="0 */2 * * *",  # Every 2 hours
)
async def check_inventory_levels(db_session_factory):
    async with db_session_factory() as db:
        # Check products where current_stock <= reorder_level
        # Generate draft purchase orders for suppliers
        pass
```

---

## 6. ZKTeco Biometric Device Synchronization (`zk_attendance`)

Mizan integrates directly with ZKTeco standalone fingerprint, facial recognition, and RFID time-attendance terminals over standard TCP/IP (port 4370):

```
+------------------------+       TCP Port 4370       +------------------------+
| ZKTeco Terminal        | <=======================> | Mizan zk_attendance    |
| (e.g. 192.168.1.201)   |       pyzk Protocol       | (Backend Worker)       |
+------------------------+                           +------------------------+
            |                                                     |
            | Punches (User ID, Timestamp, State)                 v
            +---------------------------------------> [ HrBiometricPunch ]
                                                                  |
                                                                  v
                                                        [ Daily Attendance ]
```

### Manual CLI Sync:
```bash
python scripts/zk_sync.py --host 192.168.1.201 --port 4370 --tenant german-egyptian
```

### Automated Ingestion:
1. In the Mizan App Launcher, open **"حضور وبصمة ZKTeco" (`zk_attendance`)**.
2. Click **"إضافة جهاز جديد" (Add Terminal)** -> Enter IP `192.168.1.201` and Port `4370`.
3. Set Sync Interval to **"كل 5 دقائق" (Every 5 mins)**.
4. The backend automation worker queries logs, matches the device `user_id` with `HrEmployee.biometric_id`, and creates attendance records in real time.
