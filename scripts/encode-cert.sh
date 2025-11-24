#!/bin/bash

# Script to encode a .crt file to base64 for use in DB_SSL_CERT environment variable
# Usage: ./scripts/encode-cert.sh path/to/your-cert.crt

if [ -z "$1" ]; then
    echo "Usage: $0 <path-to-cert.crt>"
    echo "Example: $0 ./ca-certificate.crt"
    exit 1
fi

if [ ! -f "$1" ]; then
    echo "Error: File '$1' not found"
    exit 1
fi

echo "Encoding certificate file: $1"
echo ""
echo "Base64 encoded certificate:"
echo "---"
base64 -i "$1" | tr -d '\n'
echo ""
echo "---"
echo ""
echo "Add this to your .env file as:"
echo "DB_SSL_CERT=<paste-the-base64-string-above>"

