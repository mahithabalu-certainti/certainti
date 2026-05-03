from datetime import datetime

def get_success_email_html(user_name: str, entity_type: str, timestamp: str, document_rid: str) -> str:
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
          background-color: #388e3c;
          color: white;
          padding: 16px;
          text-align: center;
          font-size: 20px;
        }}
        .content {{
          padding: 20px;
          color: #333333;
        }}
        .success-box {{
          background-color: #e8f5e9;
          border-left: 5px solid #388e3c;
          padding: 16px;
          margin-top: 20px;
          font-family: monospace;
          color: #1b5e20;
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
        <div class="header">✅ File Processed Successfully</div>
        <div class="content">
          <p>Dear {user_name},</p>
          <p>Your document has been successfully processed. Please find the processing details below:</p>
          <div class="info">
            <p><b>Document ID:</b> {document_rid}</p>
            <p><b>Entity Type:</b> {entity_type}</p>
            <p><b>Timestamp:</b> {timestamp}</p>
          </div>
          <div class="success-box">
            The document was processed without any errors.
          </div>
          <p>You can now proceed to review the extracted data or continue with your workflow.</p>
        </div>
        <div class="footer">
          &copy; {current_year} Certainti Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """
