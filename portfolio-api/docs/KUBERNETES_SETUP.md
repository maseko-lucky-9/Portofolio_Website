# Kubernetes Setup Guide

Complete guide for setting up Kubernetes cluster for the Portfolio Backend API.

## 📋 Table of Contents

- [Cluster Options](#cluster-options)
- [MicroK8s Setup](#microk8s-setup)
- [Storage Configuration](#storage-configuration)
- [Ingress Setup](#ingress-setup)
- [ArgoCD Installation](#argocd-installation)
- [Secrets Management](#secrets-management)

## Cluster Options

### Supported Platforms

| Platform | Use Case | Pros | Cons |
|----------|----------|------|------|
| **MicroK8s** | Local dev, edge | Lightweight, easy setup | Limited scale |
| **Minikube** | Local dev | Simple, portable | Single node only |
| **K3s** | Edge, IoT, CI | Minimal resources | Limited features |
| **EKS** | AWS production | Managed, scalable | Higher cost |
| **GKE** | GCP production | Managed, integrated | Higher cost |
| **AKS** | Azure production | Managed, AD integration | Higher cost |

### Minimum Requirements

**Development:**
- 2 CPU cores
- 4GB RAM
- 20GB disk space
- Single node

**Staging:**
- 4 CPU cores
- 8GB RAM
- 50GB disk space
- 2 nodes recommended

**Production:**
- 8 CPU cores
- 16GB RAM
- 100GB disk space
- 3+ nodes (high availability)

## MicroK8s Setup

### Installation

**Ubuntu/Debian:**

```bash
# Install MicroK8s
sudo snap install microk8s --classic --channel=1.28

# Add user to group
sudo usermod -a -G microk8s $USER
sudo chown -f -R $USER ~/.kube

# Re-enter session
newgrp microk8s

# Wait for ready
microk8s status --wait-ready

# Enable required addons
microk8s enable dns storage ingress metrics-server
```

**Windows (WSL2):**

```powershell
# Install WSL2
wsl --install

# Install Ubuntu
wsl --install -d Ubuntu-22.04

# In WSL2 terminal
sudo snap install microk8s --classic --channel=1.28
sudo usermod -a -G microk8s $USER
newgrp microk8s

# Enable addons
microk8s enable dns storage ingress metrics-server
```

**macOS:**

```bash
# Install via Homebrew
brew install ubuntu/microk8s/microk8s

# Start MicroK8s
microk8s install

# Enable addons
microk8s enable dns storage ingress metrics-server
```

### Configuration

**kubectl Access:**

```bash
# Add alias (optional but recommended)
alias kubectl='microk8s kubectl'

# Or export config
microk8s config > ~/.kube/config

# Verify
kubectl get nodes
```

**Addons Configuration:**

```bash
# DNS (CoreDNS)
microk8s enable dns

# Storage (hostpath)
microk8s enable hostpath-storage

# Ingress (NGINX)
microk8s enable ingress

# Metrics Server
microk8s enable metrics-server

# Helm3
microk8s enable helm3

# Dashboard (optional)
microk8s enable dashboard

# Prometheus (optional)
microk8s enable prometheus

# Registry (optional, for local images)
microk8s enable registry
```

### Multi-node Setup

**Add Worker Nodes:**

```bash
# On master node
microk8s add-node

# Output will show command like:
# microk8s join 192.168.1.100:25000/abc123...

# On worker node
sudo snap install microk8s --classic --channel=1.28
microk8s join 192.168.1.100:25000/abc123...

# Verify cluster
kubectl get nodes
```

### Resource Limits

**Configure MicroK8s Resources:**

```bash
# Edit containerd config
sudo nano /var/snap/microk8s/current/args/containerd-template.toml

# Add resource limits
[plugins."io.containerd.grpc.v1.cri".containerd]
  default_runtime_name = "runc"
  
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
  runtime_type = "io.containerd.runc.v2"
  
  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
    SystemdCgroup = true
    
# Restart MicroK8s
microk8s stop
microk8s start
```

## Storage Configuration

### hostpath-storage (MicroK8s Default)

**Enable:**

```bash
microk8s enable hostpath-storage
```

**Default StorageClass:**

```yaml
# Automatically created
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: microk8s-hostpath
provisioner: microk8s.io/hostpath
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

**Using hostpath:**

```yaml
# PersistentVolumeClaim
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: microk8s-hostpath
  resources:
    requests:
      storage: 10Gi
```

### Local Path Provisioner (Alternative)

**Install:**

```bash
# Create namespace
kubectl create namespace local-path-storage

# Deploy provisioner
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.24/deploy/local-path-storage.yaml

# Set as default
kubectl patch storageclass local-path -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

**Configuration:**

```yaml
# ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: local-path-config
  namespace: local-path-storage
data:
  config.json: |-
    {
      "nodePathMap": [
        {
          "node": "DEFAULT_PATH_FOR_NON_LISTED_NODES",
          "paths": ["/var/local-path-provisioner"]
        }
      ]
    }
```

### NFS Storage (Production)

**Setup NFS Server:**

```bash
# On NFS server
sudo apt-get install nfs-kernel-server
sudo mkdir -p /export/k8s
sudo chown -R nobody:nogroup /export/k8s
sudo chmod 777 /export/k8s

# Configure exports
echo "/export/k8s *(rw,sync,no_subtree_check,no_root_squash)" | sudo tee -a /etc/exports

# Apply config
sudo exportfs -a
sudo systemctl restart nfs-kernel-server
```

**Deploy NFS Provisioner:**

```bash
# Install NFS CSI driver
kubectl apply -f https://raw.githubusercontent.com/kubernetes-csi/csi-driver-nfs/master/deploy/install-driver.sh

# Create StorageClass
cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs-storage
provisioner: nfs.csi.k8s.io
parameters:
  server: 192.168.1.100
  share: /export/k8s
reclaimPolicy: Retain
volumeBindingMode: Immediate
EOF
```

## Ingress Setup

### NGINX Ingress Controller

**Install with MicroK8s:**

```bash
microk8s enable ingress
```

**Standalone Installation:**

```bash
# Install NGINX Ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Wait for deployment
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

**Configuration:**

```yaml
# ConfigMap for NGINX settings
apiVersion: v1
kind: ConfigMap
metadata:
  name: ingress-nginx-controller
  namespace: ingress-nginx
data:
  use-forwarded-headers: "true"
  compute-full-forwarded-for: "true"
  proxy-body-size: "10m"
  proxy-buffer-size: "16k"
  ssl-protocols: "TLSv1.2 TLSv1.3"
  ssl-ciphers: "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256"
```

### cert-manager (TLS Certificates)

**Install:**

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for ready
kubectl wait --namespace cert-manager \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/instance=cert-manager \
  --timeout=180s
```

**Configure Let's Encrypt:**

```yaml
# Staging issuer (for testing)
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
      - http01:
          ingress:
            class: nginx

---
# Production issuer
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

**Usage in Ingress:**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: backend-api
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.example.com
      secretName: backend-api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend-api
                port:
                  number: 3000
```

### DNS Configuration

**Local Development (hosts file):**

```bash
# Linux/macOS
sudo echo "127.0.0.1 api-dev.local" >> /etc/hosts

# Windows (as Administrator)
echo "127.0.0.1 api-dev.local" >> C:\Windows\System32\drivers\etc\hosts
```

**Production (DNS provider):**

```
# Create A records
api-dev.example.com     -> <dev-cluster-ip>
api-staging.example.com -> <staging-cluster-ip>
api.example.com         -> <prod-cluster-ip>

# Or CNAME to load balancer
api.example.com -> lb.us-east-1.elb.amazonaws.com
```

## ArgoCD Installation

### Basic Installation

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods
kubectl wait --namespace argocd \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/name=argocd-server \
  --timeout=300s
```

### Access ArgoCD

**Port Forward (Development):**

```bash
# Forward ArgoCD server
kubectl port-forward -n argocd svc/argocd-server 8080:443

# Get initial password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Access: https://localhost:8080
# Username: admin
# Password: <from above command>
```

**Ingress (Production):**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-server
  namespace: argocd
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - argocd.example.com
      secretName: argocd-tls
  rules:
    - host: argocd.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: argocd-server
                port:
                  number: 443
```

### Configure ArgoCD

**Change Password:**

```bash
# Login to ArgoCD
argocd login localhost:8080

# Change password
argocd account update-password
```

**Add Git Repository:**

```bash
# Via CLI
argocd repo add https://github.com/maseko-lucky-9/Portofolio_Website.git \
  --username <username> \
  --password <token>

# Or create secret
kubectl create secret generic -n argocd repo-credentials \
  --from-literal=url=https://github.com/maseko-lucky-9/Portofolio_Website.git \
  --from-literal=username=<username> \
  --from-literal=password=<token>

kubectl label secret -n argocd repo-credentials \
  argocd.argoproj.io/secret-type=repository
```

**Deploy Applications:**

```bash
# Deploy app-of-apps
kubectl apply -f portfolio-api/k8s/argocd/backend-app-of-apps.yaml

# Sync applications
argocd app sync backend-apps

# Watch sync progress
argocd app wait backend-apps
```

## Secrets Management

### Kubernetes Secrets

**Create from Literals:**

```bash
# Development
kubectl create namespace dev
kubectl create secret generic backend-secrets \
  --from-literal=database-url='postgresql://user:pass@postgres:5432/portfolio' \
  --from-literal=redis-url='redis://redis:6379' \
  --from-literal=jwt-secret='dev-secret-key-change-in-prod' \
  --from-literal=jwt-access-expiry='15m' \
  --from-literal=jwt-refresh-expiry='7d' \
  --from-literal=google-client-id='' \
  --from-literal=google-client-secret='' \
  --from-literal=github-client-id='' \
  --from-literal=github-client-secret='' \
  --from-literal=email-host='smtp.gmail.com' \
  --from-literal=email-port='587' \
  --from-literal=email-user='noreply@example.com' \
  --from-literal=email-password='email-password' \
  --namespace=dev
```

**Create from Files:**

```bash
# Create .env file
cat > secrets.env <<EOF
DATABASE_URL=postgresql://user:pass@postgres:5432/portfolio
REDIS_URL=redis://redis:6379
JWT_SECRET=prod-secret-key-very-secure
EOF

# Create secret
kubectl create secret generic backend-secrets \
  --from-env-file=secrets.env \
  --namespace=prod

# Cleanup
rm secrets.env
```

**View Secrets:**

```bash
# List secrets
kubectl get secrets -n prod

# Describe secret (masked values)
kubectl describe secret backend-secrets -n prod

# Decode secret value
kubectl get secret backend-secrets -n prod \
  -o jsonpath='{.data.database-url}' | base64 -d
```

### External Secrets Operator

**Install:**

```bash
# Add Helm repo
helm repo add external-secrets https://charts.external-secrets.io
helm repo update

# Install operator
helm install external-secrets \
  external-secrets/external-secrets \
  --namespace external-secrets-system \
  --create-namespace
```

**Configure AWS Secrets Manager:**

```yaml
# SecretStore
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: prod
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        secretRef:
          accessKeyIDSecretRef:
            name: aws-credentials
            key: access-key-id
          secretAccessKeySecretRef:
            name: aws-credentials
            key: secret-access-key

---
# ExternalSecret
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: backend-secrets
  namespace: prod
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: backend-secrets
    creationPolicy: Owner
  data:
    - secretKey: database-url
      remoteRef:
        key: portfolio-backend/database-url
    - secretKey: jwt-secret
      remoteRef:
        key: portfolio-backend/jwt-secret
```

### Sealed Secrets

**Install:**

```bash
# Install controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Install CLI
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-linux-amd64
sudo install -m 755 kubeseal-linux-amd64 /usr/local/bin/kubeseal
```

**Create Sealed Secret:**

```bash
# Create secret (don't apply)
kubectl create secret generic backend-secrets \
  --from-literal=database-url='postgresql://...' \
  --dry-run=client -o yaml > secret.yaml

# Seal the secret
kubeseal -f secret.yaml -w sealed-secret.yaml

# Apply sealed secret (safe to commit to Git)
kubectl apply -f sealed-secret.yaml

# Controller will create the actual secret
kubectl get secret backend-secrets -n prod
```

## Monitoring Setup

### Prometheus & Grafana

**Install Prometheus Stack:**

```bash
# Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# Or with MicroK8s addon
microk8s enable prometheus
```

**Access Grafana:**

```bash
# Get admin password
kubectl get secret -n monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 -d

# Port forward
kubectl port-forward -n monitoring svc/prometheus-grafana 3001:80

# Access: http://localhost:3001
# Username: admin
# Password: <from above command>
```

### Service Monitors

**Application Metrics:**

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: backend-api
  namespace: prod
spec:
  selector:
    matchLabels:
      app: backend-api
  endpoints:
    - port: http
      path: /api/v1/metrics
      interval: 30s
```

## Network Policies

### Default Deny

```yaml
# Deny all traffic by default
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: prod
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

### Allow Application Traffic

```yaml
# Allow backend API traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-api-netpol
  namespace: prod
spec:
  podSelector:
    matchLabels:
      app: backend-api
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
```

## Best Practices

### Cluster Security

- ✅ Enable RBAC
- ✅ Use NetworkPolicies
- ✅ Implement PodSecurityPolicies/Standards
- ✅ Run containers as non-root
- ✅ Enable audit logging
- ✅ Keep cluster updated

### Resource Management

- ✅ Set resource requests and limits
- ✅ Use HorizontalPodAutoscaler
- ✅ Configure PodDisruptionBudgets
- ✅ Monitor resource usage
- ✅ Implement LimitRanges

### High Availability

- ✅ Run multiple replicas
- ✅ Use anti-affinity rules
- ✅ Implement health probes
- ✅ Configure PodDisruptionBudgets
- ✅ Use multiple availability zones

## Troubleshooting

### Cluster Issues

```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes
kubectl get pods --all-namespaces

# Check component health
kubectl get componentstatuses

# View cluster events
kubectl get events --all-namespaces --sort-by='.lastTimestamp'
```

### Node Issues

```bash
# Describe node
kubectl describe node <node-name>

# Check node resources
kubectl top nodes

# Drain node (for maintenance)
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Uncordon node
kubectl uncordon <node-name>
```

### Storage Issues

```bash
# Check PVCs
kubectl get pvc --all-namespaces

# Check PVs
kubectl get pv

# Describe PVC
kubectl describe pvc <pvc-name> -n <namespace>

# Check storage class
kubectl get storageclass
```

## Next Steps

- Configure backup solutions
- Set up log aggregation
- Implement distributed tracing
- Configure alerting rules
- Set up disaster recovery
- Document runbooks

## Support

For cluster issues:
- Check status: `kubectl cluster-info`
- View logs: `kubectl logs -n kube-system <pod-name>`
- Get events: `kubectl get events --all-namespaces`
