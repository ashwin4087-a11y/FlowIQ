import functions_framework
import requests
import json
import pandas as pd
import time
from google.cloud import storage
from io import BytesIO
from datetime import datetime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fetch_data():
    url = "http://alivefordie.life/api/vehicle/today?GMT=7"
    retries = 3
    for i in range(retries):
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as http_err:
            logger.error(f"HTTP error occurred: {http_err} - Status Code: {response.status_code}")
            logger.error(f"Response Text: {response.text}")
            if response.status_code == 500 and i < retries - 1:
                logger.info(f"Retrying... ({i+1}/{retries})")
                time.sleep(2)
                continue
            break
        except requests.exceptions.RequestException as req_err:
            logger.error(f"Request error occurred: {req_err}")
            break
    return {"error": "Failed to fetch data", "status_code": 500}

def upload_to_gcs(bucket_name, destination_blob_name, file_bytes):
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_file(file_bytes, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    logger.info(f"Uploaded to {bucket_name}/{destination_blob_name} successfully")

def export_to_gcs_and_get_buffer(forward_lane_list, backward_lane_list):
    df_forward = pd.DataFrame(forward_lane_list)
    df_backward = pd.DataFrame(backward_lane_list)

    df_forward.rename(columns={'yolo_id': "รหัสรถ", 'class': 'ชนิดรถ', 'lane_id': "ลำดับเลน", 'entry_time': "เวลาที่ตรวจจับ", 'video_title': "ชื่อวิดิโอ"}, inplace=True)
    df_backward.rename(columns={'yolo_id': "รหัสรถ", 'class': 'ชนิดรถ', 'lane_id': "ลำดับเลน", 'entry_time': "เวลาที่ตรวจจับ", 'video_title': "ชื่อวิดิโอ"}, inplace=True)

    vehicle_mapping = {"car": "รถยนต์", "truck": "รถบรรทุก"}
    for df in [df_forward, df_backward]:
        if "ชนิดรถ" in df.columns:
            df["ชนิดรถ"] = df["ชนิดรถ"].map(vehicle_mapping).fillna(df["ชนิดรถ"])

    for df in [df_forward, df_backward]:
        if "เวลาที่ตรวจจับ" in df.columns:
            df["เวลาที่ตรวจจับ"] = pd.to_datetime(df["เวลาที่ตรวจจับ"])
            df["วันที่ตรวจจับ"] = df["เวลาที่ตรวจจับ"].dt.date.astype(str)
            df["เวลาที่ตรวจจับ"] = df["เวลาที่ตรวจจับ"].dt.time.astype(str)

    columns_to_remove = ["id", "exit_time", "lane_type"]
    df_forward.drop(columns=[col for col in columns_to_remove if col in df_forward.columns], inplace=True)
    df_backward.drop(columns=[col for col in columns_to_remove if col in df_backward.columns], inplace=True)

    df_forward = df_forward.sort_values(by=["ชื่อวิดิโอ", "รหัสรถ"])
    df_backward = df_backward.sort_values(by=["ชื่อวิดิโอ", "รหัสรถ"])

    desired_columns = ["ชื่อวิดิโอ", "รหัสรถ", "ลำดับเลน", "ชนิดรถ", "เวลาที่ตรวจจับ", "วันที่ตรวจจับ"]
    df_forward = df_forward[desired_columns]
    df_backward = df_backward[desired_columns]

    excel_buffer = BytesIO()
    with pd.ExcelWriter(excel_buffer, engine="xlsxwriter") as writer:
        df_forward.to_excel(writer, sheet_name="Forward Lane", index=False)
        df_backward.to_excel(writer, sheet_name="Backward Lane", index=False)

    excel_buffer.seek(0)
    return excel_buffer

def send_email_with_attachment(excel_buffer, filename):
    gmail_user = 'ballxlenver7@gmail.com'
    app_password = 'MyAppPassword'
    to = 'mandalsunji@gmail.com'
    subject = 'ข้อมูลยานพาหนะประจำวัน'
    body = 'สวัสดีครับ\n\nไฟล์ Excel ข้อมูลยานพาหนะประจำวันถูกแนบมาด้วยในอีเมลนี้\n\n Regards,\nYour Automated System'

    msg = MIMEMultipart()
    msg['From'] = gmail_user
    msg['To'] = to
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    part = MIMEApplication(excel_buffer.getvalue(), Name=filename)
    part['Content-Disposition'] = f'attachment; filename="{filename}"'
    msg.attach(part)

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(gmail_user, app_password)
        server.sendmail(gmail_user, to, msg.as_string())
        logger.info("อีเมลพร้อมไฟล์แนบถูกส่งสำเร็จ!")
    except Exception as e:
        logger.error(f"เกิดข้อผิดพลาดในการส่งอีเมล: {e}")
    finally:
        server.quit()

@functions_framework.http
def vehicle_data_to_gcs_and_email(request):
    """HTTP Cloud Function to fetch vehicle data, upload to GCS, and send email."""
    bucket_name = "dtect-bucket"
    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
    destination_blob_name = f"data/vehicle_data_{current_datetime}.xlsx"
    filename = f"vehicle_data_{current_datetime}.xlsx"

    data_list = fetch_data()

    if "error" in data_list:
        return json.dumps(data_list), 500

    forward_lane_list = []
    backward_lane_list = []

    for data in data_list.get("data", []):
        if data.get("lane_type") == "forward":
            forward_lane_list.append(data)
        elif data.get("lane_type") == "backward":
            backward_lane_list.append(data)

    excel_buffer = export_to_gcs_and_get_buffer(forward_lane_list, backward_lane_list)
    upload_to_gcs(bucket_name, destination_blob_name, excel_buffer)
    excel_buffer.seek(0)
    send_email_with_attachment(excel_buffer, filename)

    return "File uploaded to GCS and emailed successfully", 200