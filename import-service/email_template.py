from datetime import datetime

def get_error_email_html(error_message: str, user_name: str, entity_type: str, timestamp: str, document_rid: str) -> str:
    current_year = datetime.now().year
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{
          font-family: "Segoe UI", sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }}
        .container {{
          max-width: 600px;
          margin: 30px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
        }}
        .header {{
          background-color: #d32f2f;
          color: white;
          padding: 16px;
          text-align: center;
          font-size: 20px;
        }}
        .content {{
          padding: 20px;
          color: #333333;
        }}
        .error-box {{
          background-color: #ffebee;
          border-left: 5px solid #d32f2f;
          padding: 16px;
          margin-top: 20px;
          white-space: pre-wrap;
          font-family: monospace;
          color: #b71c1c;
        }}
        .footer {{
          text-align: center;
          color: #999999;
          font-size: 12px;
          margin-top: 30px;
        }}
        .info {{
          margin-top: 10px;
          font-size: 14px;
        }}
        .info b {{
          color: #333;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">⚠️ File Processing Error</div>
        <div class="content">
          <p>Dear {user_name},</p>
          <p>Please find the error details below:</p>
          <div class="info">
            <p><b>Document ID:</b> {document_rid}</p>
            <p><b>Entity Type:</b> {entity_type}</p>
            <p><b>Timestamp:</b> {timestamp}</p>
          </div>
          <div class="error-box">
            {error_message}
          </div>
          <p>If this issue persists, please contact support or try again after verifying your file format and data.</p>
        </div>
        <div class="footer">
          &copy; {current_year} Certainti Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """
