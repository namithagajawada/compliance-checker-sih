import cv2
import pytesseract
import json
import google.generativeai as genai
from datetime import datetime
import os

# Point to tesseract.exe location
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ---------- Gemini Setup ----------
genai.configure(api_key="AIzaSyBG5GuH5jaKoYmHBFkzTDwOSdQ-QTpHJfM")
model = genai.GenerativeModel("gemini-1.5-flash")

# ---------- Camera Setup ----------
CAM_INDEX = 0   # change to 0 or 1 depending on your camera
cap = cv2.VideoCapture(CAM_INDEX)

# Get current script folder
script_dir = os.path.dirname(os.path.abspath(__file__))

print("Press 's' to capture & extract, 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Draw red bounding boxes using Tesseract detection
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    data = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT)

    for i in range(len(data['text'])):
        if int(data['conf'][i]) > 50:
            x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)

    cv2.imshow("Camera Feed - OCR Boxes", frame)

    key = cv2.waitKey(1) & 0xFF

    if key == ord('s'):
        # Save snapshot in same folder as script
        snap_name = f"snapshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        snap_path = os.path.join(script_dir, snap_name)
        cv2.imwrite(snap_path, frame)
        print(f"✅ Snapshot saved: {snap_path}")

        # Send to Gemini for structured extraction
        prompt = """
        Extract the following fields from this product label and return JSON only:
        - net_quantity
        - manufacturer_packer_importer
        - common_name
        - manufacture_month_year
        - expiry_date
        - mrp
        - consumer_care_contact
        - dimensions_sizes
        - principal_display_panel
        """

        response = model.generate_content([prompt, {"mime_type": "image/jpeg", "data": open(snap_path, "rb").read()}])

        try:
            product_data = json.loads(response.text)
        except:
            print("⚠️ API did not return valid JSON. Raw response:")
            print(response.text)
            product_data = {"raw_response": response.text}

        # Save JSON result in same folder as script
        output_path = os.path.join(script_dir, "product_output.json")
        output = {
            "timestamp": datetime.now().isoformat(),
            "product": product_data
        }

        with open(output_path, "a", encoding="utf-8") as f:
            json.dump(output, f, indent=4, ensure_ascii=False)
            f.write(",\n")

        print(f"✅ Extracted Product JSON saved in {output_path}")

    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
