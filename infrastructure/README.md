# AKS HTML Dashboard

This folder contains the AKS (Azure Kubernetes Service) HTML dashboard for visualizing container data.

## Files

- **`aks-html-dashboard.py`** - Python script that generates the interactive HTML dashboard
- **`aks-dashboard.html`** - The generated HTML dashboard file
- **`azure-visualization-config.json`** - Azure credentials and configuration
- **`README.md`** - This documentation file

## Usage

### Generate the Dashboard

```bash
python3 aks-html-dashboard.py
```

This will:
1. Connect to your Azure AKS cluster
2. Retrieve cluster information and resources
3. Generate an interactive HTML dashboard
4. Save it as `aks-dashboard.html`

### View the Dashboard

Open `aks-dashboard.html` in your web browser to view the interactive dashboard.

## Features

- **Real-time AKS Data**: Shows actual cluster information from Azure
- **Kubernetes Containers**: Displays pods and containers (with fallback to mock data)
- **Azure Resources**: Lists all resources in the resource group
- **Interactive Design**: Professional, responsive HTML dashboard
- **Auto-refresh**: Updates every 5 minutes
- **Compact Layout**: Optimized for better screen fit

## Requirements

- Python 3.6+
- Azure SDK for Python
- Valid Azure credentials in `azure-visualization-config.json`

## Configuration

Ensure your `azure-visualization-config.json` contains valid Azure credentials:

```json
{
  "azure": {
    "subscription_id": "your-subscription-id",
    "tenant_id": "your-tenant-id", 
    "client_id": "your-client-id",
    "client_secret": "your-client-secret"
  }
}
```

## Dashboard Sections

1. **Header**: Title and refresh button
2. **Metrics**: Key cluster statistics (nodes, pods, containers, status)
3. **Cluster Information**: Detailed cluster configuration
4. **Kubernetes Pods**: Container information organized by namespace
5. **Azure Resources**: All Azure resources in the resource group 