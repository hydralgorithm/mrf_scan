# Streamlit Cloud Entry Point
# This file is the main entry point for Streamlit deployment

import sys
import os
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Set environment for Streamlit
os.environ['STREAMLIT_SERVER_HEADLESS'] = 'true'

# Import and run the streamlit app
from app import streamlit_app
