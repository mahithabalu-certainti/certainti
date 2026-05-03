import os
import logging

def get_logger(name):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

    # Ensure log directory exists
    log_dir = os.path.join(os.path.dirname(__file__))  # this is app/logger/
    log_file = os.path.join(log_dir, "import_service.log")
    os.makedirs(log_dir, exist_ok=True)

    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(formatter)

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # Avoid duplicate handlers if logger is reused
    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

    return logger
