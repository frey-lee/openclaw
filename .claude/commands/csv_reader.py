#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "pandas",
# ]
# ///

"""
CSV Reader Tool using pandas.

Reads and analyzes CSV files with comprehensive information display.
"""

import pandas as pd
import sys
import os
from pathlib import Path

def main():
    """
    Read and display CSV file using pandas.
    
    Usage: python csv_reader.py <filepath>
    """
    if len(sys.argv) < 2:
        print("Error: Please provide a CSV file path")
        print("Usage: python csv_reader.py <filepath>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    # Convert to Path object for better handling
    csv_path = Path(filepath)
    
    # Check if file exists
    if not csv_path.exists():
        print(f"Error: File not found: {filepath}")
        sys.exit(1)
    
    # Check if file has CSV extension
    if csv_path.suffix.lower() not in ['.csv', '.tsv']:
        print(f"Warning: File doesn't have .csv extension: {filepath}")
    
    try:
        # Read CSV file
        print(f"Reading CSV file: {csv_path.absolute()}")
        print("=" * 50)
        
        df = pd.read_csv(csv_path)
        
        # Display basic info
        print(f"Shape: {df.shape} (rows: {df.shape[0]}, columns: {df.shape[1]})")
        print(f"Columns: {list(df.columns)}")
        print()
        
        # Display first few rows
        print("First 10 rows:")
        print("-" * 30)
        print(df.head(10).to_string(index=True))
        
        if len(df) > 10:
            print(f"\n... and {len(df) - 10} more rows")
        
        # Display data types
        print(f"\nData Types:")
        print("-" * 15)
        for col, dtype in df.dtypes.items():
            print(f"{col}: {dtype}")
        
        # Display basic statistics for numeric columns
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 0:
            print(f"\nNumeric Summary:")
            print("-" * 20)
            print(df[numeric_cols].describe().round(2).to_string())
        
        # Display memory usage
        print(f"\nMemory Usage: {df.memory_usage(deep=True).sum() / 1024:.1f} KB")
        
    except FileNotFoundError:
        print(f"Error: Could not find file: {filepath}")
        sys.exit(1)
    except pd.errors.EmptyDataError:
        print(f"Error: The file appears to be empty: {filepath}")
        sys.exit(1)
    except pd.errors.ParserError as e:
        print(f"Error: Could not parse CSV file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()