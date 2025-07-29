#!/usr/bin/env python3
"""
AKS Dashboard Web Server
=======================

Flask server to serve the AKS HTML dashboard with refresh functionality.
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from flask import Flask, render_template_string, jsonify, request, send_from_directory
from pathlib import Path

# Import the dashboard generator
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from aks_html_dashboard import AKSDashboardGenerator

app = Flask(__name__)

# Global variable to store the dashboard generator
dashboard_generator = None

def load_config():
    """Load Azure configuration"""
    try:
        with open('azure-visualization-config.json', 'r') as f:
            config = json.load(f)
        return config['azure']
    except Exception as e:
        print(f"Error loading config: {e}")
        return None

def initialize_dashboard():
    """Initialize the dashboard generator"""
    global dashboard_generator
    
    azure_config = load_config()
    if not azure_config:
        print("❌ Failed to load Azure configuration")
        return False
    
    try:
        dashboard_generator = AKSDashboardGenerator(
            subscription_id=azure_config['subscription_id'],
            tenant_id=azure_config['tenant_id'],
            client_id=azure_config['client_id'],
            client_secret=azure_config['client_secret']
        )
        return True
    except Exception as e:
        print(f"❌ Failed to initialize dashboard: {e}")
        return False

@app.route('/')
def dashboard():
    """Serve the main dashboard"""
    try:
        # Generate fresh dashboard
        if not dashboard_generator:
            return "Dashboard not initialized", 500
        
        # Get cluster info
        cluster_info = dashboard_generator.get_aks_cluster_info("rg-modular-demo", "transact")
        if not cluster_info:
            return "Failed to get cluster info", 500
        
        # Get resources
        resources = dashboard_generator.get_resource_group_resources("rg-modular-demo")
        
        # Get Kubernetes pods
        kubernetes_pods = dashboard_generator.get_kubernetes_containers("rg-modular-demo", "transact")
        
        # Generate HTML content
        html_content = dashboard_generator._create_html_template(
            cluster_info, {}, resources, kubernetes_pods
        )
        
        return html_content
        
    except Exception as e:
        return f"Error generating dashboard: {e}", 500

@app.route('/refresh-dashboard', methods=['POST'])
def refresh_dashboard():
    """Handle dashboard refresh request"""
    try:
        # Regenerate the dashboard
        if not dashboard_generator:
            return jsonify({"error": "Dashboard not initialized"}), 500
        
        # Get fresh data
        cluster_info = dashboard_generator.get_aks_cluster_info("rg-modular-demo", "transact")
        if not cluster_info:
            return jsonify({"error": "Failed to get cluster info"}), 500
        
        resources = dashboard_generator.get_resource_group_resources("rg-modular-demo")
        kubernetes_pods = dashboard_generator.get_kubernetes_containers("rg-modular-demo", "transact")
        
        # Generate new HTML content
        html_content = dashboard_generator._create_html_template(
            cluster_info, {}, resources, kubernetes_pods
        )
        
        # Write to file
        with open('aks-dashboard.html', 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return jsonify({
            "success": True,
            "message": "Dashboard refreshed successfully",
            "timestamp": datetime.now().isoformat(),
            "pods_count": len(kubernetes_pods),
            "resources_count": len(resources)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/status')
def api_status():
    """API endpoint to get current status"""
    try:
        if not dashboard_generator:
            return jsonify({"error": "Dashboard not initialized"}), 500
        
        cluster_info = dashboard_generator.get_aks_cluster_info("rg-modular-demo", "transact")
        resources = dashboard_generator.get_resource_group_resources("rg-modular-demo")
        kubernetes_pods = dashboard_generator.get_kubernetes_containers("rg-modular-demo", "transact")
        
        return jsonify({
            "cluster": {
                "name": cluster_info.name if cluster_info else None,
                "nodes": cluster_info.node_count if cluster_info else 0,
                "status": cluster_info.power_state if cluster_info else None
            },
            "pods": len(kubernetes_pods),
            "resources": len(resources),
            "last_updated": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/aks-dashboard.html')
def serve_dashboard_file():
    """Serve the static dashboard file"""
    return send_from_directory('.', 'aks-dashboard.html')

def main():
    """Main function"""
    print("🌐 AKS Dashboard Web Server")
    print("=" * 40)
    
    # Initialize dashboard
    if not initialize_dashboard():
        print("❌ Failed to initialize dashboard")
        sys.exit(1)
    
    print("✅ Dashboard initialized successfully")
    print("🌐 Starting web server...")
    print("📱 Dashboard will be available at: http://localhost:5055")
    print("🔄 Refresh API available at: http://localhost:5055/refresh-dashboard")
    print("📊 Status API available at: http://localhost:5055/api/status")
    print("\nPress Ctrl+C to stop the server")
    
    # Start Flask server
    app.run(host='0.0.0.0', port=5055, debug=False)

if __name__ == "__main__":
    main() 