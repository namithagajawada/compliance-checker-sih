import cv2
import pytesseract
import re
import json
from datetime import datetime

# Path to Tesseract executable (Windows only)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# cap = cv2.VideoCapture(0) webcam
cap = cv2.VideoCapture(0) 


print("Press 's' to capture product label, 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    cv2.imshow("Camera Feed", frame)
    key = cv2.waitKey(1) & 0xFF

    if key == ord('s'):
        # Convert to grayscale for better OCR
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        extracted_text = pytesseract.image_to_string(gray)

        # Split into clean lines
        lines = [line.strip() for line in extracted_text.split("\n") if line.strip()]
        text_block = " ".join(lines)

        # Data schema
        product_data = {
            "net_quantity": "",
            "manufacturer_packer_importer": "",
            "common_name": "",
            "manufacture_month_year": "",
            "expiry_date": "",   # NEW FIELD
            "mrp": "",
            "consumer_care_contact": "",
            "dimensions_sizes": "",
            "principal_display_panel": ""
        }

        # 🔹 Net quantity
        qty_match = re.search(r"Net\s?Qty[: ]*(\d+\s*(ml|g|kg|L|pcs))", text_block, re.IGNORECASE)
        if qty_match:
            product_data["net_quantity"] = qty_match.group(1)
        else:
            # fallback: general weight/volume
            qty_match = re.search(r"(\d+\s*(ml|g|kg|L|pcs))", text_block, re.IGNORECASE)
            if qty_match:
                product_data["net_quantity"] = qty_match.group(1)

        # 🔹 Manufacturer / Packer / Importer
        for line in lines:
            if any(k in line.lower() for k in ["manufacturer", "manufactured by", "mfd", "packer", "importer"]):
                product_data["manufacturer_packer_importer"] = line.split(":")[-1].strip()

        # 🔹 Common / generic name (first meaningful line)
        if lines:
            product_data["common_name"] = lines[0]

        # 🔹 Manufacture date (MFD/PKD)
        mfd_match = re.search(r"(MFD|PKD|Mfg)[^\d]*(\d{2}[/-]\d{4})", text_block, re.IGNORECASE)
        if mfd_match:
            product_data["manufacture_month_year"] = mfd_match.group(2)

        # 🔹 Expiry / Best Before date
        expiry_match = re.search(
            r"(Exp|Expiry Date|Best Before|Use By)[^\d]*(\d{2}[/-]\d{4}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s?\d{4})",
            text_block, re.IGNORECASE
        )
        if expiry_match:
            product_data["expiry_date"] = expiry_match.group(2)

        # 🔹 MRP (₹, Rs, with /- optional)
        mrp_match = re.search(r"MRP[^\d]*(₹\s?\d+|Rs\.?\s?\d+)(?:/-)?", text_block, re.IGNORECASE)
        if mrp_match:
            product_data["mrp"] = mrp_match.group(1)

        # 🔹 Consumer care contact
        email_match = re.search(r"\S+@\S+", text_block)
        phone_match = re.search(r"\+?\d{10,15}", text_block)
        contacts = []
        if email_match:
            contacts.append(email_match.group())
        if phone_match:
            contacts.append(phone_match.group())
        if contacts:
            product_data["consumer_care_contact"] = ", ".join(contacts)

        # 🔹 Dimensions / Sizes
        dim_match = re.search(r"(\d+\s?(cm|mm|inch|in|x))", text_block, re.IGNORECASE)
        if dim_match:
            product_data["dimensions_sizes"] = dim_match.group(1)

        # 🔹 Principal display panel (first 5 OCR lines)
        product_data["principal_display_panel"] = " ".join(lines[:5])

        # Save JSON
        output = {
            "timestamp": datetime.now().isoformat(),
            "product": product_data
        }

        with open("product_output.json", "a", encoding="utf-8") as f:
            json.dump(output, f, indent=4, ensure_ascii=False)
            f.write(",\n")

        print("✅ Extracted product data:", product_data)

    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
