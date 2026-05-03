from datetime import datetime
from typing import List

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

from datetime import datetime

def get_column_validation_error_email_html(error_message: str, user_name: str, entity_type: str, timestamp: str, document_rid: str, failed_row_count) -> str:
    from datetime import datetime

    current_year = datetime.now().year
    # Ensure each validation rule is on a separate line
    formatted_error_message = "<br>".join(
        [line.strip() for line in error_message.split(";") if line.strip()]
    )

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
          font-family: monospace;
          color: #b71c1c;
          white-space: normal;
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
        <div class="header">⚠️ Column Validation Error</div>
        <div class="content">
          <p>Dear {user_name},</p>
          <p>We encountered a column-level validation issue while processing your uploaded document. Please review the following information for details:</p>
          <div class="info">
            <p><b>Document ID:</b> {document_rid}</p>
            <p><b>Entity Type:</b> {entity_type}</p>
            <p><b>Timestamp:</b> {timestamp}</p>
            <p><b>Count of Failed Rows:</b> {failed_row_count}</p>
          </div>
          <div class="error-box">
            {formatted_error_message}
          </div>
          <p>Each column in the file must meet specific formatting and data type requirements. Please verify your file's structure and content, correct the highlighted issues, and re-upload the document.</p>
          <p>If you need assistance, feel free to contact our support team.</p>
        </div>
        <div class="footer">
          &copy; {current_year} Certainti Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """


from datetime import datetime

def get_required_columns_missing_email_html(error_message: str, user_name: str, entity_type: str, timestamp: str, document_rid: str, required_columns: str) -> str:
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
        <div class="header">⚠️ Required Columns Missing</div>
        <div class="content">
          <p>Dear {user_name},</p>
          <p>We encountered a validation issue while processing your uploaded document due to missing required columns. Please review the details below:</p>
          <div class="info">
            <p><b>Document ID:</b> {document_rid}</p>
            <p><b>Entity Type:</b> {entity_type}</p>
            <p><b>Timestamp:</b> {timestamp}</p>
            <p><b>Required Columns:</b> {required_columns}</p>
          </div>
          <div class="error-box">
            {error_message}
          </div>
          <p>Please ensure all mandatory columns are included in your file before re-uploading. Refer to the documentation or reach out to support for the correct file structure.</p>
        </div>
        <div class="footer">
          &copy; {current_year} Certainti Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

from datetime import datetime

def get_missing_columns_email_html(
    error_message: str,
    user_name: str,
    entity_type: str,
    timestamp: str,
    document_rid: str,
    missing_columns: List[str]
) -> str:
    current_year = datetime.now().year
    missing_columns_html = "".join(f"<li>{col}</li>" for col in missing_columns)

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
        ul {{
          margin-top: 10px;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">⚠️ Required Columns Missing</div>
        <div class="content">
          <p>Dear {user_name},</p>
          <p>We encountered a validation issue while processing your uploaded document due to the absence of required columns. Please find the details below:</p>
          <div class="info">
            <p><b>Document ID:</b> {document_rid}</p>
            <p><b>Entity Type:</b> {entity_type}</p>
            <p><b>Timestamp:</b> {timestamp}</p>
            <p><b>Missing Columns:</b> {missing_columns}</p>
            <ul>
              {missing_columns_html}
            </ul>
          </div>
          <div class="error-box">
            {error_message}
          </div>
          <p>Please ensure all mandatory columns are included in your file before re-uploading. If you need assistance, feel free to contact our support team.</p>
        </div>
        <div class="footer">
          &copy; {current_year} Certainti Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """
def get_column_validation_warning_email_html(
    warning_message: str,
    user_name: str,
    entity_type: str,
    timestamp: str,
    document_rid: str,
    affected_row_count
) -> str:
    from datetime import datetime

    current_year = datetime.now().year

    # Normalize input to a list of warning lines
    if isinstance(warning_message, list):
        warning_lines = [line.strip() for line in warning_message if line.strip()]
    else:
        warning_lines = [line.strip() for line in warning_message.split(";") if line.strip()]

    # Deduplicate the warnings
    unique_warnings = sorted(set(warning_lines))

    # Format for HTML
    formatted_warning_message = "<br>".join(unique_warnings)

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{
          font-family: "Segoe UI", sans-serif;
          background-color: #f9f9f9;
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
          background-color: #f9a825;
          color: white;
          padding: 16px;
          text-align: center;
          font-size: 20px;
        }}
        .content {{
          padding: 20px;
          color: #333333;
        }}
        .warning-box {{
          background-color: #fffde7;
          border-left: 5px solid #fbc02d;
          padding: 16px;
          margin-top: 20px;
          font-family: monospace;
          color: #795548;
          white-space: normal;
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
        <div class="header">⚠️ Column Validation Warning</div>
        <div class="content">
          <p>Dear {user_name},</p>
          <p>While processing your uploaded <strong>{entity_type}</strong> document, we identified some warnings related to column-level validation. The affected rows have been skipped, and the rest of the file has been processed successfully.</p>
          <div class="info">
            <p><b>Document ID:</b> {document_rid}</p>
            <p><b>Entity Type:</b> {entity_type}</p>
            <p><b>Timestamp:</b> {timestamp}</p>
            <p><b>Count of Affected Rows:</b> {affected_row_count}</p>
          </div>
          <div class="warning-box">
            {formatted_warning_message}
          </div>
          <p>Please review the warnings above, correct them in your original file, and re-upload if necessary to ensure all data is processed.</p>
          <p>If you need any help, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          &copy; {current_year} Certainti Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """


