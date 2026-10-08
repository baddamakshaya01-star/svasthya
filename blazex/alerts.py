import sqlite3
import os
from datetime import datetime
from twilio.rest import Client
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "alerts.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Table for alert rules
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alert_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ward_name TEXT,
            risk_threshold REAL NOT NULL,
            action_type TEXT NOT NULL,
            phone_number TEXT NOT NULL
        )
    ''')
    
    # Table for alert logs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alert_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            ward_name TEXT,
            alert_type TEXT NOT NULL,
            message TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            status TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize DB on import
init_db()

class AlertEngine:
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = os.getenv('TWILIO_FROM_NUMBER', '+1234567890')
        
        if self.account_sid and self.auth_token:
            self.twilio_client = Client(self.account_sid, self.auth_token)
            logger.info("Twilio client initialized.")
        else:
            self.twilio_client = None
            logger.warning("Twilio credentials not found. Running in MOCK mode (console logging only).")

    def _get_rules_for_ward(self, ward_name: str, risk: float):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Match specific ward or "ALL" wards where risk >= threshold
        cursor.execute('''
            SELECT * FROM alert_rules 
            WHERE (ward_name = ? OR ward_name = 'ALL') AND risk_threshold <= ?
        ''', (ward_name, risk))
        
        rules = cursor.fetchall()
        conn.close()
        return rules

    def _log_alert(self, ward_name: str, alert_type: str, message: str, phone_number: str, status: str):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        now_str = datetime.utcnow().isoformat() + "Z"
        cursor.execute('''
            INSERT INTO alert_logs (timestamp, ward_name, alert_type, message, phone_number, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (now_str, ward_name, alert_type, message, phone_number, status))
        conn.commit()
        conn.close()

    def dispatch_sms(self, to_number: str, message: str):
        if self.twilio_client:
            try:
                msg = self.twilio_client.messages.create(
                    body=message,
                    from_=self.from_number,
                    to=to_number
                )
                return "DELIVERED"
            except Exception as e:
                logger.error(f"Failed to send Twilio message: {e}")
                return f"FAILED: {str(e)}"
        else:
            logger.info(f"[MOCK SMS to {to_number}] {message}")
            return "MOCK_DELIVERED"

    def dispatch_whatsapp(self, to_number: str, message: str):
        if self.twilio_client:
            try:
                from_num = self.from_number.replace("whatsapp:", "").strip()
                to_num = to_number.replace("whatsapp:", "").strip()
                msg = self.twilio_client.messages.create(
                    body=message,
                    from_=f"whatsapp:{from_num}",
                    to=f"whatsapp:{to_num}"
                )
                logger.info(f"Twilio WhatsApp sent. SID: {msg.sid}")
                return "DELIVERED"
            except Exception as e:
                logger.error(f"Failed to send Twilio WhatsApp message: {e}")
                return f"FAILED: {str(e)}"
        else:
            logger.info(f"[MOCK WhatsApp to {to_number}] {message}")
            return "MOCK_DELIVERED"

    def evaluate_and_alert(self, ward_name: str, risk: float):
        rules = self._get_rules_for_ward(ward_name, risk)
        triggered_count = 0
        
        for rule in rules:
            action_type = rule['action_type']
            phone_number = rule['phone_number']
            
            message = (f"ALERT: {ward_name} has crossed risk threshold {rule['risk_threshold']}. "
                       f"Current risk: {risk:.2f}. Recommended action: {action_type}.")
            
            if "whatsapp" in action_type.lower():
                status = self.dispatch_whatsapp(phone_number, message)
            else:
                status = self.dispatch_sms(phone_number, message)
                
            self._log_alert(ward_name, action_type, message, phone_number, status)
            triggered_count += 1
            
        return triggered_count

def get_all_rules():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM alert_rules')
    rules = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rules

def add_rule(ward_name: str, risk_threshold: float, action_type: str, phone_number: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO alert_rules (ward_name, risk_threshold, action_type, phone_number)
        VALUES (?, ?, ?, ?)
    ''', (ward_name, risk_threshold, action_type, phone_number))
    conn.commit()
    rule_id = cursor.lastrowid
    conn.close()
    return rule_id

def delete_rule(rule_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM alert_rules WHERE id = ?', (rule_id,))
    conn.commit()
    conn.close()

def get_alert_logs(limit: int = 50):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM alert_logs ORDER BY id DESC LIMIT ?', (limit,))
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return logs
