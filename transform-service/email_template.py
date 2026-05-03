from datetime import datetime
from typing import Dict, Any
from pyspark.sql import DataFrame
from logger.logger import get_logger
logger = get_logger("email_tempalte")
def get_import_completion_email_html(event: Dict[str, Any]) -> str:
    """
    Generate HTML email for data import completion notification using event dictionary
    
    Args:
        event: Dictionary containing all required fields:
            - user_name: str - Recipient name
            - file_name: str - Imported file name
            - fiscal_year: str - Fiscal year
            - account_name: str - Account name
            - entity: str - Entity type
            - status: str - Overall status
            - status_desc: str - Status description
            - total_records: str - Total records processed
            - staging_status: str - Staging status
            - staging_status_desc: str - Staging status description
            - entity_load_status: str - Entity load status
            - records_success: str - Successful records count
            - records_warning: str - Warning records count
            - records_failed: str - Failed records count
            - error_descriptions: DataFrame - Spark DataFrame with error counts
            - imported_by: str - Who performed the import
            - imported_on: str - Import timestamp
            - time_taken: str - Processing time in seconds
            - import_type: str - Import type (Manual/Auto)
            - document_rid: str - Document reference ID
    
    Returns:
        str: Formatted HTML email content
    """
    current_year = datetime.now().year
    
    # Validate required fields
    required_fields = [
        'user_name', 'file_name', 'fiscal_year', 'account_name',
        'entity', 'status', 'status_desc', 'total_records',
        'staging_status', 'staging_status_desc', 'entity_load_status',
        'records_success', 'records_warning', 'records_failed',
        'error_descriptions', 'imported_by', 'imported_on',
        'time_taken', 'import_type', 'document_rid'
    ]
    
    for field in required_fields:
        if field not in event:
            raise ValueError(f"Missing required field in event: {field}")

    # Process error summary DataFrame
    error_rows = ""
    error_counts = {}
    total_error_count = 0
    try:
        # Handle case where error_descriptions is a Spark DataFrame
        if isinstance(event['error_descriptions'], DataFrame):
            error_counts = {}
            for row in event['error_descriptions'].collect():
                error_description = row["error_descriptions"]
                count = row["No_of_records"]
                error_counts[error_description] = count
                total_error_count += count
            
            # Generate numbered error rows
            for i, (error, count) in enumerate(error_counts.items(), 1):
                error_rows += f"""
                    <tr>
                        <td>{i}. {error}</td>
                        <td style="text-align: right">{count}</td>
                    </tr>
                """
            
            # Add multiple errors summary row if needed
            if len(error_counts) > 1:
                error_rows += f"""
                    <tr>
                        <td>Multiple Errors</td>
                        <td style="text-align: right">{total_error_count}</td>
                    </tr>
                """
        else:
            # Handle case where error information is provided in another format
            error_rows = f"""
                <tr>
                    <td>Error occurred during processing</td>
                    <td style="text-align: right">{event['records_failed']}</td>
                </tr>
            """
    except Exception as e:
        logger.error(f"Error processing error information: {str(e)}")
        error_rows = f"""
            <tr>
                <td>Error details unavailable</td>
                <td style="text-align: right">-</td>
            </tr>
        """
    
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
          max-width: 650px;
          margin: 30px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
        }}
        .header {{
          background-color: #2e7d32;
          color: white;
          padding: 16px;
          text-align: center;
          font-size: 20px;
          margin-bottom: 20px;
        }}
        .content {{
          padding: 5px;
          color: #333333;
          line-height: 1.6;
        }}
        .section-title {{
          font-size: 16px;
          font-weight: 600;
          color: #2e7d32;
          margin: 25px 0 10px 0;
          padding-bottom: 5px;
          border-bottom: 1px solid #e0e0e0;
        }}
        .info-table {{
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0 25px 0;
          font-size: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }}
        .info-table th {{
          background-color: #f5f9fc;
          text-align: left;
          padding: 12px 15px;
          border: 1px solid #e0e0e0;
          font-weight: 600;
        }}
        .info-table td {{
          padding: 12px 15px;
          border: 1px solid #e0e0e0;
        }}
        .highlight-table {{
          background-color: #f8f9fa;
        }}
        .status-success {{
          color: #2e7d32;
          font-weight: bold;
        }}
        .status-error {{
          color: #d32f2f;
          font-weight: bold;
        }}
        .footer {{
          text-align: center;
          color: #999999;
          font-size: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }}
        .attachment-note {{
          background-color: #f5f9fc;
          padding: 12px 15px;
          border-radius: 4px;
          margin: 20px 0;
          font-size: 14px;
          border-left: 4px solid #2e7d32;
        }}
        .error-table {{
          background-color: #fff8f8;
        }}
        .summary-table {{
          background-color: #f8fafc;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">✓ Data Ingestion Completed</div>
        <div class="content">
          <p>Dear {event['user_name']},</p>
          <p>This is to inform you that the data ingestion process for your file has been completed.</p>
          
          <div class="attachment-note">
            <strong>Note:</strong> Find attached the data sheet with status and error details updated for each row in the input.
          </div>

          <div class="section-title">File Information</div>
          <table class="info-table highlight-table">
            <tr>
              <th width="30%">File</th>
              <td>{event['file_name']}</td>
            </tr>
            <tr>
              <th>Fiscal Year</th>
              <td>FY {event['fiscal_year']}</td>
            </tr>
            <tr>
              <th>Account</th>
              <td>{event['account_name']}</td>
            </tr>
            <tr>
              <th>Entity</th>
              <td>{event['entity']}</td>
            </tr>
          </table>

          <div class="section-title">Status Information</div>
          <table class="info-table highlight-table">
            <tr>
              <th width="30%">Status</th>
              <td class="status-{event['status'].lower()}">{event['status']}</td>
            </tr>
            <tr>
              <th>Status Description</th>
              <td>{event['status_desc']}</td>
            </tr>
            <tr>
              <th>Total Records</th>
              <td>{event['total_records']}</td>
            </tr>
            <tr>
              <th>Staging Status</th>
              <td class="status-{event['staging_status'].lower()}">{event['staging_status']}</td>
            </tr>
            <tr>
              <th>Staging Status Description</th>
              <td>{event['staging_status_desc']}</td>
            </tr>
            <tr>
              <th>Entity Load Status</th>
              <td class="status-{event['entity_load_status'].lower()}">{event['entity_load_status']}</td>
            </tr>
          </table>

          <div class="section-title">Entity Load Status Summary</div>
          <table class="info-table summary-table">
            <tr>
              <th width="40%">No of Records Loaded Successfully</th>
              <td>{event['records_success']}</td>
            </tr>
            <tr>
              <th>No of Records Loaded With Warning</th>
              <td>{event['records_warning']}</td>
            </tr>
            <tr>
              <th>No of Records Failed During Load</th>
              <td>{event['entity_load_error_records_count']}</td>
            </tr>
            <tr>
              <th>No of Records Failed</th>
              <td>{event['records_failed']}</td>
            </tr>
          </table>

          <div class="section-title">Error Details</div>
          <table class="info-table error-table">
            <thead>
              <tr>
                <th width="70%">Error Description</th>
                <th width="30%">No of Records Failed</th>
              </tr>
            </thead>
            <tbody>
              {error_rows}
            </tbody>
          </table>

          <div style="margin-top: 20px;"></div>
          <table class="info-table summary-table">
            <tr>
              <th width="30%">Imported By</th>
              <td>{event['imported_by']}</td>
            </tr>
            <tr>
              <th>Imported On</th>
              <td>{event['imported_on']}</td>
            </tr>
            <tr>
              <th>Time Taken</th>
              <td>{event['time_taken']} secs</td>
            </tr>
            <tr>
              <th>Import Type</th>
              <td>{event['import_type']}</td>
            </tr>
          </table>

          <p style="margin-top: 25px;"><strong>Document ID:</strong> {event['document_rid']}</p>
          
          <p>If you have any queries, please contact our support team.</p>
          <p>Best regards,<br>Think R&D 365 Platform</p>
        </div>
        <div class="footer">
          &copy; {current_year} Think R&D 365 Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """