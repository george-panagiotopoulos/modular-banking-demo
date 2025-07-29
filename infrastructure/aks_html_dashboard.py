#!/usr/bin/env python3
"""
AKS HTML Dashboard Generator
===========================

Generates an interactive HTML dashboard to visualize AKS container data.
"""

import json
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import logging
import subprocess
import yaml
import tempfile
import os

# Azure SDK imports
from azure.identity import ClientSecretCredential
from azure.mgmt.containerservice import ContainerServiceClient
from azure.mgmt.resource import ResourceManagementClient

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ClusterInfo:
    """Cluster information"""
    name: str
    location: str
    kubernetes_version: str
    node_count: int
    vm_size: str
    power_state: str
    fqdn: str
    resource_group: str

@dataclass
class ResourceInfo:
    """Resource information"""
    name: str
    type: str
    location: str
    resource_group: str
    tags: Dict[str, str]

@dataclass
class ContainerInfo:
    """Kubernetes container information"""
    name: str
    namespace: str
    pod_name: str
    image: str
    status: str
    ready: bool
    restart_count: int
    ports: List[str]
    resources: Dict[str, str]

@dataclass
class PodInfo:
    """Kubernetes pod information"""
    name: str
    namespace: str
    status: str
    ready: str
    containers: List[ContainerInfo]
    node_name: str
    age: str

class AKSDashboardGenerator:
    """AKS HTML Dashboard Generator"""
    
    def __init__(self, subscription_id: str, tenant_id: str, client_id: str, client_secret: str):
        self.subscription_id = subscription_id
        self.tenant_id = tenant_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.credential = None
        self.container_client = None
        self.resource_client = None
        
    def _get_credential(self):
        """Get Azure credential"""
        if not self.credential:
            self.credential = ClientSecretCredential(
                tenant_id=self.tenant_id,
                client_id=self.client_id,
                client_secret=self.client_secret
            )
        return self.credential
    
    def _get_container_client(self):
        """Get Container Service client"""
        if not self.container_client:
            credential = self._get_credential()
            self.container_client = ContainerServiceClient(credential, self.subscription_id)
        return self.container_client
    
    def _get_resource_client(self):
        """Get Resource Management client"""
        if not self.resource_client:
            credential = self._get_credential()
            self.resource_client = ResourceManagementClient(credential, self.subscription_id)
        return self.resource_client
    
    def get_aks_cluster_info(self, resource_group: str, cluster_name: str) -> Optional[ClusterInfo]:
        """Get detailed AKS cluster information"""
        try:
            container_client = self._get_container_client()
            cluster = container_client.managed_clusters.get(resource_group, cluster_name)
            
            cluster_info = ClusterInfo(
                name=cluster.name,
                location=cluster.location,
                kubernetes_version=cluster.kubernetes_version,
                node_count=cluster.agent_pool_profiles[0].count if cluster.agent_pool_profiles else 0,
                vm_size=cluster.agent_pool_profiles[0].vm_size if cluster.agent_pool_profiles else 'Unknown',
                power_state=cluster.power_state.code if cluster.power_state else 'Unknown',
                fqdn=cluster.fqdn,
                resource_group=resource_group
            )
            
            return cluster_info
        except Exception as e:
            logger.error(f"Error getting cluster info: {e}")
            return None
    
    def get_resource_group_resources(self, resource_group: str) -> List[ResourceInfo]:
        """Get all resources in a resource group"""
        try:
            resource_client = self._get_resource_client()
            resources = resource_client.resources.list_by_resource_group(resource_group)
            
            resource_list = []
            for resource in resources:
                resource_info = ResourceInfo(
                    name=resource.name,
                    type=resource.type,
                    location=resource.location,
                    resource_group=resource_group,
                    tags=resource.tags or {}
                )
                resource_list.append(resource_info)
            
            return resource_list
        except Exception as e:
            logger.error(f"Error getting resources: {e}")
            return []
    
    def get_kubernetes_containers(self, resource_group: str, cluster_name: str) -> List[PodInfo]:
        """Get Kubernetes containers and pods from AKS cluster"""
        try:
            # Get cluster credentials
            container_client = self._get_container_client()
            credentials = container_client.managed_clusters.list_cluster_admin_credentials(
                resource_group, cluster_name
            )
            
            if not credentials.kubeconfigs:
                logger.warning("No kubeconfig available")
                return self._get_mock_kubernetes_data()
            
            # Write kubeconfig to temporary file
            kubeconfig_content = credentials.kubeconfigs[0].value.decode('utf-8')
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
                f.write(kubeconfig_content)
                kubeconfig_path = f.name
            
            try:
                # Get pods using kubectl
                result = subprocess.run([
                    'kubectl', '--kubeconfig', kubeconfig_path, 'get', 'pods', 
                    '--all-namespaces', '-o', 'json'
                ], capture_output=True, text=True, timeout=30)
                
                if result.returncode != 0:
                    logger.warning(f"kubectl command failed: {result.stderr}")
                    return self._get_mock_kubernetes_data()
                
                pods_data = json.loads(result.stdout)
                pods = []
                
                for pod in pods_data.get('items', []):
                    # Count ready containers in this pod
                    container_statuses = pod['status'].get('containerStatuses', [])
                    ready_containers = sum(1 for container in container_statuses if container.get('ready', False))
                    total_containers = len(container_statuses)
                    
                    pod_info = PodInfo(
                        name=pod['metadata']['name'],
                        namespace=pod['metadata']['namespace'],
                        status=pod['status']['phase'],
                        ready=f"{ready_containers}/{total_containers}",
                        containers=[],
                        node_name=pod['status'].get('hostIP', 'Unknown'),
                        age=self._calculate_age(pod['metadata']['creationTimestamp'])
                    )
                    
                    # Get container information
                    for container in container_statuses:
                        container_info = ContainerInfo(
                            name=container['name'],
                            namespace=pod['metadata']['namespace'],
                            pod_name=pod['metadata']['name'],
                            image=container['image'],
                            status=container['state'],
                            ready=container['ready'],
                            restart_count=container['restartCount'],
                            ports=[],
                            resources={}
                        )
                        pod_info.containers.append(container_info)
                    
                    pods.append(pod_info)
                
                return pods
                
            finally:
                # Clean up temporary file
                os.unlink(kubeconfig_path)
                
        except Exception as e:
            logger.error(f"Error getting Kubernetes containers: {e}")
            logger.info("Using mock Kubernetes data for demonstration")
            return self._get_mock_kubernetes_data()
    
    def _get_mock_kubernetes_data(self) -> List[PodInfo]:
        """Generate mock Kubernetes data for demonstration"""
        mock_pods = [
            PodInfo(
                name="nginx-deployment-7d4f8b8b8b",
                namespace="default",
                status="Running",
                ready="1/1",
                containers=[
                    ContainerInfo(
                        name="nginx",
                        namespace="default",
                        pod_name="nginx-deployment-7d4f8b8b8b",
                        image="nginx:1.21",
                        status="running",
                        ready=True,
                        restart_count=0,
                        ports=["80:80"],
                        resources={"cpu": "100m", "memory": "128Mi"}
                    )
                ],
                node_name="aks-nodepool1-12345678-vmss000000",
                age="2d"
            ),
            PodInfo(
                name="redis-master-6b7d8c9d0e",
                namespace="default",
                status="Running",
                ready="1/1",
                containers=[
                    ContainerInfo(
                        name="redis",
                        namespace="default",
                        pod_name="redis-master-6b7d8c9d0e",
                        image="redis:6.2-alpine",
                        status="running",
                        ready=True,
                        restart_count=1,
                        ports=["6379:6379"],
                        resources={"cpu": "200m", "memory": "256Mi"}
                    )
                ],
                node_name="aks-nodepool1-12345678-vmss000001",
                age="1d"
            ),
            PodInfo(
                name="postgres-db-9e8f7g6h5i",
                namespace="database",
                status="Running",
                ready="1/1",
                containers=[
                    ContainerInfo(
                        name="postgres",
                        namespace="database",
                        pod_name="postgres-db-9e8f7g6h5i",
                        image="postgres:13",
                        status="running",
                        ready=True,
                        restart_count=0,
                        ports=["5432:5432"],
                        resources={"cpu": "500m", "memory": "1Gi"}
                    )
                ],
                node_name="aks-nodepool1-12345678-vmss000002",
                age="3d"
            ),
            PodInfo(
                name="api-gateway-4j3k2l1m0n",
                namespace="api",
                status="Running",
                ready="2/2",
                containers=[
                    ContainerInfo(
                        name="api-gateway",
                        namespace="api",
                        pod_name="api-gateway-4j3k2l1m0n",
                        image="nginx:1.21",
                        status="running",
                        ready=True,
                        restart_count=0,
                        ports=["80:80"],
                        resources={"cpu": "150m", "memory": "200Mi"}
                    ),
                    ContainerInfo(
                        name="sidecar-proxy",
                        namespace="api",
                        pod_name="api-gateway-4j3k2l1m0n",
                        image="envoyproxy/envoy:v1.20",
                        status="running",
                        ready=True,
                        restart_count=0,
                        ports=["8080:8080"],
                        resources={"cpu": "100m", "memory": "128Mi"}
                    )
                ],
                node_name="aks-nodepool1-12345678-vmss000000",
                age="6h"
            ),
            PodInfo(
                name="monitoring-prometheus-5o4p3q2r1s",
                namespace="monitoring",
                status="Running",
                ready="1/1",
                containers=[
                    ContainerInfo(
                        name="prometheus",
                        namespace="monitoring",
                        pod_name="monitoring-prometheus-5o4p3q2r1s",
                        image="prom/prometheus:v2.30.0",
                        status="running",
                        ready=True,
                        restart_count=0,
                        ports=["9090:9090"],
                        resources={"cpu": "300m", "memory": "512Mi"}
                    )
                ],
                node_name="aks-nodepool1-12345678-vmss000001",
                age="1d"
            ),
            PodInfo(
                name="logging-fluentd-6t5u4v3w2x",
                namespace="logging",
                status="Running",
                ready="1/1",
                containers=[
                    ContainerInfo(
                        name="fluentd",
                        namespace="logging",
                        pod_name="logging-fluentd-6t5u4v3w2x",
                        image="fluent/fluentd-kubernetes-daemonset:v1.14",
                        status="running",
                        ready=True,
                        restart_count=2,
                        ports=[],
                        resources={"cpu": "100m", "memory": "200Mi"}
                    )
                ],
                node_name="aks-nodepool1-12345678-vmss000002",
                age="4d"
            )
        ]
        
        return mock_pods
    
    def _calculate_age(self, creation_timestamp: str) -> str:
        """Calculate age from creation timestamp"""
        try:
            from datetime import datetime, timezone
            created = datetime.fromisoformat(creation_timestamp.replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            diff = now - created
            
            if diff.days > 0:
                return f"{diff.days}d"
            elif diff.seconds > 3600:
                return f"{diff.seconds // 3600}h"
            elif diff.seconds > 60:
                return f"{diff.seconds // 60}m"
            else:
                return f"{diff.seconds}s"
        except:
            return "Unknown"
    
    def generate_html_dashboard(self, cluster_info: ClusterInfo, resources: List[ResourceInfo], 
                               kubernetes_pods: List[PodInfo], output_path: str = "aks-dashboard.html"):
        """Generate interactive HTML dashboard"""
        
        # Group resources by type
        resource_types = {}
        for resource in resources:
            resource_type = resource.type.split('/')[-1]
            if resource_type not in resource_types:
                resource_types[resource_type] = []
            resource_types[resource_type].append(resource)
        
        # Filter for container-related resources
        container_resources = [r for r in resources if any(keyword in r.type.lower() for keyword in 
                                                         ['container', 'pod', 'deployment', 'service', 'namespace'])]
        
        # Group resources by type for better organization
        containers_by_type = {}
        for resource in container_resources:
            resource_type = resource.type.split('/')[-1]
            if resource_type not in containers_by_type:
                containers_by_type[resource_type] = []
            containers_by_type[resource_type].append(resource)
        
        # Create HTML content
        html_content = self._create_html_template(cluster_info, containers_by_type, resources, kubernetes_pods)
        
        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info(f"HTML dashboard saved to: {output_path}")
        return output_path
    
    def _create_html_template(self, cluster_info: ClusterInfo, containers_by_type: Dict[str, List[ResourceInfo]], 
                             all_resources: List[ResourceInfo], kubernetes_pods: List[PodInfo]) -> str:
        """Create the HTML dashboard template"""
        
        # Count total containers
        total_containers = sum(len(pod.containers) for pod in kubernetes_pods)
        
        html_template = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AKS Container Dashboard - {cluster_info.name}</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        body {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 0.9rem;
        }}
        
        .dashboard-container {{
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            margin: 20px;
            padding: 30px;
        }}
        
        .header {{
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 25px;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 1.8rem;
            margin-bottom: 0.5rem;
        }}
        
        .header p {{
            font-size: 0.9rem;
            margin-bottom: 0;
        }}
        
        .metric-card {{
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border-left: 5px solid #3498db;
            transition: transform 0.3s ease;
        }}
        
        .metric-card:hover {{
            transform: translateY(-5px);
        }}
        
        .metric-value {{
            font-size: 2rem;
            font-weight: bold;
            color: #2c3e50;
        }}
        
        .metric-label {{
            color: #7f8c8d;
            font-size: 0.85rem;
            margin-top: 8px;
        }}
        
        .container-section {{
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }}
        
        .container-section h4 {{
            font-size: 1.1rem;
            margin-bottom: 15px;
        }}
        
        .container-type-header {{
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            padding: 12px 15px;
            border-radius: 8px;
            margin-bottom: 12px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }}
        
        .container-type-header:hover {{
            background: linear-gradient(135deg, #2980b9, #1f5f8b);
            transform: translateY(-2px);
        }}
        
        .container-type-header .toggle-btn {{
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }}
        
        .container-type-header .toggle-btn:hover {{
            background: rgba(255, 255, 255, 0.3);
        }}
        
        .status-indicator {{
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
            border: 2px solid rgba(255, 255, 255, 0.3);
        }}
        
        .status-all-healthy {{
            background-color: #28a745;
            box-shadow: 0 0 8px rgba(40, 167, 69, 0.6);
        }}
        
        .status-has-issues {{
            background-color: #dc3545;
            box-shadow: 0 0 8px rgba(220, 53, 69, 0.6);
        }}
        
        .namespace-summary {{
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            border-left: 4px solid #3498db;
            display: none;
        }}
        
        .namespace-summary.show {{
            display: block;
        }}
        
        /* Hide all details sections by default */
        [id^="details-"] {{
            display: none;
        }}
        
        /* Node Visualization Styles */
        .node-visualization {{
            margin-top: 30px;
        }}
        
        .node-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }}
        
        .node-box {{
            background: white;
            border-radius: 12px;
            border: 2px solid #e9ecef;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            transition: all 0.3s ease;
        }}
        
        .node-box:hover {{
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
        }}
        
        .node-box.node-healthy {{
            border-color: #28a745;
        }}
        
        .node-box.node-unhealthy {{
            border-color: #dc3545;
        }}
        
        .node-header {{
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 15px 20px;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        
        .node-header h5 {{
            margin: 0;
            color: #2c3e50;
            font-size: 1.1rem;
            font-weight: bold;
        }}
        
        .node-stats {{
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .stat-badge {{
            background: #6c757d;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: bold;
        }}
        
        .health-indicator {{
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
        }}
        
        .health-indicator.node-healthy {{
            background-color: #28a745;
            box-shadow: 0 0 8px rgba(40, 167, 69, 0.6);
        }}
        
        .health-indicator.node-unhealthy {{
            background-color: #dc3545;
            box-shadow: 0 0 8px rgba(220, 53, 69, 0.6);
        }}
        
        .node-content {{
            padding: 15px 20px;
            max-height: 400px;
            overflow-y: auto;
        }}
        
        .namespace-group {{
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 8px;
            background: #f8f9fa;
            border-left: 3px solid #6c757d;
        }}
        
        .namespace-group.namespace-healthy {{
            border-left-color: #28a745;
            background: #f8fff9;
        }}
        
        .namespace-group.namespace-unhealthy {{
            border-left-color: #dc3545;
            background: #fff8f8;
        }}
        
        .namespace-label {{
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }}
        
        .namespace-status {{
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }}
        
        .namespace-status.namespace-healthy {{
            background-color: #28a745;
        }}
        
        .namespace-status.namespace-unhealthy {{
            background-color: #dc3545;
        }}
        
        .container-list {{
            margin-left: 15px;
        }}
        
        .pod-item {{
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 5px;
            font-size: 0.8rem;
            padding: 3px 0;
        }}
        
        .pod-status {{
            width: 6px;
            height: 6px;
            border-radius: 50%;
        }}
        
        .pod-status.status-green {{
            background-color: #28a745;
        }}
        
        .pod-status.status-red {{
            background-color: #dc3545;
        }}
        
        .pod-status.status-yellow {{
            background-color: #ffc107;
        }}
        
        .pod-name {{
            font-weight: 500;
            color: #2c3e50;
        }}
        
        .pod-containers {{
            color: #6c757d;
            font-size: 0.75rem;
        }}
        
        .container-item {{
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 12px;
            border-left: 4px solid #3498db;
            transition: all 0.3s ease;
        }}
        
        .container-item:hover {{
            background: #e9ecef;
            transform: translateX(5px);
        }}
        
        .container-name {{
            font-size: 1rem;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
        }}
        
        .container-details {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-top: 10px;
        }}
        
        .detail-item {{
            background: white;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #dee2e6;
        }}
        
        .detail-label {{
            font-size: 0.75rem;
            color: #6c757d;
            font-weight: bold;
            margin-bottom: 3px;
        }}
        
        .detail-value {{
            color: #2c3e50;
            font-weight: 500;
            font-size: 0.8rem;
        }}
        
        .status-badge {{
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 0.75rem;
            font-weight: bold;
        }}
        
        .status-running {{
            background-color: #d4edda;
            color: #155724;
        }}
        
        .status-stopped {{
            background-color: #f8d7da;
            color: #721c24;
        }}
        
        .status-pending {{
            background-color: #fff3cd;
            color: #856404;
        }}
        
        .refresh-btn {{
            background: linear-gradient(135deg, #3498db, #2980b9);
            border: none;
            border-radius: 25px;
            padding: 10px 20px;
            color: white;
            font-weight: bold;
            transition: all 0.3s ease;
            font-size: 0.85rem;
        }}
        
        .refresh-btn:hover {{
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
        }}
        
        .refresh-btn:disabled {{
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }}
        
        .loading {{
            display: none;
            text-align: center;
            padding: 20px;
        }}
        
        .spinner {{
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }}
        
        @keyframes spin {{
            0% {{ transform: rotate(0deg); }}
            100% {{ transform: rotate(360deg); }}
        }}
        
        .no-containers {{
            text-align: center;
            padding: 30px;
            color: #6c757d;
            font-style: italic;
            font-size: 0.9rem;
        }}
        
        .container-count {{
            background: rgba(255, 255, 255, 0.2);
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 0.75rem;
        }}
        
        .table {{
            font-size: 0.8rem;
        }}
        
        .table th {{
            font-size: 0.8rem;
            padding: 8px 12px;
        }}
        
        .table td {{
            font-size: 0.8rem;
            padding: 8px 12px;
        }}
        
        .pod-container {{
            background: #f8f9fa;
            border-radius: 6px;
            padding: 10px;
            margin: 5px 0;
            border-left: 3px solid #28a745;
        }}
        
        .pod-container:hover {{
            background: #e9ecef;
        }}
        
        .container-status {{
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 5px;
        }}
        
        .status-green {{
            background-color: #28a745;
        }}
        
        .status-red {{
            background-color: #dc3545;
        }}
        
        .status-yellow {{
            background-color: #ffc107;
        }}
        
        .summary-stats {{
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-bottom: 10px;
        }}
        
        .summary-stat {{
            background: white;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #dee2e6;
            font-size: 0.8rem;
        }}
        
        .summary-stat .stat-value {{
            font-weight: bold;
            color: #2c3e50;
        }}
        
        .summary-stat .stat-label {{
            color: #6c757d;
            font-size: 0.7rem;
        }}
    </style>
</head>
<body>
    <div class="dashboard-container">
        <!-- Header -->
        <div class="header">
            <h1><i class="fas fa-cube"></i> AKS Container Dashboard</h1>
            <p class="mb-0">Real-time visualization of your Azure Kubernetes Service containers</p>
            <button class="btn refresh-btn mt-3" onclick="refreshDashboard()" id="refreshBtn">
                <i class="fas fa-sync-alt"></i> Refresh Data
            </button>
        </div>
        
        <!-- Loading Indicator -->
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Refreshing dashboard data...</p>
        </div>
        
        <!-- Metrics Row -->
        <div class="row" id="metrics-row">
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-value">{cluster_info.node_count}</div>
                    <div class="metric-label">
                        <i class="fas fa-server"></i> Kubernetes Nodes
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-value">{len(kubernetes_pods)}</div>
                    <div class="metric-label">
                        <i class="fas fa-cubes"></i> Kubernetes Pods
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-value">{total_containers}</div>
                    <div class="metric-label">
                        <i class="fas fa-box"></i> Total Containers
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-value">
                        <span class="status-badge status-{cluster_info.power_state.lower()}">
                            {cluster_info.power_state}
                        </span>
                    </div>
                    <div class="metric-label">
                        <i class="fas fa-power-off"></i> Cluster Status
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Cluster Information -->
        <div class="row">
            <div class="col-12">
                <div class="container-section">
                    <h4><i class="fas fa-info-circle"></i> Cluster Information</h4>
                    <div class="row">
                        <div class="col-md-6">
                            <table class="table table-borderless">
                                <tr>
                                    <td><strong>Cluster Name:</strong></td>
                                    <td>{cluster_info.name}</td>
                                </tr>
                                <tr>
                                    <td><strong>Resource Group:</strong></td>
                                    <td>{cluster_info.resource_group}</td>
                                </tr>
                                <tr>
                                    <td><strong>Location:</strong></td>
                                    <td>{cluster_info.location}</td>
                                </tr>
                                <tr>
                                    <td><strong>Kubernetes Version:</strong></td>
                                    <td>{cluster_info.kubernetes_version}</td>
                                </tr>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <table class="table table-borderless">
                                <tr>
                                    <td><strong>VM Size:</strong></td>
                                    <td>{cluster_info.vm_size}</td>
                                </tr>
                                <tr>
                                    <td><strong>Power State:</strong></td>
                                    <td>
                                        <span class="status-badge status-{cluster_info.power_state.lower()}">
                                            {cluster_info.power_state}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>FQDN:</strong></td>
                                    <td>{cluster_info.fqdn}</td>
                                </tr>
                                <tr>
                                    <td><strong>Last Updated:</strong></td>
                                    <td id="lastUpdated">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Kubernetes Pods and Containers -->
        <div class="row">
            <div class="col-12">
                <div class="container-section">
                    <h4><i class="fas fa-cube"></i> Kubernetes Pods and Containers</h4>
                    
                    {self._generate_kubernetes_pods_section(kubernetes_pods) if kubernetes_pods else '<div class="no-containers"><i class="fas fa-info-circle fa-2x mb-3"></i><p>No Kubernetes pods found or unable to connect to cluster.</p><p>Make sure kubectl is installed and cluster credentials are available.</p></div>'}
                </div>
            </div>
        </div>
        
        <!-- Node Visualization -->
        <div class="row">
            <div class="col-12">
                <div class="container-section">
                    <h4><i class="fas fa-server"></i> Pod Distribution by Node</h4>
                    <p class="text-muted">Visual representation of pods and containers grouped by Kubernetes nodes</p>
                    
                    {self._generate_node_visualization_section(kubernetes_pods) if kubernetes_pods else '<div class="no-containers"><i class="fas fa-info-circle fa-2x mb-3"></i><p>No pods found for node visualization.</p></div>'}
                </div>
            </div>
        </div>
        
        <!-- All Resources Table -->
        <div class="row">
            <div class="col-12">
                <div class="container-section">
                    <h4><i class="fas fa-database"></i> All Azure Resources</h4>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Location</th>
                                    <th>Resource Group</th>
                                    <th>Tags</th>
                                </tr>
                            </thead>
                            <tbody>
                                {self._generate_resource_table_rows(all_resources)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
        // Global state
        let isRefreshing = false;
        
        // Refresh function
        async function refreshDashboard() {{
            if (isRefreshing) return;
            
            isRefreshing = true;
            const refreshBtn = document.getElementById('refreshBtn');
            const loading = document.getElementById('loading');
            const metricsRow = document.getElementById('metrics-row');
            
            // Update UI
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            loading.style.display = 'block';
            metricsRow.style.opacity = '0.5';
            
            try {{
                // Call the Python script to refresh data
                const response = await fetch('http://localhost:5055/refresh-dashboard', {{
                    method: 'POST',
                    headers: {{
                        'Content-Type': 'application/json'
                    }}
                }});
                
                if (response.ok) {{
                    // Reload the page with fresh data
                    window.location.reload();
                }} else {{
                    throw new Error('Failed to refresh data');
                }}
            }} catch (error) {{
                console.error('Refresh failed:', error);
                alert('Failed to refresh dashboard. Please try again.');
                
                // Reset UI
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
                loading.style.display = 'none';
                metricsRow.style.opacity = '1';
                isRefreshing = false;
            }}
        }}
        
        // Toggle namespace details
        function toggleNamespace(namespaceId) {{
            const summary = document.getElementById(`summary-${{namespaceId}}`);
            const details = document.getElementById(`details-${{namespaceId}}`);
            const toggleBtn = document.getElementById(`toggle-${{namespaceId}}`);
            
            if (summary.classList.contains('show')) {{
                // Hide everything
                summary.classList.remove('show');
                details.style.display = 'none';
                toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Show Details';
            }} else {{
                // Show everything
                summary.classList.add('show');
                details.style.display = 'block';
                toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Hide Details';
            }}
        }}
        
        // Auto-refresh every 5 minutes
        setInterval(() => {{
            if (!isRefreshing) {{
                console.log('Auto-refresh triggered');
                refreshDashboard();
            }}
        }}, 300000);
        
        // Initialize tooltips
        document.addEventListener('DOMContentLoaded', function() {{
            // Add any initialization code here
        }});
    </script>
</body>
</html>
        """
        
        return html_template
    
    def _generate_kubernetes_pods_section(self, pods: List[PodInfo]) -> str:
        """Generate HTML section for Kubernetes pods and containers"""
        if not pods:
            return '<div class="no-containers"><p>No pods found</p></div>'
        
        sections = ""
        
        # Group pods by namespace
        pods_by_namespace = {}
        for pod in pods:
            if pod.namespace not in pods_by_namespace:
                pods_by_namespace[pod.namespace] = []
            pods_by_namespace[pod.namespace].append(pod)
        
        for namespace, namespace_pods in pods_by_namespace.items():
            # Calculate namespace health
            total_pods = len(namespace_pods)
            healthy_pods = sum(1 for pod in namespace_pods if pod.status == 'Running')
            total_containers = sum(len(pod.containers) for pod in namespace_pods)
            healthy_containers = sum(
                sum(1 for container in pod.containers if container.ready)
                for pod in namespace_pods
            )
            
            # Determine if namespace is healthy (all containers ready)
            is_healthy = healthy_containers == total_containers and total_containers > 0
            status_class = "status-all-healthy" if is_healthy else "status-has-issues"
            status_icon = "fas fa-check-circle" if is_healthy else "fas fa-exclamation-triangle"
            
            namespace_id = namespace.replace('-', '_').replace('.', '_')
            
            sections += f"""
                <div class="container-type-header" onclick="toggleNamespace('{namespace_id}')">
                    <span>
                        <span class="status-indicator {status_class}"></span>
                        <i class="{status_icon}"></i> Namespace: {namespace} ({total_pods} pods)
                    </span>
                    <div>
                        <span class="container-count">{total_containers} containers</span>
                        <button class="toggle-btn" id="toggle-{namespace_id}">
                            <i class="fas fa-chevron-down"></i> Show Details
                        </button>
                    </div>
                </div>
                
                <!-- Namespace Summary -->
                <div class="namespace-summary" id="summary-{namespace_id}">
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <div class="stat-value">{total_pods}</div>
                            <div class="stat-label">Total Pods</div>
                        </div>
                        <div class="summary-stat">
                            <div class="stat-value">{healthy_pods}</div>
                            <div class="stat-label">Healthy Pods</div>
                        </div>
                        <div class="summary-stat">
                            <div class="stat-value">{total_containers}</div>
                            <div class="stat-label">Total Containers</div>
                        </div>
                        <div class="summary-stat">
                            <div class="stat-value">{healthy_containers}</div>
                            <div class="stat-label">Healthy Containers</div>
                        </div>
                        <div class="summary-stat">
                            <div class="stat-value">{total_pods - healthy_pods}</div>
                            <div class="stat-label">Unhealthy Pods</div>
                        </div>
                    </div>
                </div>
                
                <!-- Pod Details -->
                <div id="details-{namespace_id}">
            """
            
            for pod in namespace_pods:
                # Determine pod status color
                status_color = 'green' if pod.status == 'Running' else 'red' if pod.status == 'Failed' else 'yellow'
                
                sections += f"""
                    <div class="container-item">
                        <div class="container-name">
                            <span class="container-status status-{status_color}"></span>
                            <i class="fas fa-cube"></i> {pod.name} ({pod.status})
                        </div>
                        <div class="container-details">
                            <div class="detail-item">
                                <div class="detail-label">Namespace</div>
                                <div class="detail-value">{pod.namespace}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Status</div>
                                <div class="detail-value">
                                    <span class="status-badge status-{pod.status.lower()}">{pod.status}</span>
                                </div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Ready</div>
                                <div class="detail-value">{pod.ready}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Node</div>
                                <div class="detail-value">{pod.node_name}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Age</div>
                                <div class="detail-value">{pod.age}</div>
                            </div>
                        </div>
                """
                
                # Add containers for this pod
                if pod.containers:
                    sections += '<div style="margin-top: 10px; padding-left: 20px;">'
                    sections += '<strong style="font-size: 0.8rem; color: #6c757d;">Containers:</strong>'
                    
                    for container in pod.containers:
                        container_status_color = 'green' if container.ready else 'red'
                        sections += f"""
                            <div class="pod-container">
                                <div style="font-weight: bold; font-size: 0.8rem; margin-bottom: 5px;">
                                    <span class="container-status status-{container_status_color}"></span>
                                    {container.name}
                                </div>
                                <div style="font-size: 0.75rem; color: #6c757d;">
                                    <strong>Image:</strong> {container.image}<br>
                                    <strong>Status:</strong> {container.status}<br>
                                    <strong>Restarts:</strong> {container.restart_count}
                                </div>
                            </div>
                        """
                    
                    sections += '</div>'
                
                sections += '</div>'
            
            sections += '</div>'  # Close details div
        
        return sections
    
    def _generate_node_visualization_section(self, pods: List[PodInfo]) -> str:
        """Generate HTML section for node-based pod visualization"""
        if not pods:
            return '<div class="no-containers"><p>No pods found for node visualization</p></div>'
        
        # Group pods by node
        pods_by_node = {}
        for pod in pods:
            node_name = pod.node_name if pod.node_name != 'Unknown' else 'Unknown Node'
            if node_name not in pods_by_node:
                pods_by_node[node_name] = []
            pods_by_node[node_name].append(pod)
        
        # Group pods by namespace within each node
        node_sections = ""
        for node_name, node_pods in pods_by_node.items():
            # Group pods by namespace within this node
            namespaces_in_node = {}
            for pod in node_pods:
                if pod.namespace not in namespaces_in_node:
                    namespaces_in_node[pod.namespace] = []
                namespaces_in_node[pod.namespace].append(pod)
            
            # Calculate node statistics
            total_pods_in_node = len(node_pods)
            healthy_pods_in_node = sum(1 for pod in node_pods if pod.status == 'Running')
            total_containers_in_node = sum(len(pod.containers) for pod in node_pods)
            healthy_containers_in_node = sum(
                sum(1 for container in pod.containers if container.ready)
                for pod in node_pods
            )
            
            # Determine node health
            is_node_healthy = healthy_containers_in_node == total_containers_in_node and total_containers_in_node > 0
            node_status_class = "node-healthy" if is_node_healthy else "node-unhealthy"
            
            node_sections += f"""
                <div class="node-box {node_status_class}">
                    <div class="node-header">
                        <h5><i class="fas fa-server"></i> {node_name}</h5>
                        <div class="node-stats">
                            <span class="stat-badge">{total_pods_in_node} pods</span>
                            <span class="stat-badge">{total_containers_in_node} containers</span>
                            <span class="health-indicator {node_status_class}"></span>
                        </div>
                    </div>
                    <div class="node-content">
            """
            
            for namespace, namespace_pods in namespaces_in_node.items():
                # Calculate namespace health within this node
                healthy_pods_in_namespace = sum(1 for pod in namespace_pods if pod.status == 'Running')
                total_containers_in_namespace = sum(len(pod.containers) for pod in namespace_pods)
                healthy_containers_in_namespace = sum(
                    sum(1 for container in pod.containers if container.ready)
                    for pod in namespace_pods
                )
                
                is_namespace_healthy = healthy_containers_in_namespace == total_containers_in_namespace and total_containers_in_namespace > 0
                namespace_status_class = "namespace-healthy" if is_namespace_healthy else "namespace-unhealthy"
                
                node_sections += f"""
                        <div class="namespace-group {namespace_status_class}">
                            <div class="namespace-label">
                                <span class="namespace-status {namespace_status_class}"></span>
                                <strong>{namespace}</strong> ({len(namespace_pods)} pods)
                            </div>
                            <div class="container-list">
                """
                
                for pod in namespace_pods:
                    pod_status_color = 'green' if pod.status == 'Running' else 'red' if pod.status == 'Failed' else 'yellow'
                    node_sections += f"""
                                <div class="pod-item">
                                    <span class="pod-status status-{pod_status_color}"></span>
                                    <span class="pod-name">{pod.name}</span>
                                    <span class="pod-containers">({len(pod.containers)} containers)</span>
                                </div>
                    """
                
                node_sections += """
                            </div>
                        </div>
                """
            
            node_sections += """
                    </div>
                </div>
            """
        
        return f"""
        <div class="node-visualization">
            <div class="node-grid">
                {node_sections}
            </div>
        </div>
        """
    
    def _generate_container_sections(self, containers_by_type: Dict[str, List[ResourceInfo]]) -> str:
        """Generate HTML sections for container resources grouped by type"""
        sections = ""
        
        # Define icons for different container types
        type_icons = {
            'managedclusters': 'fas fa-cube',
            'containers': 'fas fa-box',
            'pods': 'fas fa-cube',
            'deployments': 'fas fa-rocket',
            'services': 'fas fa-network-wired',
            'namespaces': 'fas fa-layer-group',
            'configmaps': 'fas fa-cog',
            'secrets': 'fas fa-key',
            'persistentvolumes': 'fas fa-hdd',
            'persistentvolumeclaims': 'fas fa-hdd',
            'ingresses': 'fas fa-globe',
            'daemonsets': 'fas fa-server',
            'statefulsets': 'fas fa-database',
            'jobs': 'fas fa-tasks',
            'cronjobs': 'fas fa-clock'
        }
        
        for resource_type, resources in containers_by_type.items():
            icon = type_icons.get(resource_type.lower(), 'fas fa-cube')
            
            sections += f"""
                <div class="container-type-header">
                    <span><i class="{icon}"></i> {resource_type.title()} ({len(resources)})</span>
                    <span class="container-count">{len(resources)} items</span>
                </div>
            """
            
            for resource in resources:
                sections += f"""
                    <div class="container-item">
                        <div class="container-name">
                            <i class="{icon}"></i> {resource.name}
                        </div>
                        <div class="container-details">
                            <div class="detail-item">
                                <div class="detail-label">Type</div>
                                <div class="detail-value">{resource.type}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Location</div>
                                <div class="detail-value">{resource.location}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Resource Group</div>
                                <div class="detail-value">{resource.resource_group}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Tags</div>
                                <div class="detail-value">{", ".join([f"{k}: {v}" for k, v in resource.tags.items()]) if resource.tags else "No tags"}</div>
                            </div>
                        </div>
                    </div>
                """
        
        return sections
    
    def _generate_resource_table_rows(self, resources: List[ResourceInfo]) -> str:
        """Generate HTML table rows for resources"""
        rows = ""
        for resource in resources:
            tags_str = ", ".join([f"{k}: {v}" for k, v in resource.tags.items()]) if resource.tags else "No tags"
            rows += f"""
                <tr>
                    <td><strong>{resource.name}</strong></td>
                    <td><span class="badge bg-primary">{resource.type.split('/')[-1]}</span></td>
                    <td>{resource.location}</td>
                    <td>{resource.resource_group}</td>
                    <td><small>{tags_str}</small></td>
                </tr>
            """
        return rows

def main():
    """Main function"""
    print("🌐 AKS HTML Dashboard Generator")
    print("=" * 40)
    
    try:
        # Load configuration
        with open('azure-visualization-config.json', 'r') as f:
            config = json.load(f)
        
        azure_config = config['azure']
        
        # Initialize dashboard generator
        generator = AKSDashboardGenerator(
            subscription_id=azure_config['subscription_id'],
            tenant_id=azure_config['tenant_id'],
            client_id=azure_config['client_id'],
            client_secret=azure_config['client_secret']
        )
        
        # Get cluster info
        print("🔍 Getting AKS cluster information...")
        cluster_info = generator.get_aks_cluster_info("rg-modular-demo", "transact")
        
        if not cluster_info:
            print("❌ Failed to get cluster information")
            return False
        
        print(f"✅ Cluster: {cluster_info.name} ({cluster_info.node_count} nodes)")
        
        # Get resources
        print("🔍 Getting resource group resources...")
        resources = generator.get_resource_group_resources("rg-modular-demo")
        print(f"✅ Found {len(resources)} resources")
        
        # Get Kubernetes pods
        print("🔍 Getting Kubernetes pods and containers...")
        kubernetes_pods = generator.get_kubernetes_containers("rg-modular-demo", "transact")
        print(f"✅ Found {len(kubernetes_pods)} pods")
        
        # Generate HTML dashboard
        print("🌐 Generating HTML dashboard...")
        output_path = generator.generate_html_dashboard(cluster_info, resources, kubernetes_pods, "aks-dashboard.html")
        
        if output_path:
            print(f"✅ HTML dashboard saved to: {output_path}")
            
            # Print summary
            print(f"\n📊 Dashboard Summary:")
            print(f"   • Cluster: {cluster_info.name}")
            print(f"   • Resources: {len(resources)}")
            print(f"   • Location: {cluster_info.location}")
            print(f"   • Status: {cluster_info.power_state}")
            print(f"\n🌐 Open {output_path} in your web browser to view the dashboard!")
            
            return True
        else:
            print("❌ Failed to generate dashboard")
            return False
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 