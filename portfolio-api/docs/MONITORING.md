# Monitoring & Observability Guide

Complete guide for monitoring the Portfolio Backend API in Kubernetes.

## 📋 Table of Contents

- [Monitoring Stack](#monitoring-stack)
- [Metrics Collection](#metrics-collection)
- [Log Aggregation](#log-aggregation)
- [Distributed Tracing](#distributed-tracing)
- [Alerting](#alerting)
- [Dashboards](#dashboards)

## Monitoring Stack

### Architecture Overview

```
┌──────────────────────────────────────────────────┐
│              Application Layer                    │
│  ┌──────────────┐  ┌──────────────┐             │
│  │ Backend API  │  │  Database    │             │
│  │  (Metrics)   │  │  (Metrics)   │             │
│  └──────┬───────┘  └──────┬───────┘             │
│         │                  │                      │
└─────────┼──────────────────┼──────────────────────┘
          │                  │
          │ /metrics         │ pg_exporter
          │                  │
┌─────────▼──────────────────▼──────────────────────┐
│            Collection Layer                        │
│  ┌─────────────────────────────────────┐         │
│  │         Prometheus                   │         │
│  │  - Service discovery                 │         │
│  │  - Time-series database              │         │
│  │  - Alerting rules                    │         │
│  └─────────┬────────────────────────────┘         │
└────────────┼──────────────────────────────────────┘
             │
             │ PromQL queries
             │
┌────────────▼──────────────────────────────────────┐
│         Visualization Layer                        │
│  ┌──────────────┐  ┌──────────────┐              │
│  │   Grafana    │  │ AlertManager │              │
│  │ (Dashboards) │  │ (Notifications)│             │
│  └──────────────┘  └──────────────┘              │
└───────────────────────────────────────────────────┘
```

### Components

| Component | Purpose | Port |
|-----------|---------|------|
| **Prometheus** | Metrics collection & storage | 9090 |
| **Grafana** | Visualization & dashboards | 3000 |
| **AlertManager** | Alert routing & notifications | 9093 |
| **Node Exporter** | Host metrics | 9100 |
| **kube-state-metrics** | Kubernetes metrics | 8080 |
| **Loki** | Log aggregation | 3100 |
| **Jaeger** | Distributed tracing | 16686 |

## Metrics Collection

### Prometheus Installation

**With Helm (Recommended):**

```bash
# Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values - <<EOF
prometheus:
  prometheusSpec:
    retention: 30d
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: microk8s-hostpath
          resources:
            requests:
              storage: 50Gi
    serviceMonitorSelectorNilUsesHelmValues: false
    
grafana:
  enabled: true
  adminPassword: admin
  persistence:
    enabled: true
    storageClassName: microk8s-hostpath
    size: 10Gi
    
alertmanager:
  enabled: true
  config:
    global:
      resolve_timeout: 5m
    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'email'
    receivers:
      - name: 'email'
        email_configs:
          - to: 'alerts@example.com'
            from: 'alertmanager@example.com'
            smarthost: 'smtp.gmail.com:587'
            auth_username: 'alertmanager@example.com'
            auth_password: 'password'
EOF
```

**With MicroK8s Addon:**

```bash
microk8s enable prometheus
```

### Application Metrics

**Expose Metrics Endpoint:**

The backend API already exposes metrics at `/api/v1/metrics`:

```typescript
// src/routes/v1/index.ts
router.get('/metrics', async (request, reply) => {
  const metrics = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    requests: {
      total: requestCounter,
      active: activeRequests
    }
  };
  
  return metrics;
});
```

**Configure Prometheus Annotations:**

```yaml
# k8s/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
spec:
  template:
    metadata:
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/path: "/api/v1/metrics"
        prometheus.io/port: "3000"
    spec:
      containers:
        - name: backend-api
          # ...
```

**ServiceMonitor Configuration:**

```yaml
# k8s/base/servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: backend-api
  labels:
    app: backend-api
spec:
  selector:
    matchLabels:
      app: backend-api
  endpoints:
    - port: http
      path: /api/v1/metrics
      interval: 30s
      scrapeTimeout: 10s
```

### Database Metrics

**PostgreSQL Exporter:**

```yaml
# k8s/base/database/postgres-exporter.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-exporter
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres-exporter
  template:
    metadata:
      labels:
        app: postgres-exporter
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9187"
    spec:
      containers:
        - name: postgres-exporter
          image: prometheuscommunity/postgres-exporter:v0.15.0
          ports:
            - containerPort: 9187
              name: metrics
          env:
            - name: DATA_SOURCE_NAME
              valueFrom:
                secretKeyRef:
                  name: backend-secrets
                  key: database-url
          resources:
            requests:
              memory: 64Mi
              cpu: 50m
            limits:
              memory: 128Mi
              cpu: 100m

---
apiVersion: v1
kind: Service
metadata:
  name: postgres-exporter
  labels:
    app: postgres-exporter
spec:
  selector:
    app: postgres-exporter
  ports:
    - port: 9187
      name: metrics
```

**Key Metrics to Monitor:**

- `pg_up`: Database availability
- `pg_stat_database_numbackends`: Active connections
- `pg_stat_database_xact_commit`: Transaction commits
- `pg_stat_database_xact_rollback`: Transaction rollbacks
- `pg_database_size_bytes`: Database size
- `pg_stat_activity_count`: Active queries

### Redis Metrics

**Redis Exporter:**

```yaml
# k8s/base/redis/redis-exporter.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-exporter
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis-exporter
  template:
    metadata:
      labels:
        app: redis-exporter
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9121"
    spec:
      containers:
        - name: redis-exporter
          image: oliver006/redis_exporter:v1.55.0
          ports:
            - containerPort: 9121
              name: metrics
          env:
            - name: REDIS_ADDR
              value: "redis:6379"
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: backend-secrets
                  key: redis-password
          resources:
            requests:
              memory: 64Mi
              cpu: 50m
            limits:
              memory: 128Mi
              cpu: 100m
```

**Key Metrics:**

- `redis_up`: Redis availability
- `redis_connected_clients`: Connected clients
- `redis_memory_used_bytes`: Memory usage
- `redis_commands_processed_total`: Commands processed
- `redis_keyspace_hits_total`: Cache hits
- `redis_keyspace_misses_total`: Cache misses

## Log Aggregation

### Loki Stack Installation

```bash
# Add Helm repo
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Loki stack
helm install loki grafana/loki-stack \
  --namespace logging \
  --create-namespace \
  --set grafana.enabled=false \
  --set prometheus.enabled=false \
  --set promtail.enabled=true \
  --set loki.persistence.enabled=true \
  --set loki.persistence.storageClassName=microk8s-hostpath \
  --set loki.persistence.size=50Gi
```

### Application Logging

**Structured Logging:**

```typescript
// src/config/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: req.headers,
      remoteAddress: req.ip,
      remotePort: req.socket.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});

// Usage
logger.info({ userId: user.id }, 'User logged in');
logger.error({ err: error, userId: user.id }, 'Failed to process request');
```

### Promtail Configuration

```yaml
# Promtail ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: promtail-config
  namespace: logging
data:
  promtail.yaml: |
    server:
      http_listen_port: 9080
      grpc_listen_port: 0

    positions:
      filename: /tmp/positions.yaml

    clients:
      - url: http://loki:3100/loki/api/v1/push

    scrape_configs:
      - job_name: kubernetes-pods
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            action: keep
            regex: backend-api
          - source_labels: [__meta_kubernetes_namespace]
            target_label: namespace
          - source_labels: [__meta_kubernetes_pod_name]
            target_label: pod
          - source_labels: [__meta_kubernetes_pod_container_name]
            target_label: container
        pipeline_stages:
          - json:
              expressions:
                level: level
                timestamp: time
                message: msg
          - labels:
              level:
          - timestamp:
              source: timestamp
              format: RFC3339
```

### Query Logs in Grafana

**LogQL Examples:**

```logql
# All logs from backend-api
{app="backend-api"}

# Error logs only
{app="backend-api"} |= "level" |= "error"

# Logs for specific user
{app="backend-api"} |= "userId" |= "user123"

# Count errors by endpoint
sum(count_over_time({app="backend-api"} |= "error" [5m])) by (endpoint)

# Response time > 1s
{app="backend-api"} | json | duration > 1000
```

## Distributed Tracing

### Jaeger Installation

```bash
# Install Jaeger Operator
kubectl create namespace observability
kubectl apply -f https://github.com/jaegertracing/jaeger-operator/releases/download/v1.51.0/jaeger-operator.yaml -n observability

# Create Jaeger instance
cat <<EOF | kubectl apply -f -
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: jaeger
  namespace: observability
spec:
  strategy: production
  storage:
    type: elasticsearch
    elasticsearch:
      nodeCount: 3
      resources:
        requests:
          memory: 2Gi
          cpu: 500m
        limits:
          memory: 4Gi
          cpu: 1000m
EOF
```

### Application Tracing

**Install OpenTelemetry:**

```bash
npm install @opentelemetry/api \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-jaeger
```

**Configure Tracing:**

```typescript
// src/config/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger-collector:14268/api/traces',
});

const sdk = new NodeSDK({
  traceExporter: jaegerExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
  serviceName: 'backend-api',
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

**Custom Spans:**

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('backend-api');

export async function processOrder(orderId: string) {
  const span = tracer.startSpan('processOrder');
  span.setAttribute('order.id', orderId);
  
  try {
    // Process order
    const order = await fetchOrder(orderId);
    span.addEvent('order.fetched');
    
    await validateOrder(order);
    span.addEvent('order.validated');
    
    await saveOrder(order);
    span.addEvent('order.saved');
    
    span.setStatus({ code: SpanStatusCode.OK });
    return order;
  } catch (error) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    throw error;
  } finally {
    span.end();
  }
}
```

## Alerting

### AlertManager Configuration

```yaml
# alertmanager-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
      slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
      
    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'default'
      routes:
        - match:
            severity: critical
          receiver: 'pagerduty'
          continue: true
        - match:
            severity: warning
          receiver: 'slack'
          
    receivers:
      - name: 'default'
        email_configs:
          - to: 'team@example.com'
            from: 'alertmanager@example.com'
            smarthost: 'smtp.gmail.com:587'
            auth_username: 'alertmanager@example.com'
            auth_password: 'password'
            
      - name: 'slack'
        slack_configs:
          - channel: '#alerts'
            title: '{{ .GroupLabels.alertname }}'
            text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
            
      - name: 'pagerduty'
        pagerduty_configs:
          - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
```

### Prometheus Alert Rules

```yaml
# prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: backend-api-alerts
  namespace: monitoring
spec:
  groups:
    - name: backend-api
      interval: 30s
      rules:
        # High error rate
        - alert: HighErrorRate
          expr: |
            (
              sum(rate(http_requests_total{job="backend-api",status=~"5.."}[5m]))
              /
              sum(rate(http_requests_total{job="backend-api"}[5m]))
            ) > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "High error rate detected"
            description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"
            
        # High response time
        - alert: HighResponseTime
          expr: |
            histogram_quantile(0.95,
              sum(rate(http_request_duration_seconds_bucket{job="backend-api"}[5m])) by (le)
            ) > 1
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High response time detected"
            description: "95th percentile response time is {{ $value }}s (threshold: 1s)"
            
        # Low pod count
        - alert: LowPodCount
          expr: |
            count(up{job="backend-api"} == 1) < 2
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Low pod count"
            description: "Only {{ $value }} pod(s) running (expected: 2+)"
            
        # Database connection issues
        - alert: DatabaseConnectionFailed
          expr: |
            pg_up{job="postgres-exporter"} == 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "Database connection failed"
            description: "Cannot connect to PostgreSQL database"
            
        # High memory usage
        - alert: HighMemoryUsage
          expr: |
            (
              container_memory_working_set_bytes{pod=~"backend-api-.*"}
              /
              container_spec_memory_limit_bytes{pod=~"backend-api-.*"}
            ) > 0.90
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High memory usage"
            description: "Memory usage is {{ $value | humanizePercentage }} (threshold: 90%)"
            
        # High CPU usage
        - alert: HighCPUUsage
          expr: |
            (
              rate(container_cpu_usage_seconds_total{pod=~"backend-api-.*"}[5m])
            ) > 0.80
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "High CPU usage"
            description: "CPU usage is {{ $value | humanizePercentage }} (threshold: 80%)"
```

## Dashboards

### Grafana Datasources

```yaml
# grafana-datasources.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasources
  namespace: monitoring
data:
  datasources.yaml: |
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        access: proxy
        url: http://prometheus-server:9090
        isDefault: true
        
      - name: Loki
        type: loki
        access: proxy
        url: http://loki:3100
        
      - name: Jaeger
        type: jaeger
        access: proxy
        url: http://jaeger-query:16686
```

### Application Dashboard

```json
{
  "dashboard": {
    "title": "Backend API - Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{job=\"backend-api\"}[5m])) by (status)"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Response Time (95th percentile)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job=\"backend-api\"}[5m])) by (le, endpoint))"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{job=\"backend-api\",status=~\"5..\"}[5m])) / sum(rate(http_requests_total{job=\"backend-api\"}[5m]))"
          }
        ],
        "type": "stat"
      },
      {
        "title": "Active Connections",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends{datname=\"portfolio\"}"
          }
        ],
        "type": "stat"
      }
    ]
  }
}
```

### Database Dashboard

Import official PostgreSQL dashboard:

```bash
# Dashboard ID: 9628
# URL: https://grafana.com/grafana/dashboards/9628
```

### Kubernetes Dashboard

Import official Kubernetes dashboard:

```bash
# Dashboard ID: 15760 (Kubernetes / Views / Global)
# URL: https://grafana.com/grafana/dashboards/15760
```

## SLO/SLI Definitions

### Service Level Indicators (SLIs)

**Availability:**
```promql
# Target: 99.9% uptime
sum(rate(http_requests_total{job="backend-api",status!~"5.."}[30d]))
/
sum(rate(http_requests_total{job="backend-api"}[30d]))
```

**Latency:**
```promql
# Target: 95% of requests < 500ms
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket{job="backend-api"}[30d])) by (le)
) < 0.5
```

**Error Rate:**
```promql
# Target: < 1% error rate
sum(rate(http_requests_total{job="backend-api",status=~"5.."}[30d]))
/
sum(rate(http_requests_total{job="backend-api"}[30d]))
< 0.01
```

### Service Level Objectives (SLOs)

| Metric | SLO | Measurement Window |
|--------|-----|-------------------|
| Availability | 99.9% | 30 days |
| Latency (p95) | < 500ms | 30 days |
| Latency (p99) | < 1s | 30 days |
| Error Rate | < 1% | 30 days |
| Database Query Time (p95) | < 100ms | 30 days |

## Best Practices

### Metrics

- ✅ Use consistent naming conventions
- ✅ Add meaningful labels
- ✅ Avoid high cardinality labels
- ✅ Set appropriate scrape intervals
- ✅ Monitor the four golden signals (latency, traffic, errors, saturation)

### Logging

- ✅ Use structured logging (JSON)
- ✅ Include correlation IDs
- ✅ Log at appropriate levels
- ✅ Sanitize sensitive data
- ✅ Aggregate logs centrally

### Tracing

- ✅ Trace critical paths
- ✅ Add custom spans for business logic
- ✅ Include relevant attributes
- ✅ Sample traces appropriately
- ✅ Monitor trace overhead

### Alerting

- ✅ Alert on symptoms, not causes
- ✅ Make alerts actionable
- ✅ Avoid alert fatigue
- ✅ Define escalation policies
- ✅ Document runbooks

## Troubleshooting

### No Metrics Being Collected

```bash
# Check ServiceMonitor
kubectl get servicemonitor -n monitoring

# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-server 9090:9090
# Visit: http://localhost:9090/targets

# Check pod annotations
kubectl get pod -n prod <pod-name> -o jsonpath='{.metadata.annotations}'
```

### Logs Not Appearing

```bash
# Check Promtail
kubectl logs -n logging -l app=promtail

# Check Loki
kubectl logs -n logging -l app=loki

# Test log query
kubectl port-forward -n monitoring svc/grafana 3000:3000
# Grafana -> Explore -> Loki -> Query: {app="backend-api"}
```

### High Cardinality Issues

```promql
# Find high cardinality metrics
topk(10, count by (__name__)({__name__=~".+"}))

# Check label values
count by (label_name) (metric_name)
```

## Next Steps

- Configure additional exporters
- Set up custom dashboards
- Implement capacity planning
- Configure backup for Prometheus data
- Set up federated Prometheus for multi-cluster
- Implement chaos engineering

## Support

For monitoring issues:
- Check Prometheus: `kubectl port-forward -n monitoring svc/prometheus-server 9090:9090`
- Check Grafana: `kubectl port-forward -n monitoring svc/grafana 3000:3000`
- View logs: `kubectl logs -n monitoring -l app=prometheus`
